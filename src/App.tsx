import { IxApplication, IxApplicationHeader, IxIconButton } from '@siemens/ix-react';
import { useRef, useState } from 'react';
import { iconCloudUploadFilled } from '@siemens/ix-icons/icons';
import FileImport from './components/FileImport/FileImport';
import { FileImportHandle } from './components/FileImport/FileImport';
import NodeTree from './components/NodeTree/NodeTree';
import NodeDetails from './components/NodeDetails/NodeDetails';
import { NodesetMetadata, OpcUaNode, OpcUaNodeset, ImportError, NamespaceConflictStrategy } from '@/types';
import './App.css';

function App() {
  const [, setNodesets] = useState<OpcUaNodeset[]>([]);
  const [activeNodeset, setActiveNodeset] = useState<OpcUaNodeset | null>(null);
  const fileImportRef = useRef<FileImportHandle>(null);
  const [selectedNode, setSelectedNode] = useState<OpcUaNode | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const handleNodesetLoaded = (nodeset: OpcUaNodeset, _metadata: NodesetMetadata) => {
    setNodesets((prev) => {
      const updated = [...prev, nodeset];
      setActiveNodeset(nodeset);
      return updated;
    });
  };

  const handleImportError = (error: ImportError) => {
    console.error('Import error:', error);
  };

  return (
    <IxApplication>
      <IxApplicationHeader name="OPC UA Modeler">
        <IxIconButton
          icon={iconCloudUploadFilled}
          onClick={() => setIsImportDialogOpen(true)}
          oval
          variant="primary"
          title="Upload Nodeset File(s)"
          aria-label="Upload nodeset"
        >
          Upload
        </IxIconButton>
      </IxApplicationHeader>
      <div className="app-content">
        <FileImport
          ref={fileImportRef}
          onNodesetLoaded={handleNodesetLoaded}
          onError={handleImportError}
          namespaceConflictStrategy={NamespaceConflictStrategy.WARN_AND_CONTINUE}
          isDialogOpen={isImportDialogOpen}
          onDialogClose={() => setIsImportDialogOpen(false)}
        />
        {activeNodeset ? (
          <div className="workspace">
            <NodeTree
              nodesetData={activeNodeset}
              onNodeSelect={setSelectedNode}
              selectedNodeId={selectedNode?.nodeId}
            />
            <NodeDetails node={selectedNode} />
          </div>
        ) : (
          <div className="empty-workspace">
            <p>No nodeset loaded yet.</p>
          </div>
        )}
      </div>
    </IxApplication>
  );
}

export default App;