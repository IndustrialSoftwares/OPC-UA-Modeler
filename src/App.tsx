import { IxApplication, IxApplicationHeader, IxIconButton } from '@siemens/ix-react';
import { showModal } from '@siemens/ix';
import { useState } from 'react';
import { iconCloudUploadFilled } from '@siemens/ix-icons/icons';
import FileImportModal from './components/FileImport/FileImport';
import NodeTree from './components/NodeTree/NodeTree';
import DetailPanel from './components/DetailPanel/DetailPanel';
import { OpcUaNode, OpcUaNodeset, ImportError, NamespaceConflictStrategy } from '@/types';
import './App.css';

function App() {
  const [, setNodesets] = useState<OpcUaNodeset[]>([]);
  const [activeNodeset, setActiveNodeset] = useState<OpcUaNodeset | null>(null);
  const [selectedNode, setSelectedNode] = useState<OpcUaNode | null>(null);
  
  const handleNodesetLoaded = (nodeset: OpcUaNodeset) => {
    setNodesets((prev) => {
      const updated = [...prev, nodeset];
      setActiveNodeset(nodeset);
      return updated;
    });
  };

  const handleImportError = (error: ImportError) => {
    console.error('Import error:', error);
  };

  const openImportDialog = async () => {
    await showModal({
      size: '600',
      content: (
        <FileImportModal
          onNodesetLoaded={handleNodesetLoaded}
          onError={handleImportError}
          namespaceConflictStrategy={NamespaceConflictStrategy.WARN_AND_CONTINUE}
        />
      ),
    });
  };

  return (
    <IxApplication>
      <IxApplicationHeader name="OPC UA Modeler">
        <IxIconButton
          icon={iconCloudUploadFilled}
          onClick={openImportDialog}
          oval
          variant="primary"
          title="Upload Nodeset File(s)"
          aria-label="Upload nodeset"
        >
          Upload
        </IxIconButton>
      </IxApplicationHeader>
      <div className="app-content">
        {activeNodeset ? (
          <div className="workspace">
            <NodeTree
              nodesetData={activeNodeset}
              onNodeSelect={setSelectedNode}
              selectedNodeId={selectedNode?.nodeId}
            />
            <DetailPanel 
              selectedNode={selectedNode} 
              nodesetData={activeNodeset}
              onNodeSelect={setSelectedNode}
            />
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