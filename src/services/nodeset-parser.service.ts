import { OpcUaNode, OpcUaNodeset, NodeClass, OpcUaReference } from '@/types/opcua.types';

export class NodesetParser {
  /**
   * Parse an OPC UA nodeset XML file with optional reference nodesets
   */
  async parseNodeset(xmlContent: string, fileName: string = 'unknown.xml', referenceNodesets: string[] = []): Promise<OpcUaNodeset> {
    try {
      const parser = new DOMParser();
      
      // Parse all reference nodesets first to build alias maps
      referenceNodesets.forEach((refXml) => {
        const refDoc = parser.parseFromString(refXml, 'text/xml');
        const refNodeSet = refDoc.querySelector('UANodeSet');
        if (refNodeSet) {
          this.parseAliases(refNodeSet);
          this.parseNodeNames(refNodeSet);
        }
      });
      
      // Parse main nodeset
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      
      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error(`Failed to parse XML: ${parserError.textContent}`);
      }

      const nodeset = this.processNodeset(xmlDoc, fileName);
      return nodeset;
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to parse nodeset');
    }
  }

  private aliasMap: Map<string, string> = new Map();
  private nodeNameMap: Map<string, string> = new Map();

  /**
   * Process parsed XML into OPC UA nodeset structure
   */
  private processNodeset(xmlDoc: Document, fileName: string): OpcUaNodeset {
    const uaNodeSet = xmlDoc.querySelector('UANodeSet');
    
    if (!uaNodeSet) {
      throw new Error('Invalid nodeset format: UANodeSet element not found');
    }

    // Extract namespace URI
    const namespaceUrisElement = uaNodeSet.querySelector('NamespaceUris');
    let namespaceUri = 'http://opcfoundation.org/UA/';
    
    if (namespaceUrisElement) {
      const uriElement = namespaceUrisElement.querySelector('Uri');
      if (uriElement?.textContent) {
        namespaceUri = uriElement.textContent;
      }
    }

    // Parse aliases
    this.parseAliases(uaNodeSet);

    const nodes = new Map<string, OpcUaNode>();
    const rootNodes: OpcUaNode[] = [];

    // Parse different node types
    const nodeTypes = [
      'UAObject',
      'UAVariable',
      'UAMethod',
      'UAObjectType',
      'UAVariableType',
      'UAReferenceType',
      'UADataType',
      'UAView',
    ];

    nodeTypes.forEach(nodeType => {
      const nodeElements = uaNodeSet.querySelectorAll(nodeType);
      nodeElements.forEach((xmlNode) => {
        const node = this.parseNode(xmlNode, nodeType);
        if (node) {
          nodes.set(node.nodeId, node);
        }
      });
    });

    // Build hierarchy
    this.buildHierarchy(nodes);

    // Create organized root structure with type categories only
    const typeCategories = this.organizeIntoCategories(nodes);
    rootNodes.push(...typeCategories);

    return {
      fileName,
      namespaceUri,
      namespaceIndex: 1,
      nodes,
      rootNodes,
    };
  }

  /**
   * Organize nodes into type categories
   */
  private organizeIntoCategories(nodes: Map<string, OpcUaNode>): OpcUaNode[] {
    const categories: OpcUaNode[] = [];

    // Create category nodes
    const dataTypesCategory = this.createCategoryNode('DataTypes', NodeClass.DataType);
    const eventTypesCategory = this.createCategoryNode('EventTypes', NodeClass.ObjectType);
    const interfaceTypesCategory = this.createCategoryNode('InterfaceTypes', NodeClass.ObjectType);
    const objectTypesCategory = this.createCategoryNode('ObjectTypes', NodeClass.ObjectType);
    const referenceTypesCategory = this.createCategoryNode('ReferenceTypes', NodeClass.ReferenceType);
    const variableTypesCategory = this.createCategoryNode('VariableTypes', NodeClass.VariableType);

    // Collect type nodes
    nodes.forEach(node => {
      if (node.nodeClass === NodeClass.DataType) {
        dataTypesCategory.children!.push(node);
      } else if (node.nodeClass === NodeClass.ReferenceType) {
        referenceTypesCategory.children!.push(node);
      } else if (node.nodeClass === NodeClass.VariableType) {
        variableTypesCategory.children!.push(node);
      } else if (node.nodeClass === NodeClass.ObjectType) {
        // Distinguish between EventTypes, InterfaceTypes, and regular ObjectTypes
        const browseName = node.browseName.toLowerCase();
        if (browseName.includes('event') || this.hasEventTypeReference(node)) {
          eventTypesCategory.children!.push(node);
        } else if (browseName.includes('interface') || this.hasInterfaceReference(node)) {
          interfaceTypesCategory.children!.push(node);
        } else {
          objectTypesCategory.children!.push(node);
        }
      }
    });

    // Only add categories that have children
    if (dataTypesCategory.children!.length > 0) categories.push(dataTypesCategory);
    if (eventTypesCategory.children!.length > 0) categories.push(eventTypesCategory);
    if (interfaceTypesCategory.children!.length > 0) categories.push(interfaceTypesCategory);
    if (objectTypesCategory.children!.length > 0) categories.push(objectTypesCategory);
    if (referenceTypesCategory.children!.length > 0) categories.push(referenceTypesCategory);
    if (variableTypesCategory.children!.length > 0) categories.push(variableTypesCategory);

    return categories;
  }

  /**
   * Create a category node for organizing types
   */
  private createCategoryNode(name: string, nodeClass: NodeClass): OpcUaNode {
    return {
      nodeId: `Category_${name}`,
      browseName: name,
      displayName: name,
      nodeClass,
      references: [],
      children: [],
    };
  }

  /**
   * Check if node has EventType reference
   */
  private hasEventTypeReference(node: OpcUaNode): boolean {
    return node.references.some(ref => 
      ref.referenceType === 'HasSubtype' && 
      ref.targetNodeId.includes('EventType')
    );
  }

  /**
   * Check if node has Interface reference
   */
  private hasInterfaceReference(node: OpcUaNode): boolean {
    return node.references.some(ref => 
      ref.referenceType === 'HasInterface' ||
      (ref.referenceType === 'HasSubtype' && ref.targetNodeId.includes('Interface'))
    );
  }

  /**
   * Parse individual node from XML
   */
  private parseNode(xmlNode: Element, nodeType: string): OpcUaNode | null {
    const nodeId = xmlNode.getAttribute('NodeId');
    if (!nodeId) {
      return null;
    }

    const nodeClass = this.getNodeClass(nodeType);
    
    const displayName = this.getElementText(xmlNode, 'DisplayName');
    const description = this.getElementText(xmlNode, 'Description');
    const browseName = xmlNode.getAttribute('BrowseName') || displayName;

    const references: OpcUaReference[] = [];
    const referencesElement = xmlNode.querySelector('References');
    if (referencesElement) {
      const refElements = referencesElement.querySelectorAll('Reference');
      refElements.forEach((ref) => {
        const targetNodeId = ref.textContent?.trim();
        if (targetNodeId) {
          references.push({
            referenceType: ref.getAttribute('ReferenceType') || 'References',
            isForward: ref.getAttribute('IsForward') !== 'false',
            targetNodeId,
          });
        }
      });
    }

    const dataType = xmlNode.getAttribute('DataType') || undefined;
    const valueRankStr = xmlNode.getAttribute('ValueRank');
    const valueRank = valueRankStr ? parseInt(valueRankStr) : undefined;
    const parentNodeId = xmlNode.getAttribute('ParentNodeId') || undefined;

    const derivedFromId = this.findDerivedFrom(references);
    const derivedFromName = derivedFromId ? this.resolveNodeId(derivedFromId) : undefined;

    // Find TypeDefinition reference
    const typeDefRef = references.find(
      ref => ref.referenceType === 'HasTypeDefinition' && ref.isForward
    );
    const typeDefinitionName = typeDefRef ? this.resolveNodeId(typeDefRef.targetNodeId) : undefined;

    // Find ModellingRule reference
    const modellingRuleRef = references.find(
      ref => ref.referenceType === 'HasModellingRule' && ref.isForward
    );
    const modellingRuleName = modellingRuleRef ? this.resolveNodeId(modellingRuleRef.targetNodeId) : undefined;

    const node: OpcUaNode = {
      nodeId,
      browseName,
      displayName,
      nodeClass,
      description,
      dataType: dataType ? this.resolveNodeId(dataType) : undefined,
      valueRank,
      modellingRule: modellingRuleName,
      type: parentNodeId ? this.resolveNodeId(parentNodeId) : undefined,
      typeDefinition: typeDefinitionName,
      derivedFrom: derivedFromName,
      references,
      children: [],
    };

    return node;
  }

  /**
   * Build parent-child hierarchy based on references
   */
  private buildHierarchy(nodes: Map<string, OpcUaNode>): void {
    nodes.forEach(node => {
      node.references.forEach(ref => {
        if (
          (ref.referenceType === 'HasComponent' || 
           ref.referenceType === 'Organizes' ||
           ref.referenceType === 'HasProperty') &&
          ref.isForward
        ) {
          const childNode = nodes.get(ref.targetNodeId);
          if (childNode && node.children) {
            node.children.push(childNode);
          }
        }
      });
    });
  }

  /**
   * Extract derived from information from references
   */
  private findDerivedFrom(references: OpcUaReference[]): string | undefined {
    const hasSubtype = references.find(
      ref => ref.referenceType === 'HasSubtype' && !ref.isForward
    );
    return hasSubtype?.targetNodeId;
  }

  /**
   * Get NodeClass enum from XML node type
   */
  private getNodeClass(nodeType: string): NodeClass {
    const mapping: Record<string, NodeClass> = {
      UAObject: NodeClass.Object,
      UAVariable: NodeClass.Variable,
      UAMethod: NodeClass.Method,
      UAObjectType: NodeClass.ObjectType,
      UAVariableType: NodeClass.VariableType,
      UAReferenceType: NodeClass.ReferenceType,
      UADataType: NodeClass.DataType,
      UAView: NodeClass.View,
    };
    return mapping[nodeType] || NodeClass.Object;
  }

  /**
   * Parse aliases from the nodeset
   */
  private parseAliases(uaNodeSet: Element): void {
    const aliasesElement = uaNodeSet.querySelector('Aliases');
    if (!aliasesElement) return;
    
    const aliasElements = aliasesElement.querySelectorAll('Alias');
    aliasElements.forEach((alias) => {
      const aliasName = alias.getAttribute('Alias');
      const nodeId = alias.textContent?.trim();
      if (aliasName && nodeId) {
        this.aliasMap.set(nodeId, aliasName);
      }
    });
  }

  /**
   * Parse node names from nodesets to build a lookup map
   */
  private parseNodeNames(uaNodeSet: Element): void {
    const nodeTypes = [
      'UAObject',
      'UAVariable',
      'UAMethod',
      'UAObjectType',
      'UAVariableType',
      'UAReferenceType',
      'UADataType',
      'UAView',
    ];

    nodeTypes.forEach(nodeType => {
      const nodeElements = uaNodeSet.querySelectorAll(nodeType);
      nodeElements.forEach((xmlNode) => {
        const nodeId = xmlNode.getAttribute('NodeId');
        const browseName = xmlNode.getAttribute('BrowseName');
        
        if (nodeId && browseName) {
          // Store the browse name for this node ID
          this.nodeNameMap.set(nodeId, browseName);
        }
      });
    });
  }

  /**
   * Resolve node ID to human-readable name using aliases and node names
   */
  private resolveNodeId(nodeId: string): string {
    if (!nodeId) return '';
    
    // Check if we have an alias for this node ID
    if (this.aliasMap.has(nodeId)) {
      return this.aliasMap.get(nodeId)!;
    }
    
    // Check if we have a node name for this node ID
    if (this.nodeNameMap.has(nodeId)) {
      return this.nodeNameMap.get(nodeId)!;
    }
    
    // Otherwise, just return the last part after the colon or the full ID
    const parts = nodeId.split(':');
    return parts[parts.length - 1] || nodeId;
  }

  /**
   * Get text content from a child element
   */
  private getElementText(parent: Element, tagName: string): string {
    const element = parent.querySelector(tagName);
    if (!element) return '';
    
    // Try to get text from child element first
    const textElement = element.querySelector('Text');
    if (textElement?.textContent) {
      return textElement.textContent.trim();
    }
    
    // Otherwise get direct text content
    return element.textContent?.trim() || '';
  }
}

export const nodesetParser = new NodesetParser();
