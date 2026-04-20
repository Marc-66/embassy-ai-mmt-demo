export interface LocalizedText {
  [lang: string]: string | string[];
}

export interface OntologyNode {
  id: string;              // URI (e.g., ":Customer")
  label: string | LocalizedText;           // Display name (string for backward compat, or localized)
  type: 'class' | 'property' | 'instance' | 'literal';
  nodeType: 'owl:Class' | 'owl:ObjectProperty' | 'owl:DatatypeProperty' | 'literal' | string;
  sourceFile: string;      // Which TTL file (for filtering/coloring)
  metadata: {
    comment?: string | LocalizedText;
    subClassOf?: string[];
    domain?: string;
    range?: string;
    examples?: string[] | LocalizedText;
    altLabels?: string[] | LocalizedText;
    definition?: string | LocalizedText;
    dataProperties?: DataProperty[];  // Data properties for this class
    instanceOf?: string;    // For instances: the class this instance belongs to
    properties?: { [key: string]: any };  // For instances: property values
  };
  x?: number;             // D3 force simulation
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface DataProperty {
  uri: string;
  label: string | LocalizedText;
  range?: string;
  comment?: string | LocalizedText;
  examples?: string[] | LocalizedText;
}

export interface OntologyEdge {
  source: string | OntologyNode;
  target: string | OntologyNode;
  type: 'subClassOf' | 'objectProperty' | 'domain' | 'range' | 'instanceOf' | 'dataProperty';
  label: string;
  sourceFile: string;
}

export interface OntologyGraph {
  nodes: OntologyNode[];
  edges: OntologyEdge[];
  files: string[];
}

export interface OntologyFile {
  name: string;
  path: string;
  relativePath: string;
  folder: 'ontologies' | 'reference-models';
  selected: boolean;
}
