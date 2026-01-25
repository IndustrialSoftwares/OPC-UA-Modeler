export type ImportErrorCode =
  | 'INVALID_FORMAT'
  | 'FILE_TOO_LARGE'
  | 'PARSE_ERROR'
  | 'DUPLICATE'
  | 'MISSING_ELEMENTS'
  | 'NAMESPACE_CONFLICT'
  | 'UNKNOWN';

export enum NamespaceConflictStrategy {
  MERGE = 'merge',
  RENAME = 'rename',
  REJECT = 'reject',
  WARN_AND_CONTINUE = 'warn',
}

export interface ImportError {
  code: ImportErrorCode;
  message: string;
  details?: string;
  fileName?: string;
}
export interface ValidationError {
  message: string;
  code?: string;
  path?: string;
  details?: string;
}

export interface ValidationWarning {
  message: string;
  code?: string;
  path?: string;
  details?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export const ErrorMessages = {
  INVALID_FORMAT: 'File is not a valid OPC UA nodeset XML',
  FILE_TOO_LARGE: 'File exceeds maximum size of {size}MB',
  PARSE_ERROR: 'Error parsing nodeset: {details}',
  DUPLICATE: 'This nodeset appears to be already loaded',
  MISSING_ELEMENTS: 'Required nodeset elements missing: {elements}',
  NAMESPACE_CONFLICT: 'Namespace URI conflicts with loaded nodeset',
  UNKNOWN: 'Unknown error occurred during import'
};