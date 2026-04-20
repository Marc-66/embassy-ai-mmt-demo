import { useState, useEffect } from 'react';
import { OntologyNode } from '@/types/ontology';
import { Parser, Store, DataFactory } from 'n3';

const { namedNode } = DataFactory;

const RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
const RDFS_LABEL = 'http://www.w3.org/2000/01/rdf-schema#label';
const RDFS_COMMENT = 'http://www.w3.org/2000/01/rdf-schema#comment';
const OWL_CLASS = 'http://www.w3.org/2002/07/owl#Class';
const OWL_OBJECT_PROPERTY = 'http://www.w3.org/2002/07/owl#ObjectProperty';
const OWL_DATATYPE_PROPERTY = 'http://www.w3.org/2002/07/owl#DatatypeProperty';

export function useInstanceLoader(selectedFilePaths: string[]) {
  const [instances, setInstances] = useState<OntologyNode[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadInstances = async () => {
      if (selectedFilePaths.length === 0) {
        setInstances([]);
        return;
      }

      setLoading(true);
      const allInstances: OntologyNode[] = [];

      for (const filePath of selectedFilePaths) {
        try {
          const response = await fetch(`/api/ontologies/${encodeURIComponent(filePath)}`);

          if (!response.ok) {
            const body = await response.text();
            throw new Error(`Failed to fetch ${filePath}: ${response.status} ${response.statusText} - ${body}`);
          }

          const content = await response.text();
          const fileInstances = await extractInstances(content, filePath);
          allInstances.push(...fileInstances);
        } catch (error) {
          console.error(`Failed to load instances from ${filePath}:`, error);
        }
      }

      setInstances(allInstances);
      setLoading(false);
    };

    loadInstances();
  }, [selectedFilePaths]);

  return { instances, loading };
}

async function extractInstances(content: string, filename: string): Promise<OntologyNode[]> {
  return new Promise((resolve, reject) => {
    const parser = new Parser({ format: 'Turtle' });
    const store = new Store();

    parser.parse(content, (error, quad, prefixes) => {
      if (error) {
        reject(error);
        return;
      }

      if (quad) {
        store.addQuad(quad);
      } else {
        // Parsing complete
        try {
          const instances = extractInstancesFromStore(store, filename);
          resolve(instances);
        } catch (err) {
          reject(err);
        }
      }
    });
  });
}

function extractInstancesFromStore(store: Store, filename: string): OntologyNode[] {
  const instances: OntologyNode[] = [];
  
  // First, identify what are classes/properties (schema)
  const classUris = new Set<string>();
  const propertyUris = new Set<string>();
  
  store.getQuads(null, namedNode(RDF_TYPE), namedNode(OWL_CLASS), null).forEach(q => {
    classUris.add(q.subject.value);
  });
  
  store.getQuads(null, namedNode(RDF_TYPE), namedNode(OWL_OBJECT_PROPERTY), null).forEach(q => {
    propertyUris.add(q.subject.value);
  });
  
  store.getQuads(null, namedNode(RDF_TYPE), namedNode(OWL_DATATYPE_PROPERTY), null).forEach(q => {
    propertyUris.add(q.subject.value);
  });

  // OWL meta-classes to skip
  const owlMetaClasses = new Set([
    OWL_CLASS, 
    OWL_OBJECT_PROPERTY, 
    OWL_DATATYPE_PROPERTY,
    'http://www.w3.org/2002/07/owl#Ontology',
    'http://www.w3.org/2004/02/skos/core#ConceptScheme',
    'http://www.w3.org/2004/02/skos/core#Concept'
  ]);

  // Find all instances
  const typeQuads = store.getQuads(null, namedNode(RDF_TYPE), null, null);
  const instanceMap = new Map<string, { types: Set<string>; props: Map<string, any[]> }>();
  
  for (const quad of typeQuads) {
    const subject = quad.subject.value;
    const typeUri = quad.object.value;
    
    // Skip if this is a class/property definition or OWL meta-class
    if (classUris.has(subject) || propertyUris.has(subject) || owlMetaClasses.has(typeUri)) {
      continue;
    }
    
    // This is an instance
    if (!instanceMap.has(subject)) {
      instanceMap.set(subject, { types: new Set(), props: new Map() });
    }
    instanceMap.get(subject)!.types.add(typeUri);
  }
  
  // Extract properties for each instance
  for (const [instanceUri, data] of instanceMap.entries()) {
    const instanceQuads = store.getQuads(namedNode(instanceUri), null, null, null);
    
    for (const quad of instanceQuads) {
      const predicate = quad.predicate.value;
      
      // Skip rdf:type as we already captured it
      if (predicate === RDF_TYPE) continue;
      
      const value = quad.object.termType === 'Literal' 
        ? quad.object.value 
        : quad.object.value;
      
      if (!data.props.has(predicate)) {
        data.props.set(predicate, []);
      }
      data.props.get(predicate)!.push(value);
    }
  }
  
  // Create instance nodes
  for (const [instanceUri, data] of instanceMap.entries()) {
    const types = Array.from(data.types);
    const primaryType = types[0] || 'unknown';
    
    const label = getLabel(store, instanceUri) || 
                  instanceUri.split('#').pop() || 
                  instanceUri.split('/').pop() || 
                  instanceUri;
    
    const comment = getFirstValue(store, instanceUri, RDFS_COMMENT);
    
    // Convert props Map to object
    const properties: { [key: string]: any } = {};
    for (const [key, values] of data.props.entries()) {
      properties[key] = values.length === 1 ? values[0] : values;
    }
    
    // Debug logging
    if (instanceUri.includes('Task_FoundationPour')) {
      console.log('Found Task_FoundationPour:', {
        uri: instanceUri,
        properties: Object.keys(properties),
        hasTaskStep: properties['http://juri.be/ontology/work#hasTaskStep']
      });
    }
    
    instances.push({
      id: instanceUri,
      label,
      type: 'instance',
      nodeType: primaryType,
      sourceFile: filename,
      metadata: {
        comment,
        instanceOf: primaryType,
        properties
      }
    });
  }
  
  console.log(`Extracted ${instances.length} instances from ${filename}`);
  
  return instances;
}

function getLabel(store: Store, uri: string): string {
  const labelQuads = store.getQuads(namedNode(uri), namedNode(RDFS_LABEL), null, null);
  if (labelQuads.length > 0) {
    return labelQuads[0].object.value;
  }
  return '';
}

function getFirstValue(store: Store, uri: string, predicate: string): string | undefined {
  const quads = store.getQuads(namedNode(uri), namedNode(predicate), null, null);
  if (quads.length > 0) {
    return quads[0].object.value;
  }
  return undefined;
}
