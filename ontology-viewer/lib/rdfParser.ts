import { Parser, Store, DataFactory, Quad } from 'n3';
import { OntologyGraph, OntologyNode, OntologyEdge, DataProperty, LocalizedText } from '@/types/ontology';

const { namedNode } = DataFactory;

// RDF/OWL/RDFS namespaces
const RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
const RDFS_LABEL = 'http://www.w3.org/2000/01/rdf-schema#label';
const RDFS_COMMENT = 'http://www.w3.org/2000/01/rdf-schema#comment';
const RDFS_SUBCLASS = 'http://www.w3.org/2000/01/rdf-schema#subClassOf';
const RDFS_DOMAIN = 'http://www.w3.org/2000/01/rdf-schema#domain';
const RDFS_RANGE = 'http://www.w3.org/2000/01/rdf-schema#range';
const OWL_CLASS = 'http://www.w3.org/2002/07/owl#Class';
const OWL_OBJECT_PROPERTY = 'http://www.w3.org/2002/07/owl#ObjectProperty';
const OWL_DATATYPE_PROPERTY = 'http://www.w3.org/2002/07/owl#DatatypeProperty';
const SKOS_ALT_LABEL = 'http://www.w3.org/2004/02/skos/core#altLabel';
const SKOS_DEFINITION = 'http://www.w3.org/2004/02/skos/core#definition';
const SKOS_EXAMPLE = 'http://www.w3.org/2004/02/skos/core#example';

/**
 * Parse a Turtle/RDF ontology file and convert it to our graph structure
 */
export async function parseOntologyFile(content: string, filename: string): Promise<OntologyGraph> {
  return new Promise((resolve, reject) => {
    const parser = new Parser({ format: 'Turtle' });
    const store = new Store();

    parser.parse(content, (error, quad, prefixes) => {
      if (error) {
        console.error(`Parse error in ${filename}:`, error);
        reject(error);
        return;
      }

      if (quad) {
        store.addQuad(quad);
      } else {
        // Parsing complete
        try {
          const graph = extractGraph(store, filename);
          resolve(graph);
        } catch (err) {
          reject(err);
        }
      }
    });
  });
}

/**
 * Extract nodes and edges from an N3 Store
 */
function extractGraph(store: Store, filename: string): OntologyGraph {
  const nodes: OntologyNode[] = [];
  const edges: OntologyEdge[] = [];
  const nodeMap = new Map<string, OntologyNode>();

  // Find all classes
  const classes = store.getQuads(null, namedNode(RDF_TYPE), namedNode(OWL_CLASS), null);
  for (const quad of classes) {
    const uri = quad.subject.value;
    const label = getLabel(store, uri);
    const comment = getFirstValue(store, uri, RDFS_COMMENT);
    
    const node: OntologyNode = {
      id: uri,
      label,
      type: 'class',
      nodeType: 'owl:Class',
      sourceFile: filename,
      metadata: {
        comment,
        subClassOf: getUriValues(store, uri, RDFS_SUBCLASS),
        altLabels: getValues(store, uri, SKOS_ALT_LABEL),
        definition: getFirstValue(store, uri, SKOS_DEFINITION),
        examples: getValues(store, uri, SKOS_EXAMPLE),
        dataProperties: getDataProperties(store, uri, filename)
      }
    };

    nodes.push(node);
    nodeMap.set(uri, node);
  }

  // Find all object properties
  const objectProps = store.getQuads(null, namedNode(RDF_TYPE), namedNode(OWL_OBJECT_PROPERTY), null);
  for (const quad of objectProps) {
    const uri = quad.subject.value;
    const label = getLabel(store, uri);
    const comment = getFirstValue(store, uri, RDFS_COMMENT);
    const domain = getFirstUriValue(store, uri, RDFS_DOMAIN);
    const range = getFirstUriValue(store, uri, RDFS_RANGE);

    const node: OntologyNode = {
      id: uri,
      label,
      type: 'property',
      nodeType: 'owl:ObjectProperty',
      sourceFile: filename,
      metadata: {
        comment,
        domain,
        range,
        altLabels: getValues(store, uri, SKOS_ALT_LABEL),
        definition: getFirstValue(store, uri, SKOS_DEFINITION),
        examples: getValues(store, uri, SKOS_EXAMPLE)
      }
    };

    nodes.push(node);
    nodeMap.set(uri, node);

    // Create edges for domain and range
    if (domain && nodeMap.has(domain)) {
      edges.push({
        source: domain,
        target: uri,
        type: 'domain',
        label: 'domain',
        sourceFile: filename
      });
    }

    if (range && nodeMap.has(range)) {
      edges.push({
        source: uri,
        target: range,
        type: 'range',
        label: 'range',
        sourceFile: filename
      });
    }
  }

  // Create subClassOf edges
  for (const node of nodes) {
    if (node.metadata.subClassOf) {
      for (const parent of node.metadata.subClassOf) {
        edges.push({
          source: node.id,
          target: parent,
          type: 'subClassOf',
          label: 'subClassOf',
          sourceFile: filename
        });
      }
    }
  }

  return {
    nodes,
    edges,
    files: [filename]
  };
}

/**
 * Get data properties for a class
 */
function getDataProperties(store: Store, classUri: string, filename: string): DataProperty[] {
  const properties: DataProperty[] = [];
  
  // Find all datatype properties
  const datatypeProps = store.getQuads(null, namedNode(RDF_TYPE), namedNode(OWL_DATATYPE_PROPERTY), null);
  
  for (const quad of datatypeProps) {
    const propUri = quad.subject.value;
    const domain = getFirstUriValue(store, propUri, RDFS_DOMAIN);
    
    // Only include if domain matches this class
    if (domain === classUri) {
      properties.push({
        uri: propUri,
        label: getLabel(store, propUri),
        range: getFirstUriValue(store, propUri, RDFS_RANGE),
        comment: getFirstValue(store, propUri, RDFS_COMMENT),
        examples: getValues(store, propUri, SKOS_EXAMPLE)
      });
    }
  }
  
  return properties;
}

/**
 * Get a human-readable label for a URI (with language support)
 */
function getLabel(store: Store, uri: string): string | LocalizedText {
  const labelQuads = store.getQuads(namedNode(uri), namedNode(RDFS_LABEL), null, null);
  
  if (labelQuads.length > 0) {
    // Check if we have multiple languages
    const labels: LocalizedText = {};
    let hasLanguageTags = false;
    
    for (const quad of labelQuads) {
      if (quad.object.termType === 'Literal' && (quad.object as any).language) {
        const lang = (quad.object as any).language;
        labels[lang] = quad.object.value;
        hasLanguageTags = true;
      } else {
        // No language tag, use as default
        labels['en'] = quad.object.value;
      }
    }
    
    // If we have language tags, return localized object
    if (hasLanguageTags && Object.keys(labels).length > 0) {
      return labels;
    }
    
    // Otherwise return simple string (backward compatibility)
    return labelQuads[0].object.value;
  }

  // Fallback: extract from URI
  const parts = uri.split(/[#/]/);
  return parts[parts.length - 1] || uri;
}

/**
 * Get first value of a predicate (with language support)
 */
function getFirstValue(store: Store, subject: string, predicate: string): string | LocalizedText | undefined {
  const quads = store.getQuads(namedNode(subject), namedNode(predicate), null, null);
  
  if (quads.length === 0) return undefined;
  
  // Check if we have multiple languages
  const values: LocalizedText = {};
  let hasLanguageTags = false;
  
  for (const quad of quads) {
    if (quad.object.termType === 'Literal' && (quad.object as any).language) {
      const lang = (quad.object as any).language;
      values[lang] = quad.object.value;
      hasLanguageTags = true;
    } else {
      // No language tag, use as default
      values['en'] = quad.object.value;
    }
  }
  
  // If we have language tags, return localized object
  if (hasLanguageTags && Object.keys(values).length > 0) {
    return values;
  }
  
  // Otherwise return simple string
  return quads[0].object.value;
}

/**
 * Get all values of a predicate (with language support)
 */
function getValues(store: Store, subject: string, predicate: string): string[] | LocalizedText {
  const quads = store.getQuads(namedNode(subject), namedNode(predicate), null, null);
  
  if (quads.length === 0) return [];
  
  // Check if we have language tags
  const valuesByLang: { [lang: string]: string[] } = {};
  let hasLanguageTags = false;
  
  for (const quad of quads) {
    if (quad.object.termType === 'Literal' && (quad.object as any).language) {
      const lang = (quad.object as any).language;
      if (!valuesByLang[lang]) valuesByLang[lang] = [];
      valuesByLang[lang].push(quad.object.value);
      hasLanguageTags = true;
    } else {
      // No language tag, use as default
      if (!valuesByLang['en']) valuesByLang['en'] = [];
      valuesByLang['en'].push(quad.object.value);
    }
  }
  
  // If we have language tags, return localized object with arrays
  if (hasLanguageTags && Object.keys(valuesByLang).length > 0) {
    return valuesByLang as LocalizedText;
  }
  
  // Otherwise return simple string array
  return quads.map(q => q.object.value);
}

/**
 * Get all URI values of a predicate (for non-localized references like subClassOf)
 */
function getUriValues(store: Store, subject: string, predicate: string): string[] {
  const quads = store.getQuads(namedNode(subject), namedNode(predicate), null, null);
  return quads.map(q => q.object.value);
}

/**
 * Get first URI value of a predicate (for non-localized single values like domain/range)
 */
function getFirstUriValue(store: Store, subject: string, predicate: string): string | undefined {
  const quads = store.getQuads(namedNode(subject), namedNode(predicate), null, null);
  return quads.length > 0 ? quads[0].object.value : undefined;
}

/**
 * Merge multiple ontology graphs into one
 */
export function mergeGraphs(graphs: OntologyGraph[]): OntologyGraph {
  const allNodes: OntologyNode[] = [];
  const allEdges: OntologyEdge[] = [];
  const allFiles: string[] = [];
  const nodeMap = new Map<string, OntologyNode>();

  for (const graph of graphs) {
    // Merge nodes (avoid duplicates by URI)
    for (const node of graph.nodes) {
      if (!nodeMap.has(node.id)) {
        allNodes.push(node);
        nodeMap.set(node.id, node);
      } else {
        // Node exists, prefer new metadata (last wins)
        const existing = nodeMap.get(node.id)!;
        // Merge subClassOf (always an array of URIs)
        const mergedSubClassOf = [
          ...(existing.metadata.subClassOf || []),
          ...(node.metadata.subClassOf || [])
        ].filter((v, i, a) => a.indexOf(v) === i);
        
        existing.metadata = {
          ...existing.metadata,
          ...node.metadata,
          subClassOf: mergedSubClassOf,
          dataProperties: [
            ...(existing.metadata.dataProperties || []),
            ...(node.metadata.dataProperties || [])
          ]
        };
      }
    }

    // Merge edges (avoid duplicates)
    for (const edge of graph.edges) {
      const edgeKey = `${typeof edge.source === 'string' ? edge.source : edge.source.id}-${edge.type}-${typeof edge.target === 'string' ? edge.target : edge.target.id}`;
      if (!allEdges.some(e => {
        const eKey = `${typeof e.source === 'string' ? e.source : e.source.id}-${e.type}-${typeof e.target === 'string' ? e.target : e.target.id}`;
        return eKey === edgeKey;
      })) {
        allEdges.push(edge);
      }
    }

    // Merge file list
    allFiles.push(...graph.files);
  }

  // Filter out edges that reference non-existent nodes
  const validEdges = allEdges.filter(edge => {
    const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
    const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
    return nodeMap.has(sourceId) && nodeMap.has(targetId);
  });

  return {
    nodes: allNodes,
    edges: validEdges,
    files: allFiles.filter((v, i, a) => a.indexOf(v) === i) // dedupe
  };
}
