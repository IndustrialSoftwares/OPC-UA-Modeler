import { describe, it, expect, beforeEach } from 'vitest';
import { NodesetParser } from './nodeset-parser.service';
import { NodeClass } from '@/types/opcua.types';

describe('NodesetParser', () => {
  let parser: NodesetParser;

  beforeEach(() => {
    parser = new NodesetParser();
  });

  describe('parseNodeset', () => {
    it('should parse a basic nodeset XML successfully', async () => {
      const xml = `<?xml version="1.0" encoding="utf-8"?>
        <UANodeSet xmlns="http://opcfoundation.org/UA/2011/03/UANodeSet.xsd">
          <NamespaceUris>
            <Uri>http://example.com/UA</Uri>
          </NamespaceUris>
          <UAObject NodeId="ns=1;i=1" BrowseName="TestObject">
            <DisplayName>Test Object</DisplayName>
          </UAObject>
        </UANodeSet>`;

      const result = await parser.parseNodeset(xml, 'test.xml');

      expect(result).toBeDefined();
      expect(result.fileName).toBe('test.xml');
      expect(result.namespaceUri).toBe('http://example.com/UA');
      expect(result.nodes.size).toBeGreaterThan(0);
    });

    it('should throw error on invalid XML', async () => {
      const invalidXml = `<Invalid>Not a valid nodeset</Invalid>`;

      await expect(parser.parseNodeset(invalidXml, 'invalid.xml')).rejects.toThrow(
        'Invalid nodeset format: UANodeSet element not found'
      );
    });

    it('should throw error on XML parsing error', async () => {
      const malformedXml = `<?xml version="1.0"?>
        <UANodeSet xmlns="http://opcfoundation.org/UA/2011/03/UANodeSet.xsd">
          <UAObject NodeId="ns=1;i=1">
            <DisplayName>Unclosed tag
          </UAObject>`;

      await expect(parser.parseNodeset(malformedXml, 'malformed.xml')).rejects.toThrow();
    });

    it('should handle missing NamespaceUris element', async () => {
      const xml = `<?xml version="1.0" encoding="utf-8"?>
        <UANodeSet xmlns="http://opcfoundation.org/UA/2011/03/UANodeSet.xsd">
          <UAObject NodeId="ns=1;i=1" BrowseName="TestObject">
            <DisplayName>Test Object</DisplayName>
          </UAObject>
        </UANodeSet>`;

      const result = await parser.parseNodeset(xml, 'test.xml');

      expect(result.namespaceUri).toBe('http://opcfoundation.org/UA/');
    });

    it('should parse multiple node types', async () => {
      const xml = `<?xml version="1.0" encoding="utf-8"?>
        <UANodeSet xmlns="http://opcfoundation.org/UA/2011/03/UANodeSet.xsd">
          <NamespaceUris>
            <Uri>http://example.com/UA</Uri>
          </NamespaceUris>
          <UAObject NodeId="ns=1;i=1" BrowseName="Object1">
            <DisplayName>Object 1</DisplayName>
          </UAObject>
          <UAVariable NodeId="ns=1;i=2" BrowseName="Variable1">
            <DisplayName>Variable 1</DisplayName>
          </UAVariable>
          <UAMethod NodeId="ns=1;i=3" BrowseName="Method1">
            <DisplayName>Method 1</DisplayName>
          </UAMethod>
          <UAObjectType NodeId="ns=1;i=4" BrowseName="ObjectType1">
            <DisplayName>Object Type 1</DisplayName>
          </UAObjectType>
          <UAVariableType NodeId="ns=1;i=5" BrowseName="VariableType1">
            <DisplayName>Variable Type 1</DisplayName>
          </UAVariableType>
          <UAReferenceType NodeId="ns=1;i=6" BrowseName="ReferenceType1">
            <DisplayName>Reference Type 1</DisplayName>
          </UAReferenceType>
          <UADataType NodeId="ns=1;i=7" BrowseName="DataType1">
            <DisplayName>Data Type 1</DisplayName>
          </UADataType>
        </UANodeSet>`;

      const result = await parser.parseNodeset(xml, 'test.xml');

      expect(result.nodes.size).toBe(7);
      expect(result.nodes.get('ns=1;i=1')?.nodeClass).toBe(NodeClass.Object);
      expect(result.nodes.get('ns=1;i=2')?.nodeClass).toBe(NodeClass.Variable);
      expect(result.nodes.get('ns=1;i=3')?.nodeClass).toBe(NodeClass.Method);
      expect(result.nodes.get('ns=1;i=4')?.nodeClass).toBe(NodeClass.ObjectType);
      expect(result.nodes.get('ns=1;i=5')?.nodeClass).toBe(NodeClass.VariableType);
      expect(result.nodes.get('ns=1;i=6')?.nodeClass).toBe(NodeClass.ReferenceType);
      expect(result.nodes.get('ns=1;i=7')?.nodeClass).toBe(NodeClass.DataType);
    });

    it('should parse node with attributes', async () => {
      const xml = `<?xml version="1.0" encoding="utf-8"?>
        <UANodeSet xmlns="http://opcfoundation.org/UA/2011/03/UANodeSet.xsd">
          <UAVariable NodeId="ns=1;i=1" BrowseName="Var1" DataType="ns=0;i=5" ValueRank="1">
            <DisplayName>Variable 1</DisplayName>
            <Description>Test variable</Description>
          </UAVariable>
        </UANodeSet>`;

      const result = await parser.parseNodeset(xml, 'test.xml');
      const node = result.nodes.get('ns=1;i=1');

      expect(node?.browseName).toBe('Var1');
      expect(node?.displayName).toBe('Variable 1');
      expect(node?.description).toBe('Test variable');
      expect(node?.valueRank).toBe(1);
      expect(node?.dataType).toBeDefined();
    });

    it('should parse aliases', async () => {
      const xml = `<?xml version="1.0" encoding="utf-8"?>
        <UANodeSet xmlns="http://opcfoundation.org/UA/2011/03/UANodeSet.xsd">
          <Aliases>
            <Alias Alias="BaseDataVariableType">ns=0;i=30</Alias>
            <Alias Alias="HasComponent">ns=0;i=47</Alias>
          </Aliases>
          <UAVariable NodeId="ns=1;i=1" BrowseName="Var1">
            <DisplayName>Variable 1</DisplayName>
          </UAVariable>
        </UANodeSet>`;

      const result = await parser.parseNodeset(xml, 'test.xml');

      expect(result.nodes.size).toBe(1);
      const node = result.nodes.get('ns=1;i=1');
      expect(node?.nodeId).toBe('ns=1;i=1');
    });

    it('should parse references', async () => {
      const xml = `<?xml version="1.0" encoding="utf-8"?>
        <UANodeSet xmlns="http://opcfoundation.org/UA/2011/03/UANodeSet.xsd">
          <Aliases>
            <Alias Alias="HasComponent">ns=0;i=47</Alias>
          </Aliases>
          <UAObject NodeId="ns=1;i=1" BrowseName="Parent">
            <DisplayName>Parent Object</DisplayName>
            <References>
              <Reference ReferenceType="HasComponent" IsForward="true">ns=1;i=2</Reference>
              <Reference ReferenceType="HasProperty" IsForward="true">ns=1;i=3</Reference>
            </References>
          </UAObject>
          <UAObject NodeId="ns=1;i=2" BrowseName="Child">
            <DisplayName>Child Object</DisplayName>
          </UAObject>
          <UAVariable NodeId="ns=1;i=3" BrowseName="Prop">
            <DisplayName>Property</DisplayName>
          </UAVariable>
        </UANodeSet>`;

      const result = await parser.parseNodeset(xml, 'test.xml');
      const parentNode = result.nodes.get('ns=1;i=1');

      expect(parentNode?.references.length).toBe(2);
      expect(parentNode?.references[0].referenceType).toBe('HasComponent');
      expect(parentNode?.references[0].targetNodeId).toBe('ns=1;i=2');
      expect(parentNode?.references[0].isForward).toBe(true);
      expect(parentNode?.references[1].referenceType).toBe('HasProperty');
    });

    it('should build parent-child hierarchy', async () => {
      const xml = `<?xml version="1.0" encoding="utf-8"?>
        <UANodeSet xmlns="http://opcfoundation.org/UA/2011/03/UANodeSet.xsd">
          <UAObject NodeId="ns=1;i=1" BrowseName="Parent">
            <DisplayName>Parent</DisplayName>
            <References>
              <Reference ReferenceType="HasComponent" IsForward="true">ns=1;i=2</Reference>
              <Reference ReferenceType="HasComponent" IsForward="true">ns=1;i=3</Reference>
            </References>
          </UAObject>
          <UAObject NodeId="ns=1;i=2" BrowseName="Child1">
            <DisplayName>Child 1</DisplayName>
          </UAObject>
          <UAVariable NodeId="ns=1;i=3" BrowseName="Child2">
            <DisplayName>Child 2</DisplayName>
          </UAVariable>
        </UANodeSet>`;

      const result = await parser.parseNodeset(xml, 'test.xml');
      const parentNode = result.nodes.get('ns=1;i=1');

      expect(parentNode?.children?.length).toBe(2);
      expect(parentNode?.children?.[0].nodeId).toBe('ns=1;i=2');
      expect(parentNode?.children?.[1].nodeId).toBe('ns=1;i=3');
    });

    it('should handle Organizes references in hierarchy', async () => {
      const xml = `<?xml version="1.0" encoding="utf-8"?>
        <UANodeSet xmlns="http://opcfoundation.org/UA/2011/03/UANodeSet.xsd">
          <UAObject NodeId="ns=1;i=1" BrowseName="Folder">
            <DisplayName>Folder</DisplayName>
            <References>
              <Reference ReferenceType="Organizes" IsForward="true">ns=1;i=2</Reference>
            </References>
          </UAObject>
          <UAObject NodeId="ns=1;i=2" BrowseName="Item">
            <DisplayName>Item</DisplayName>
          </UAObject>
        </UANodeSet>`;

      const result = await parser.parseNodeset(xml, 'test.xml');
      const folderNode = result.nodes.get('ns=1;i=1');

      expect(folderNode?.children?.length).toBe(1);
      expect(folderNode?.children?.[0].nodeId).toBe('ns=1;i=2');
    });

    it('should handle HasProperty references in hierarchy', async () => {
      const xml = `<?xml version="1.0" encoding="utf-8"?>
        <UANodeSet xmlns="http://opcfoundation.org/UA/2011/03/UANodeSet.xsd">
          <UAVariable NodeId="ns=1;i=1" BrowseName="Variable">
            <DisplayName>Variable</DisplayName>
            <References>
              <Reference ReferenceType="HasProperty" IsForward="true">ns=1;i=2</Reference>
            </References>
          </UAVariable>
          <UAVariable NodeId="ns=1;i=2" BrowseName="Property">
            <DisplayName>Property</DisplayName>
          </UAVariable>
        </UANodeSet>`;

      const result = await parser.parseNodeset(xml, 'test.xml');
      const variableNode = result.nodes.get('ns=1;i=1');

      expect(variableNode?.children?.length).toBe(1);
      expect(variableNode?.children?.[0].nodeId).toBe('ns=1;i=2');
    });

    it('should organize types into categories', async () => {
      const xml = `<?xml version="1.0" encoding="utf-8"?>
        <UANodeSet xmlns="http://opcfoundation.org/UA/2011/03/UANodeSet.xsd">
          <UADataType NodeId="ns=1;i=1" BrowseName="DataType1">
            <DisplayName>Data Type 1</DisplayName>
          </UADataType>
          <UAReferenceType NodeId="ns=1;i=2" BrowseName="RefType1">
            <DisplayName>Reference Type 1</DisplayName>
          </UAReferenceType>
          <UAVariableType NodeId="ns=1;i=3" BrowseName="VarType1">
            <DisplayName>Variable Type 1</DisplayName>
          </UAVariableType>
          <UAObjectType NodeId="ns=1;i=4" BrowseName="ObjType1">
            <DisplayName>Object Type 1</DisplayName>
          </UAObjectType>
        </UANodeSet>`;

      const result = await parser.parseNodeset(xml, 'test.xml');

      // Check that rootNodes contains category nodes
      expect(result.rootNodes.length).toBeGreaterThan(0);
      
      const categoryNames = result.rootNodes.map(node => node.browseName);
      expect(categoryNames).toContain('DataTypes');
      expect(categoryNames).toContain('ReferenceTypes');
      expect(categoryNames).toContain('VariableTypes');
      expect(categoryNames).toContain('ObjectTypes');
    });

    it('should handle derived from (HasSubtype) references', async () => {
      const xml = `<?xml version="1.0" encoding="utf-8"?>
        <UANodeSet xmlns="http://opcfoundation.org/UA/2011/03/UANodeSet.xsd">
          <UAObjectType NodeId="ns=1;i=1" BrowseName="DerivedType">
            <DisplayName>Derived Type</DisplayName>
            <References>
              <Reference ReferenceType="HasSubtype" IsForward="false">ns=0;i=58</Reference>
            </References>
          </UAObjectType>
        </UANodeSet>`;

      const result = await parser.parseNodeset(xml, 'test.xml');
      const node = result.nodes.get('ns=1;i=1');

      expect(node?.derivedFrom).toBeDefined();
    });

    it('should handle TypeDefinition references', async () => {
      const xml = `<?xml version="1.0" encoding="utf-8"?>
        <UANodeSet xmlns="http://opcfoundation.org/UA/2011/03/UANodeSet.xsd">
          <Aliases>
            <Alias Alias="BaseDataVariableType">ns=0;i=30</Alias>
          </Aliases>
          <UAVariable NodeId="ns=1;i=1" BrowseName="Variable">
            <DisplayName>Variable</DisplayName>
            <References>
              <Reference ReferenceType="HasTypeDefinition" IsForward="true">ns=0;i=30</Reference>
            </References>
          </UAVariable>
        </UANodeSet>`;

      const result = await parser.parseNodeset(xml, 'test.xml');
      const node = result.nodes.get('ns=1;i=1');

      expect(node?.typeDefinition).toBeDefined();
    });

    it('should handle ModellingRule references', async () => {
      const xml = `<?xml version="1.0" encoding="utf-8"?>
        <UANodeSet xmlns="http://opcfoundation.org/UA/2011/03/UANodeSet.xsd">
          <Aliases>
            <Alias Alias="Mandatory">ns=0;i=80</Alias>
          </Aliases>
          <UAVariable NodeId="ns=1;i=1" BrowseName="Variable">
            <DisplayName>Variable</DisplayName>
            <References>
              <Reference ReferenceType="HasModellingRule" IsForward="true">ns=0;i=80</Reference>
            </References>
          </UAVariable>
        </UANodeSet>`;

      const result = await parser.parseNodeset(xml, 'test.xml');
      const node = result.nodes.get('ns=1;i=1');

      expect(node?.modellingRule).toBeDefined();
    });

    it('should handle reference nodesets', async () => {
      const referenceXml = `<?xml version="1.0" encoding="utf-8"?>
        <UANodeSet xmlns="http://opcfoundation.org/UA/2011/03/UANodeSet.xsd">
          <Aliases>
            <Alias Alias="BaseDataType">ns=0;i=24</Alias>
          </Aliases>
          <UADataType NodeId="ns=0;i=24" BrowseName="BaseDataType">
            <DisplayName>BaseDataType</DisplayName>
          </UADataType>
        </UANodeSet>`;

      const mainXml = `<?xml version="1.0" encoding="utf-8"?>
        <UANodeSet xmlns="http://opcfoundation.org/UA/2011/03/UANodeSet.xsd">
          <Aliases>
            <Alias Alias="BaseDataType">ns=0;i=24</Alias>
          </Aliases>
          <UADataType NodeId="ns=1;i=1" BrowseName="CustomType">
            <DisplayName>Custom Type</DisplayName>
          </UADataType>
        </UANodeSet>`;

      const result = await parser.parseNodeset(mainXml, 'test.xml', [referenceXml]);

      expect(result.nodes.size).toBe(1);
      expect(result.nodes.get('ns=1;i=1')).toBeDefined();
    });

    it('should handle node with no NodeId gracefully', async () => {
      const xml = `<?xml version="1.0" encoding="utf-8"?>
        <UANodeSet xmlns="http://opcfoundation.org/UA/2011/03/UANodeSet.xsd">
          <UAObject BrowseName="NoId">
            <DisplayName>No ID Object</DisplayName>
          </UAObject>
        </UANodeSet>`;

      const result = await parser.parseNodeset(xml, 'test.xml');

      // Node without NodeId should be skipped
      expect(result.nodes.size).toBe(0);
    });

    it('should handle DisplayName from child element', async () => {
      const xml = `<?xml version="1.0" encoding="utf-8"?>
        <UANodeSet xmlns="http://opcfoundation.org/UA/2011/03/UANodeSet.xsd">
          <UAObject NodeId="ns=1;i=1" BrowseName="Object1">
            <DisplayName>
              <Text>Test Display Name</Text>
            </DisplayName>
          </UAObject>
        </UANodeSet>`;

      const result = await parser.parseNodeset(xml, 'test.xml');
      const node = result.nodes.get('ns=1;i=1');

      expect(node?.displayName).toBe('Test Display Name');
    });

    it('should handle backward references (IsForward=false)', async () => {
      const xml = `<?xml version="1.0" encoding="utf-8"?>
        <UANodeSet xmlns="http://opcfoundation.org/UA/2011/03/UANodeSet.xsd">
          <UAObject NodeId="ns=1;i=1" BrowseName="Object1">
            <DisplayName>Object 1</DisplayName>
            <References>
              <Reference ReferenceType="HasComponent" IsForward="false">ns=1;i=2</Reference>
            </References>
          </UAObject>
          <UAObject NodeId="ns=1;i=2" BrowseName="Parent">
            <DisplayName>Parent Object</DisplayName>
          </UAObject>
        </UANodeSet>`;

      const result = await parser.parseNodeset(xml, 'test.xml');
      const node = result.nodes.get('ns=1;i=1');

      expect(node?.references[0].isForward).toBe(false);
      // Backward references should not be added to children
      expect(node?.children?.length || 0).toBe(0);
    });

    it('should create root nodes with proper file metadata', async () => {
      const xml = `<?xml version="1.0" encoding="utf-8"?>
        <UANodeSet xmlns="http://opcfoundation.org/UA/2011/03/UANodeSet.xsd">
          <NamespaceUris>
            <Uri>http://custom.com/UA</Uri>
          </NamespaceUris>
          <UADataType NodeId="ns=1;i=1" BrowseName="Type1">
            <DisplayName>Type 1</DisplayName>
          </UADataType>
        </UANodeSet>`;

      const result = await parser.parseNodeset(xml, 'custom.xml');

      expect(result.fileName).toBe('custom.xml');
      expect(result.namespaceUri).toBe('http://custom.com/UA');
      expect(result.namespaceIndex).toBe(1);
    });

    it('should categorize EventTypes separately', async () => {
      const xml = `<?xml version="1.0" encoding="utf-8"?>
        <UANodeSet xmlns="http://opcfoundation.org/UA/2011/03/UANodeSet.xsd">
          <UAObjectType NodeId="ns=1;i=1" BrowseName="BaseEventType">
            <DisplayName>Base Event Type</DisplayName>
          </UAObjectType>
          <UAObjectType NodeId="ns=1;i=2" BrowseName="CustomEventType">
            <DisplayName>Custom Event Type</DisplayName>
            <References>
              <Reference ReferenceType="HasSubtype" IsForward="false">ns=1;i=1</Reference>
            </References>
          </UAObjectType>
        </UANodeSet>`;

      const result = await parser.parseNodeset(xml, 'test.xml');

      // Should have categories for both EventTypes and ObjectTypes (if any non-event ObjectTypes exist)
      const categoryNames = result.rootNodes.map(node => node.browseName);
      expect(categoryNames.length).toBeGreaterThan(0);
    });

    it('should handle complex nodeset with multiple relationships', async () => {
      const xml = `<?xml version="1.0" encoding="utf-8"?>
        <UANodeSet xmlns="http://opcfoundation.org/UA/2011/03/UANodeSet.xsd">
          <Aliases>
            <Alias Alias="HasComponent">ns=0;i=47</Alias>
            <Alias Alias="HasProperty">ns=0;i=46</Alias>
            <Alias Alias="HasTypeDefinition">ns=0;i=40</Alias>
          </Aliases>
          <UAObject NodeId="ns=1;i=1" BrowseName="ComplexObject">
            <DisplayName>Complex Object</DisplayName>
            <References>
              <Reference ReferenceType="HasComponent" IsForward="true">ns=1;i=2</Reference>
              <Reference ReferenceType="HasProperty" IsForward="true">ns=1;i=3</Reference>
              <Reference ReferenceType="HasTypeDefinition" IsForward="true">ns=1;i=4</Reference>
            </References>
          </UAObject>
          <UAVariable NodeId="ns=1;i=2" BrowseName="SubComponent">
            <DisplayName>Sub Component</DisplayName>
          </UAVariable>
          <UAVariable NodeId="ns=1;i=3" BrowseName="Property">
            <DisplayName>Property</DisplayName>
          </UAVariable>
          <UAObjectType NodeId="ns=1;i=4" BrowseName="ObjectType">
            <DisplayName>Object Type</DisplayName>
          </UAObjectType>
        </UANodeSet>`;

      const result = await parser.parseNodeset(xml, 'test.xml');

      expect(result.nodes.size).toBe(4);
      const complexNode = result.nodes.get('ns=1;i=1');
      expect(complexNode?.references.length).toBe(3);
      expect(complexNode?.children?.length).toBe(2); // HasComponent and HasProperty
      expect(complexNode?.typeDefinition).toBeDefined();
    });
  });
});
