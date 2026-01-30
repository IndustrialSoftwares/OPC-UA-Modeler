import {
  IxApplication,
  IxApplicationHeader,
  IxIconButton, IxButton,
  IxContent,
  IxMenu,
  IxMenuAbout,
  IxMenuSettings,
  showModal
} from '@siemens/ix-react';
import { AppSwitchConfiguration } from '@siemens/ix';
import { useState, useEffect } from 'react';
import {
  iconCloudUpload, iconClear, iconPrint, iconMoon, iconSun
} from '@siemens/ix-icons/icons';
import FileImportModal from './components/FileImport/FileImport';
import NodeTree from './components/NodeTree/NodeTree';
import DetailPanel from './components/DetailPanel/DetailPanel';
import { OpcUaNode, OpcUaNodeset, ImportError, NamespaceConflictStrategy } from '@/types';
import './App.css';

function App() {
  const [, setNodesets] = useState<OpcUaNodeset[]>([]);
  const [activeNodeset, setActiveNodeset] = useState<OpcUaNodeset | null>(null);
  const [selectedNode, setSelectedNode] = useState<OpcUaNode | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Initialize theme from localStorage or system preference
    const htmlElement = document.querySelector('html');
    if (!htmlElement) return;
    
    // Set the theme to classic
    htmlElement.setAttribute('data-ix-theme', 'classic');
    
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      htmlElement.setAttribute('data-ix-color-schema', savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = prefersDark ? 'dark' : 'light';
      setTheme(initialTheme);
      htmlElement.setAttribute('data-ix-color-schema', initialTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    const htmlElement = document.querySelector('html');
    if (htmlElement) {
      htmlElement.setAttribute('data-ix-color-schema', newTheme);
    }
    localStorage.setItem('theme', newTheme);
  };
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
    <IxApplication appSwitchConfig={appSwitchConfig}>
      <IxApplicationHeader name="OPC UA Web Modeler" nameSuffix='Information Model Viewer'>
        <div className="placeholder-logo" slot="logo"></div>
        <IxButton
          icon={theme === 'light' ? iconMoon : iconSun}
          onClick={toggleTheme}
          variant="subtle-tertiary"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? 'Dark' : 'Light'}
        </IxButton>

        <div slot="secondary">
          <IxIconButton
            icon={iconCloudUpload}
            onClick={openImportDialog}
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
            onClick={() => {
              setActiveNodeset(null);
              setSelectedNode(null);
            }}
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