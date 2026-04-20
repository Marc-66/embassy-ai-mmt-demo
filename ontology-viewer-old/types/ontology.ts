export interface OntologyNode {
  id: string;              // URI (e.g., ":Customer")
  label: string;           // Display name
  type: 'class' | 'property' | 'instance';
  nodeType: 'owl:Class' | 'owl:ObjectProperty' | 'owl:DatatypeProperty';
  sourceFile: string;      // Which TTL file (for filtering/coloring)
  metadata: {
    comment?: string;
    subClassOf?: string[];
    domain?: string;
    range?: string;
    examples?: string[];
    altLabels?: string[];
    definition?: string;
    dataProperties?: DataProperty[];  // Data properties for this class
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
  label: string;
  range?: string;
  comment?: string;
  examples?: string[];
}

export interface OntologyEdge {
  source: string | OntologyNode;
  target: string | OntologyNode;
  type: 'subClassOf' | 'objectProperty' | 'domain' | 'range';
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
