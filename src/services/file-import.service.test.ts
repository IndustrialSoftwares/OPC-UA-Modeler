import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fileImportService } from './file-import.service';
import { nodesetParser } from './nodeset-parser.service';
import { ParsedNodeset } from '@/types';

describe('FileImportService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateXML', () => {
    it('valid XML with NamespaceUris and nodes should be valid', () => {
      const xml = `<?xml version="1.0" encoding="utf-8"?>
        <UANodeSet xmlns="http://opcfoundation.org/UA/2011/03/UANodeSet.xsd">
          <NamespaceUris>
            <Uri>http://example.com/UA</Uri>
          </NamespaceUris>
          <UAObject NodeId="ns=1;i=1" BrowseName="Test">
            <DisplayName>Test</DisplayName>
          </UAObject>
        </UANodeSet>`;

      const result = fileImportService.validateXML(xml);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('missing UANodeSet should produce errors', () => {
      const xml = `<Invalid></Invalid>`;
      const result = fileImportService.validateXML(xml);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_ELEMENTS')).toBe(true);
    });

    it('missing NamespaceUris should produce an error', () => {
      const xml = `<?xml version="1.0"?>
        <UANodeSet xmlns="http://opcfoundation.org/UA/2011/03/UANodeSet.xsd">
          <UAObject NodeId="ns=1;i=1">
            <DisplayName>Test</DisplayName>
          </UAObject>
        </UANodeSet>`;

      const result = fileImportService.validateXML(xml);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Missing NamespaceUris'))).toBe(true);
    });
  });

  describe('parseNodesetFile', () => {
    it('should call nodesetParser.parseNodeset and return its result', async () => {
      const xml = '<UANodeSet></UANodeSet>';
      const mockParsed = {
        fileName: 'm.xml',
        namespaceUri: 'http://example',
        namespaceIndex: 1,
        nodes: new Map<string, unknown>(),
        rootNodes: [],
      } as unknown as ParsedNodeset;

      const spy = vi.spyOn(nodesetParser, 'parseNodeset').mockResolvedValue(mockParsed);
      const result = await fileImportService.parseNodesetFile(xml, 'm.xml', []);

      expect(spy).toHaveBeenCalledWith(xml, 'm.xml', []);
      expect(result).toBe(mockParsed);
    });
  });

  describe('extractMetadata', () => {
    it('should extract namespaces and metadata from parsed nodeset', () => {
      const xml = `<?xml version="1.0"?>
        <UANodeSet xmlns="http://opcfoundation.org/UA/2011/03/UANodeSet.xsd">
          <NamespaceUris>
            <Uri>http://a</Uri>
            <Uri>http://b</Uri>
          </NamespaceUris>
        </UANodeSet>`;

      const nodeset = {
        nodes: new Map([['ns=1;i=1', { nodeId: 'ns=1;i=1' }]]),
        namespaceUri: 'http://a',
      } as unknown as ParsedNodeset;

      // Create a File (jsdom provides File in test env)
      const file = new File(['x'], 'test.xml', { type: 'text/xml', lastModified: 12345 });

      const meta = fileImportService.extractMetadata(xml, nodeset, file, 'abc123');

      expect(meta.name).toBe('test.xml');
      expect(meta.nodeCount).toBe(1);
      expect(meta.checksum).toBe('abc123');
      expect(meta.namespaces.length).toBe(2);
    });
  });

  describe('detectDuplicate', () => {
    it('returns true if checksum is found', () => {
      const set = new Set<string>(['a','b']);
      expect(fileImportService.detectDuplicate('a', set)).toBe(true);
      expect(fileImportService.detectDuplicate('c', set)).toBe(false);
      expect(fileImportService.detectDuplicate(undefined, set)).toBe(false);
    });
  });

  describe('generateChecksum', () => {
    it('generates a checksum string', async () => {
      const xml = '<root>hello</root>';
      const checksum = await fileImportService.generateChecksum(xml);
      expect(typeof checksum).toBe('string');
      expect(checksum.length).toBeGreaterThan(0);
    });
  });

  describe('extractNamespaces', () => {
    it('extracts namespace URIs with indexes', () => {
      const xml = `<?xml version="1.0"?>
        <UANodeSet>
          <NamespaceUris>
            <Uri>urn:one</Uri>
            <Uri>urn:two</Uri>
          </NamespaceUris>
        </UANodeSet>`;

      const ns = fileImportService.extractNamespaces(xml);
      expect(ns.length).toBe(2);
      expect(ns[0].uri).toBe('urn:one');
      expect(ns[1].index).toBe(1);
    });
  });
});
