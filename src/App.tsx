import {
  IxApplication,
  IxApplicationHeader,
  IxIconButton,
  IxContent,
  IxMenu,
  IxMenuAbout,
  IxMenuSettings
} from '@siemens/ix-react';
import { AppSwitchConfiguration } from '@siemens/ix';
import { useRef, useState } from 'react';
import {
  iconCloudUpload, iconClear, iconPrint
} from '@siemens/ix-icons/icons';
import FileImport from './components/FileImport/FileImport';
import { FileImportHandle } from './components/FileImport/FileImport';
import NodeTree from './components/NodeTree/NodeTree';
import DetailPanel from './components/DetailPanel/DetailPanel';
import { OpcUaNode, OpcUaNodeset, ImportError, NamespaceConflictStrategy } from '@/types';
import './App.css';

function App() {
  const [, setNodesets] = useState<OpcUaNodeset[]>([]);
  const [activeNodeset, setActiveNodeset] = useState<OpcUaNodeset | null>(null);
  const fileImportRef = useRef<FileImportHandle>(null);
  const [selectedNode, setSelectedNode] = useState<OpcUaNode | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
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
  const appSwitchConfig: AppSwitchConfiguration = {
    i18nAppSwitch: 'Switch to Application',
    currentAppId: 'app-1',
    apps: [
      {
        id: 'app-1',
        name: 'Information Model Viewer',
        iconSrc: 'https://www.svgrepo.com/show/530661/genetic-data.svg',
        url: 'https://industrialsoftwares.github.io/OPC-UA-Modeler/',
        description: 'OPC UA nodeset viewer and analyzer for exploring information models, node hierarchies, & relationships',
        target: '_self',
      },
      {
        id: 'app-2',
        name: 'Modeling Editor (New Feature Request)',
        iconSrc: 'https://www.svgrepo.com/show/290415/code-website.svg',
        url: 'https://github.com/IndustrialSoftwares/OPC-UA-Modeler/issues/new?template=feature_request.md',
        description: 'OPC UA nodeset editor for creating, modifying, and managing information models',
        target: '_self',
      },
    ],
  };

  return (
    <IxApplication appSwitchConfig={appSwitchConfig}>
      <IxApplicationHeader name="OPC UA Web Modeler" nameSuffix='Information Model Viewer'>
        <div className="placeholder-logo" slot="logo"></div>

        <div slot="secondary">
          <IxIconButton
            icon={iconCloudUpload}
            onClick={() => setIsImportDialogOpen(true)}
            oval
            variant="subtle-tertiary"
            title="Upload Nodeset File(s)"
            aria-label="Upload nodeset"
          >
            Upload
          </IxIconButton>
          <IxIconButton
            icon={iconPrint}
            disabled
            onClick={() => setIsImportDialogOpen(true)}
            oval
            variant="subtle-tertiary"
            title="Print Nodeset"
            aria-label="Print nodeset"
          >
            Print
          </IxIconButton>
          <IxIconButton
            icon={iconClear}
            onClick={() => setIsImportDialogOpen(true)}
            oval
            variant="subtle-tertiary"
            title="Clear Viewer"
            aria-label="Clear viewer"
          >
            Clear
          </IxIconButton>
        </div>
      </IxApplicationHeader>
      <IxMenu>
        <IxMenuSettings></IxMenuSettings>
        <IxMenuAbout></IxMenuAbout>
      </IxMenu>
      <IxContent>

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
      </IxContent>
    </IxApplication>
  );
}

export default App;