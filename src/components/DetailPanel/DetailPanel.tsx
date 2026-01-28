import { useState } from 'react';
import { IxButton, IxCard, IxCardContent, IxIcon, IxIconButton } from '@siemens/ix-react';
import { iconCopy, iconChevronDown, iconChevronRight } from '@siemens/ix-icons/icons';
import { OpcUaNode, ParsedNodeset } from '@/types';
import './DetailPanel.css';

interface DetailPanelProps {
  selectedNode: OpcUaNode | null;
  nodesetData: ParsedNodeset;
  onNodeSelect: (node: OpcUaNode) => void;
}

interface PropertySectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

function PropertySection({ title, children, defaultExpanded = true }: PropertySectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="property-section">
      <div className="section-header" onClick={() => setIsExpanded(!isExpanded)}>
        <IxIcon name={isExpanded ? iconChevronDown : iconChevronRight} size="16" />
        <h4>{title}</h4>
      </div>
      {isExpanded && <div className="section-content">{children}</div>}
    </div>
  );
}

interface PropertyItemProps {
  label: string;
  value: string | number | undefined;
  copyable?: boolean;
}

function PropertyItem({ label, value, copyable = false }: PropertyItemProps) {
  const displayValue = value ?? '-';

  const handleCopy = () => {
    navigator.clipboard.writeText(String(displayValue));
  };

  return (
    <div className="property-item">
      <span className="property-label">{label}</span>
      <span className="property-value">
        {displayValue}
        {copyable && displayValue !== '-' && (
          <IxIconButton
            icon={iconCopy}
            ghost
            size="16"
            onClick={handleCopy}
            title="Copy to clipboard"
          />
        )}
      </span>
    </div>
  );
}

interface ReferencesListProps {
  node: OpcUaNode;
  nodesetData: ParsedNodeset;
  onNodeSelect: (node: OpcUaNode) => void;
}

function ReferencesList({ node, nodesetData, onNodeSelect }: ReferencesListProps) {
  // Group references by type
  const groupedRefs = node.references.reduce((acc, ref) => {
    if (!acc[ref.referenceType]) {
      acc[ref.referenceType] = [];
    }
    acc[ref.referenceType].push(ref);
    return acc;
  }, {} as Record<string, typeof node.references>);

  const handleReferenceClick = (targetNodeId: string) => {
    const targetNode = nodesetData.nodes.get(targetNodeId);
    if (targetNode) {
      onNodeSelect(targetNode);
    }
  };

  if (node.references.length === 0) {
    return <p className="empty-state">No references available</p>;
  }

  return (
    <div className="references-list">
      {Object.entries(groupedRefs).map(([refType, refs]) => (
        <div key={refType} className="reference-group">
          <div className="reference-type-header">
            <IxIcon name={iconChevronRight} size="12" />
            <span className="reference-type">{refType}</span>
            <span className="reference-count">({refs.length})</span>
          </div>
          <ul className="reference-items">
            {refs.map((ref, idx) => {
              const targetNode = nodesetData.nodes.get(ref.targetNodeId);
              const displayName = targetNode?.displayName || ref.targetNodeId;
              
              return (
                <li key={`${ref.targetNodeId}-${idx}`} className="reference-item">
                  <span className="reference-direction">
                    {ref.isForward ? '→' : '←'}
                  </span>
                  <button
                    className="reference-link"
                    onClick={() => handleReferenceClick(ref.targetNodeId)}
                    disabled={!targetNode}
                    title={ref.targetNodeId}
                  >
                    {displayName}
                  </button>
                  <span className="reference-nodeid">{ref.targetNodeId}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

interface HierarchyViewProps {
  node: OpcUaNode;
  nodesetData: ParsedNodeset;
  onNodeSelect: (node: OpcUaNode) => void;
}

function HierarchyView({ node, nodesetData, onNodeSelect }: HierarchyViewProps) {
  const getParentNode = () => {
    const parentRef = node.references.find(
      (ref) =>
        !ref.isForward &&
        (ref.referenceType === 'HasComponent' ||
          ref.referenceType === 'Organizes' ||
          ref.referenceType === 'HasProperty')
    );
    return parentRef ? nodesetData.nodes.get(parentRef.targetNodeId) : null;
  };

  const getTypeDefinitionNode = () => {
    const typeRef = node.references.find(
      (ref) => ref.isForward && ref.referenceType === 'HasTypeDefinition'
    );
    return typeRef ? nodesetData.nodes.get(typeRef.targetNodeId) : null;
  };

  const getBaseTypeNode = () => {
    const baseRef = node.references.find(
      (ref) => ref.isForward && ref.referenceType === 'HasSubtype'
    );
    return baseRef ? nodesetData.nodes.get(baseRef.targetNodeId) : null;
  };

  const parentNode = getParentNode();
  const typeDefNode = getTypeDefinitionNode();
  const baseTypeNode = getBaseTypeNode();

  const hasHierarchy = parentNode || typeDefNode || baseTypeNode || node.derivedFrom;

  if (!hasHierarchy) {
    return <p className="empty-state">No hierarchy information available</p>;
  }

  return (
    <div className="hierarchy-view">
      {parentNode && (
        <div className="hierarchy-item">
          <span className="hierarchy-label">Parent:</span>
          <button
            className="hierarchy-link"
            onClick={() => onNodeSelect(parentNode)}
            title={parentNode.nodeId}
          >
            {parentNode.displayName}
          </button>
          <span className="hierarchy-nodeid">{parentNode.nodeId}</span>
        </div>
      )}

      {typeDefNode && (
        <div className="hierarchy-item">
          <span className="hierarchy-label">Type Definition:</span>
          <button
            className="hierarchy-link"
            onClick={() => onNodeSelect(typeDefNode)}
            title={typeDefNode.nodeId}
          >
            {typeDefNode.displayName}
          </button>
          <span className="hierarchy-nodeid">{typeDefNode.nodeId}</span>
        </div>
      )}

      {baseTypeNode && (
        <div className="hierarchy-item">
          <span className="hierarchy-label">Base Type:</span>
          <button
            className="hierarchy-link"
            onClick={() => onNodeSelect(baseTypeNode)}
            title={baseTypeNode.nodeId}
          >
            {baseTypeNode.displayName}
          </button>
          <span className="hierarchy-nodeid">{baseTypeNode.nodeId}</span>
        </div>
      )}

      {node.derivedFrom && !baseTypeNode && (
        <div className="hierarchy-item">
          <span className="hierarchy-label">Derived From:</span>
          <span className="hierarchy-value">{node.derivedFrom}</span>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="detail-panel empty-state-container">
      <IxCard>
        <IxCardContent>
          <div className="empty-state-content">
            <IxIcon name="info" size="32" />
            <h3>No Node Selected</h3>
            <p>Select a node from the tree to view its details</p>
          </div>
        </IxCardContent>
      </IxCard>
    </div>
  );
}

function DetailPanel({ selectedNode, nodesetData, onNodeSelect }: DetailPanelProps) {
  const [showRawData, setShowRawData] = useState(false);

  if (!selectedNode) {
    return <EmptyState />;
  }

  const getNodeClassBadgeClass = (nodeClass: string) => {
    return `node-class-badge ${nodeClass.toLowerCase()}`;
  };

  const getValueRankDisplay = (valueRank: number | undefined) => {
    if (valueRank === undefined || valueRank === null) return '-';
    switch (valueRank) {
      case -3:
        return '-3 (ScalarOrOneDimension)';
      case -2:
        return '-2 (Any)';
      case -1:
        return '-1 (Scalar)';
      case 0:
        return '0 (OneOrMoreDimensions)';
      case 1:
        return '1 (OneDimension)';
      default:
        return `${valueRank}`;
    }
  };

  return (
    <div className="detail-panel">
      {/* Header Section */}
      <div className="detail-header">
        <div className="detail-title-section">
          <h2 className="detail-title">{selectedNode.displayName}</h2>
          <span className={getNodeClassBadgeClass(selectedNode.nodeClass)}>
            {selectedNode.nodeClass}
          </span>
        </div>
        <div className="detail-actions">
          <IxButton ghost onClick={() => {
            navigator.clipboard.writeText(selectedNode.nodeId);
          }}>
            <IxIcon name={iconCopy} size="16" />
            Copy NodeId
          </IxButton>
        </div>
      </div>

      {/* Basic Properties */}
      <PropertySection title="Basic Properties" defaultExpanded={true}>
        <div className="properties-grid">
          <PropertyItem label="NodeId" value={selectedNode.nodeId} copyable />
          <PropertyItem label="BrowseName" value={selectedNode.browseName} />
          <PropertyItem label="NodeClass" value={selectedNode.nodeClass} />
          {selectedNode.description && (
            <div className="property-item full-width">
              <span className="property-label">Description</span>
              <span className="property-value description">{selectedNode.description}</span>
            </div>
          )}
        </div>
      </PropertySection>

      {/* Attributes Section */}
      {(selectedNode.dataType || selectedNode.valueRank !== undefined || selectedNode.type) && (
        <PropertySection title="Attributes" defaultExpanded={true}>
          <div className="properties-grid">
            {selectedNode.dataType && (
              <PropertyItem label="DataType" value={selectedNode.dataType} />
            )}
            {selectedNode.valueRank !== undefined && (
              <PropertyItem label="ValueRank" value={getValueRankDisplay(selectedNode.valueRank)} />
            )}
            {selectedNode.type && (
              <PropertyItem label="Type" value={selectedNode.type} />
            )}
            {selectedNode.typeDefinition && (
              <PropertyItem label="Type Definition" value={selectedNode.typeDefinition} />
            )}
            {selectedNode.modellingRule && (
              <PropertyItem label="Modelling Rule" value={selectedNode.modellingRule} />
            )}
          </div>
        </PropertySection>
      )}

      {/* References Section */}
      <PropertySection
        title={`References (${selectedNode.references.length})`}
        defaultExpanded={selectedNode.references.length > 0 && selectedNode.references.length <= 20}
      >
        <ReferencesList
          node={selectedNode}
          nodesetData={nodesetData}
          onNodeSelect={onNodeSelect}
        />
      </PropertySection>

      {/* Hierarchy Section */}
      <PropertySection title="Hierarchy" defaultExpanded={true}>
        <HierarchyView
          node={selectedNode}
          nodesetData={nodesetData}
          onNodeSelect={onNodeSelect}
        />
      </PropertySection>

      {/* Extended Information */}
      <PropertySection title="Extended Information" defaultExpanded={false}>
        <div className="extended-info">
          <div className="info-toggle">
            <IxButton outline onClick={() => setShowRawData(!showRawData)}>
              {showRawData ? 'Hide' : 'Show'} Raw Data (JSON)
            </IxButton>
          </div>
          {showRawData && (
            <pre className="raw-data">
              {JSON.stringify(
                {
                  ...selectedNode,
                  children: selectedNode.children ? `[${selectedNode.children.length} children]` : undefined,
                },
                null,
                2
              )}
            </pre>
          )}
        </div>
      </PropertySection>
    </div>
  );
}

export default DetailPanel;
