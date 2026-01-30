import { IxButton, IxModalContent, IxModalHeader, IxUpload, Modal, ModalRef } from '@siemens/ix-react';
import { UploadFileState } from '@siemens/ix';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fileImportService } from '@/services/file-import.service';
import { Namespace, NodesetMetadata, OpcUaNodeset } from '@/types/opcua.types';
import { ImportError, NamespaceConflictStrategy, ValidationResult,ErrorMessages } from '@/types/import.types';
import './FileImport.css';

interface FileImportProps {
  onNodesetLoaded: (nodeset: OpcUaNodeset, metadata: NodesetMetadata) => void;
  onError: (error: ImportError) => void;
  maxFileSize?: number; // in bytes, default 10MB
  acceptedFormats?: string[]; // default ['.xml']
  namespaceConflictStrategy?: NamespaceConflictStrategy;
}

type LoadedNodesetItem = {
  nodeset: OpcUaNodeset;
  metadata: NodesetMetadata;
};

type Notification = {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: string;
};

type RecentFileEntry = {
  id: string;
  name: string;
  size: number;
  loadedAt: string;
};

const readFileWithProgress = (file: File, onProgress: (value: number) => void): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };
    reader.readAsText(file);
  });

const getRequiredModels = (xmlContent: string): string[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
  const requiredModelElements = xmlDoc.querySelectorAll('RequiredModel');
  const required: string[] = [];
  requiredModelElements.forEach((elem) => {
    const modelUri = elem.getAttribute('ModelUri');
    if (modelUri && modelUri !== 'http://opcfoundation.org/UA/') {
      required.push(modelUri);
    }
  });
  return required;
};

const detectNamespaceConflicts = (incoming: Namespace[], existing: Namespace[][]): string[] => {
  const existingUris = new Set(existing.flat().map((ns) => ns.uri));
  return incoming.filter((ns) => existingUris.has(ns.uri)).map((ns) => ns.uri);
};

const resolveNamespaceConflict = (
  strategy: NamespaceConflictStrategy,
  metadata: NodesetMetadata,
  conflicts: string[]
): { action: 'reject' | 'continue' | 'rename'; updatedMetadata?: NodesetMetadata } => {
  switch (strategy) {
    case NamespaceConflictStrategy.REJECT:
      return { action: 'reject' };
    case NamespaceConflictStrategy.RENAME: {
      const updated = {
        ...metadata,
        namespaces: metadata.namespaces.map((ns) =>
          conflicts.includes(ns.uri)
            ? { ...ns, uri: `${ns.uri}#${metadata.id}` }
            : ns
        ),
      };
      return { action: 'rename', updatedMetadata: updated };
    }
    case NamespaceConflictStrategy.MERGE:
    case NamespaceConflictStrategy.WARN_AND_CONTINUE:
    default:
      return { action: 'continue' };
  }
};

const RECENT_FILES_KEY = 'opcua_recent_nodesets';

const FileImportModal = ({ onNodesetLoaded, onError, maxFileSize = 10 * 1024 * 1024, acceptedFormats = ['.xml'], namespaceConflictStrategy = NamespaceConflictStrategy.WARN_AND_CONTINUE }: FileImportProps) => {
  const modalRef = useRef<ModalRef>(null);
  const [loading, setLoading] = useState(false);
  const [uploadState, setUploadState] = useState<UploadFileState>(UploadFileState.SELECT_FILE);
  const [requiredModels, setRequiredModels] = useState<string[]>([]);
  const [loadedNodesets, setLoadedNodesets] = useState<LoadedNodesetItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [progress, setProgress] = useState<{ fileName: string; value: number; stage: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [recentFiles, setRecentFiles] = useState<RecentFileEntry[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const [userMaxFileSizeMB, setUserMaxFileSizeMB] = useState<number>(() => Math.round((maxFileSize / (1024 * 1024)) * 10) / 10);

  const loadedChecksums = useMemo(() => new Set(loadedNodesets.map((item) => item.metadata.checksum).filter(Boolean) as string[]), [loadedNodesets]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_FILES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentFileEntry[];
        setRecentFiles(parsed);
      }
    } catch (err) {
      console.warn('Failed to load recent files', err);
    }
  }, []);

  // Close recent dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.recent-files')) {
        setShowRecent(false);
      }
    };
    
    if (showRecent) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [showRecent]);

  const persistRecentFiles = useCallback((entries: RecentFileEntry[]) => {
    setRecentFiles(entries);
    try {
      localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(entries));
    } catch (err) {
      console.warn('Failed to save recent files', err);
    }
  }, []);

  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev].slice(0, 5));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setLoading(true);
    setRequiredModels([]);
    setProgress(null);

    try {
      const fileArray = Array.from(files);

      const loadedFiles = new Map<string, string>();

      for (const file of fileArray) {
        const effectiveMax = userMaxFileSizeMB && userMaxFileSizeMB > 0
          ? Math.round(userMaxFileSizeMB * 1024 * 1024)
          : maxFileSize;

        if (file.size > effectiveMax) {
          const message = `${ErrorMessages.FILE_TOO_LARGE.replace('{size}', (effectiveMax / (1024 * 1024)).toFixed(1))}`;
          onError({ code: 'FILE_TOO_LARGE', message, fileName: file.name, details: `Size: ${file.size} bytes` });
          addNotification({ id: `${file.name}-size`, type: 'error', message });
          return;
        }

        if (!acceptedFormats.some((format) => file.name.toLowerCase().endsWith(format))) {
          const message = `${ErrorMessages.INVALID_FORMAT}`;
          onError({ code: 'INVALID_FORMAT', message, fileName: file.name });
          addNotification({ id: `${file.name}-format`, type: 'error', message });
          return;
        }

        const text = await readFileWithProgress(file, (value) => {
          setProgress({ fileName: file.name, value, stage: 'Reading file...' });
        });

        loadedFiles.set(file.name, text);
      }

      const mainFile = fileArray[0];
      const mainText = loadedFiles.get(mainFile.name)!;

      const required = getRequiredModels(mainText);
      if (required.length > 0 && loadedFiles.size === 1) {
        setRequiredModels(required);
        const message = `${ErrorMessages.MISSING_ELEMENTS.replace('{elements}', required.join(', '))}`;
        onError({ code: 'MISSING_ELEMENTS', message, fileName: mainFile.name });
        addNotification({ id: `${mainFile.name}-required`, type: 'warning', message });
        return;
      }

      const allFileContents = Array.from(loadedFiles.values());
      // Process each file individually and handle errors per file
      // should show the errors but continue processing other files
      for (const file of fileArray) {
        const fileText = loadedFiles.get(file.name)!;
        setProgress({ fileName: file.name, value: 0, stage: 'Validating XML...' });
        const validation: ValidationResult = fileImportService.validateXML(fileText);
        if (!validation.isValid) {
          const details = validation.errors.map((e) => e.message).join(', ');
          const message = `${ErrorMessages.INVALID_FORMAT.replace('{details}', details)}`;
          onError({ code: 'INVALID_FORMAT', message, details, fileName: file.name });
          addNotification({ id: `${file.name}-invalid`, type: 'error', message });
          continue;
        }

        setProgress({ fileName: file.name, value: 30, stage: 'Generating checksum...' });
        const checksum = await fileImportService.generateChecksum(fileText);
        if (fileImportService.detectDuplicate(checksum, loadedChecksums)) {
          const message = `${ErrorMessages.DUPLICATE}`;
          onError({ code: 'DUPLICATE', message, fileName: file.name });
          addNotification({ id: `${file.name}-duplicate`, type: 'warning', message });
          continue;
        }

        setProgress({ fileName: file.name, value: 60, stage: 'Parsing nodeset...' });
        const parsed = await fileImportService.parseNodesetFile(fileText, file.name, allFileContents);
        const metadata = fileImportService.extractMetadata(fileText, parsed, file, checksum);

        const namespaceConflicts = detectNamespaceConflicts(metadata.namespaces, loadedNodesets.map((n) => n.metadata.namespaces));
        if (namespaceConflicts.length > 0) {
          const conflictMessage = `${ErrorMessages.NAMESPACE_CONFLICT.replace('{elements}', namespaceConflicts.join(', '))}`;
          onError({ code: 'NAMESPACE_CONFLICT', message: conflictMessage, fileName: file.name });

          const resolution = resolveNamespaceConflict(namespaceConflictStrategy, metadata, namespaceConflicts);
          if (resolution.action === 'reject') {
            addNotification({ id: `${file.name}-namespace-reject`, type: 'error', message: conflictMessage });
            continue;
          }

          if (resolution.action === 'rename' && resolution.updatedMetadata) {
            metadata.namespaces = resolution.updatedMetadata.namespaces;
            addNotification({ id: `${file.name}-namespace-rename`, type: 'warning', message: `${conflictMessage} (renamed)` });
          } else {
            addNotification({ id: `${file.name}-namespace`, type: 'warning', message: conflictMessage });
          }
        }

        setProgress({ fileName: file.name, value: 100, stage: 'Completed' });
        const item = { nodeset: parsed, metadata };
        setLoadedNodesets((prev) => [item, ...prev]);
        onNodesetLoaded(parsed, metadata);
        addNotification({ id: `${file.name}-success`, type: 'success', message: `Loaded '${file.name}' with ${metadata.nodeCount} nodes` });
        setUploadState(UploadFileState.UPLOAD_SUCCESSED);
        
        // Close modal after successful upload
        setTimeout(() => modalRef.current?.close(null), 1500);

        const recentEntry: RecentFileEntry = {
          id: metadata.id,
          name: file.name,
          size: file.size,
          loadedAt: new Date().toISOString(),
        };
        const updatedRecent = [recentEntry, ...recentFiles.filter((entry) => entry.name !== file.name)].slice(0, 5);
        persistRecentFiles(updatedRecent);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse nodeset file';
      onError({ code: 'PARSE_ERROR', message });
      addNotification({ id: 'parse-error', type: 'error', message });
      setUploadState(UploadFileState.UPLOAD_FAILED);
      console.error('Parse error:', err);
    } finally {
      setLoading(false);
      setProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      // Reset upload state after a delay
      setTimeout(() => setUploadState(UploadFileState.SELECT_FILE), 3000);
    }
  }, [
    acceptedFormats,
    addNotification,
    loadedChecksums,
    loadedNodesets,
    maxFileSize,
    namespaceConflictStrategy,
    onError,
    onNodesetLoaded,
    persistRecentFiles,
    recentFiles,
    userMaxFileSizeMB,
  ]);

  const handleFilesChanged = useCallback((event: CustomEvent<File[]>) => {
    const files = event.detail;
    if (files && files.length > 0) {
      setUploadState(UploadFileState.LOADING);
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    handleFiles(files);
  };

  const handleRemoveNodeset = (id: string) => {
    setLoadedNodesets((prev) => prev.filter((item) => item.metadata.id !== id));
  };

  const handleClearRecent = () => {
    persistRecentFiles([]);
    setShowRecent(false);
  };

  const acceptedText = acceptedFormats.join(', ');

  return (
    <Modal ref={modalRef}>
      <IxModalHeader onCloseClick={() => modalRef.current?.dismiss()}>
        Import OPC UA Nodeset
      </IxModalHeader>
      <IxModalContent>
        <p>Upload an OPC UA nodeset XML file to begin viewing</p>

        <IxUpload
            accept={acceptedText}
            multiple
            state={uploadState}
            disabled={loading}
            selectFileText="+ Drag OPC UA nodeset XML files here or..."
            i18nUploadFile="Browse Files"
            loadingText="Processing files..."
            uploadSuccessText="Nodeset loaded successfully"
            uploadFailedText="Upload failed. Please try again."
            onFilesChanged={handleFilesChanged}
          />

          <div className="upload-options">
            <div className="recent-files">
              <IxButton variant="secondary" onClick={() => setShowRecent((prev) => !prev)}>
                Recent Files ▾
              </IxButton>
              {showRecent && (
                <div className="recent-dropdown">
                  {recentFiles.length === 0 ? (
                    <p className="muted">No recent files</p>
                  ) : (
                    <ul>
                      {recentFiles.map((entry) => (
                        <li key={entry.id}>
                          <span title={entry.name}>{entry.name}</span>
                          <span className="muted">{(entry.size / 1024).toFixed(1)} KB</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {recentFiles.length > 0 && (
                    <IxButton variant="secondary" onClick={handleClearRecent}>
                      Clear History
                    </IxButton>
                  )}
                </div>
              )}
            </div>
            <div className="max-size-input">
              <label className="muted" style={{ marginRight: 8 }}>Max size (MB):</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={userMaxFileSizeMB}
                onChange={(e) => {
                  let v = parseFloat(e.target.value);
                  if (Number.isNaN(v)) v = 0.2;
                  if (v <= 0.1) v = 0.2;
                  setUserMaxFileSizeMB(v);
                }}
                aria-label="Preferred max file size in MB"
                style={{ width: 80 }}
              />
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedText}
            multiple
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />

          {loading && (
            <div className="loading-indicator">
              <p>Importing nodeset...</p>
            </div>
          )}

          {progress && (
            <div className="progress-section">
              <div className="progress-header">
                <span>{progress.fileName}</span>
                <span>{progress.stage}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress.value}%` }} />
              </div>
            </div>
          )}

          {notifications.length > 0 && (
            <div className="notification-list">
              {notifications.map((note) => (
                <div key={note.id} className={`notification ${note.type}`}>
                  <span>{note.message}</span>
                  <button className="notification-close" onClick={() => removeNotification(note.id)} aria-label="Dismiss">
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {requiredModels.length > 0 && (
            <div className="required-models-section">
              <h4>Required Reference Models:</h4>
              <ul>
                {requiredModels.map((uri, idx) => (
                  <li key={idx}>{uri}</li>
                ))}
              </ul>
              <p className="help-text">Please select all required model files together when uploading.</p>
            </div>
          )}

          <div className="loaded-nodesets">
            <h3>Loaded Nodesets</h3>
            {loadedNodesets.length === 0 ? (
              <p className="muted">No nodesets loaded yet.</p>
            ) : (
              <ul>
                {loadedNodesets.map((item) => (
                  <li key={item.metadata.id}>
                    <div className="nodeset-row">
                      <div>
                        <strong>{item.metadata.name}</strong>
                        <div className="nodeset-meta">
                          <span>📊 {item.metadata.nodeCount} nodes</span>
                          <span>🌐 {item.metadata.namespaces.length} namespaces</span>
                          <span>🕒 {item.metadata.loadedAt.toLocaleString()}</span>
                        </div>
                      </div>
                      <IxButton variant="secondary" onClick={() => handleRemoveNodeset(item.metadata.id)}>
                        Remove
                      </IxButton>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="info-section">
            <h3>Supported Format</h3>
            <ul>
              <li>OPC UA Nodeset2 XML format</li>
              <li>Multiple files can be selected for nodesets with dependencies</li>
              <li>Standard namespace declarations</li>
              <li>Node types: Object, Variable, Method, DataType, etc.</li>
            </ul>
          </div>
      </IxModalContent>
    </Modal>
  );
};

export default FileImportModal;