import { Namespace, NodesetMetadata, ParsedNodeset ,ValidationResult, ValidationError, ValidationWarning  } from '@/types';
import { nodesetParser } from '@/services/nodeset-parser.service';

export interface FileImportService {
  validateXML(xmlContent: string): ValidationResult;
  parseNodesetFile(xmlContent: string, fileName: string, referenceNodesets: string[]): Promise<ParsedNodeset>;
  extractMetadata(xmlContent: string, nodeset: ParsedNodeset, file: File, checksum?: string): NodesetMetadata;
  detectDuplicate(checksum: string | undefined, loadedChecksums: Set<string>): boolean;
  generateChecksum(xmlContent: string): Promise<string>;
  extractNamespaces(xmlContent: string): Namespace[];
}

class FileImportServiceImpl implements FileImportService {

  //Checks the basic structure of the XML to ensure it is a valid OPC UA nodeset file
  validateXML(xmlContent: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');
    const parserError = xmlDoc.querySelector('parsererror');

    if (parserError !== null) {
      errors.push({
        message: 'XML parsing error',
        code: 'PARSE_ERROR',
        details: parserError.textContent || undefined,
      });
      return { isValid: false, errors, warnings };
    }

    const uaNodeSet = xmlDoc.querySelector('UANodeSet');
    if (!uaNodeSet) {
      errors.push({ message: 'Missing UANodeSet root element', code: 'MISSING_ELEMENTS' });
    }

    const namespaceUris = uaNodeSet?.querySelectorAll('NamespaceUris > Uri') || [];
    if (namespaceUris.length === 0) {
      errors.push({ message: 'Missing NamespaceUris section', code: 'MISSING_ELEMENTS' });
    }

    const nodeElements = uaNodeSet?.querySelectorAll(
      'UAObject,UAVariable,UAMethod,UAObjectType,UAVariableType,UAReferenceType,UADataType,UAView'
    );
    if (!nodeElements || nodeElements.length === 0) {
      errors.push({ message: 'Nodeset contains no node definitions', code: 'MISSING_ELEMENTS' });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  async parseNodesetFile(xmlContent: string, fileName: string, referenceNodesets: string[]): Promise<ParsedNodeset> {
    return nodesetParser.parseNodeset(xmlContent, fileName, referenceNodesets);
  }

  extractMetadata(xmlContent: string, nodeset: ParsedNodeset, file: File, checksum?: string): NodesetMetadata {
    const namespaces = this.extractNamespaces(xmlContent);
    const nodeCount = nodeset.nodes?.size ?? 0;

    return {
      id: `${file.name}-${file.size}-${file.lastModified}`,
      name: file.name,
      fileName: file.name,
      filePath: undefined,
      fileSize: file.size,
      loadedAt: new Date(),
      namespaces,
      nodeCount,
      checksum,
      namespaceUri: nodeset.namespaceUri,
    };
  }

  detectDuplicate(checksum: string | undefined, loadedChecksums: Set<string>): boolean {
    if (!checksum) return false;
    return loadedChecksums.has(checksum);
  }

  async generateChecksum(xmlContent: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(xmlContent);

    if (crypto?.subtle?.digest) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }

    let hash = 0;
    for (let i = 0; i < xmlContent.length; i += 1) {
      hash = (hash << 5) - hash + xmlContent.charCodeAt(i);
      hash |= 0;
    }
    return `fallback-${Math.abs(hash)}`;
  }

  extractNamespaces(xmlContent: string): Namespace[] {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    const uriElements = xmlDoc.querySelectorAll('UANodeSet > NamespaceUris > Uri');
    const namespaces: Namespace[] = [];
    uriElements.forEach((uriElement, index) => {
      const uri = uriElement.textContent?.trim();
      if (uri) {
        namespaces.push({ index, uri });
      }
    });
    return namespaces;
  }
}

export const fileImportService: FileImportService = new FileImportServiceImpl();