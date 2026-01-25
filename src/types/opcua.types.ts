// OPC UA Node Classes
export enum NodeClass {
  Object = 'Object',
  Variable = 'Variable',
  Method = 'Method',
  ObjectType = 'ObjectType',
  VariableType = 'VariableType',
  ReferenceType = 'ReferenceType',
  DataType = 'DataType',
  View = 'View',
}

// OPC UA Reference
export interface OpcUaReference {
  referenceType: string;
  isForward: boolean;
  targetNodeId: string;
}

// OPC UA Node
export interface OpcUaNode {
  nodeId: string;
  browseName: string;
  displayName: string;
  nodeClass: NodeClass;
  description?: string;
  dataType?: string;
  valueRank?: number;
  modellingRule?: string;
  type?: string;
  typeDefinition?: string;
  derivedFrom?: string;
  references: OpcUaReference[];
  children?: OpcUaNode[];
}

// Parsed Nodeset (entire nodeset data structure)
export interface ParsedNodeset {
  fileName: string;
  namespaceUri: string;
  namespaceIndex: number;
  nodes: Map<string, OpcUaNode>;
  rootNodes: OpcUaNode[];
}

// Nodeset Metadata
export interface NodesetMetadata {
  fileName: string;
  namespaceUri: string;
  publicationDate?: string;
  version?: string;
  nodeCount: number;
  loadedAt: Date;
  id: string;
  name: string;
  filePath?: string;
  fileSize: number;
  namespaces: Namespace[];
  checksum?: string;
}

// OPC UA Nodeset
export interface OpcUaNodeset {
  fileName: string;
  namespaceUri: string;
  namespaceIndex: number;
  nodes: Map<string, OpcUaNode>;
  rootNodes: OpcUaNode[];
  
}

// OPC UA Nodeset
export interface OpcUaNodeset {
  fileName: string;
  namespaceUri: string;
  namespaceIndex: number;
  nodes: Map<string, OpcUaNode>;
  rootNodes: OpcUaNode[];
}

// Namespace entry
export interface Namespace {
  index: number;
  uri: string;
}