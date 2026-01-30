import { useState, useEffect, useRef, useCallback } from 'react';
import { OpcUaNode, NodeClass, ParsedNodeset } from '../../types/opcua.types';
import './NodeTree.css';
import { IxButton } from '@siemens/ix-react';

interface NodeTreeProps {
  nodesetData: ParsedNodeset;
  onNodeSelect: (node: OpcUaNode) => void;
  selectedNodeId?: string;
  expandedNodeIds?: Set<string>;
  onExpandedNodesChange?: (expandedIds: Set<string>) => void;
}

function NodeTree({ 
  nodesetData, 
  onNodeSelect, 
  selectedNodeId,
  expandedNodeIds,
  onExpandedNodesChange
}: NodeTreeProps) {
  const [internalExpandedNodes, setInternalExpandedNodes] = useState<Set<string>>(new Set());
  const [searchText, setSearchText] = useState('');
  const [selectedNodeTypes, setSelectedNodeTypes] = useState<Set<NodeClass>>(
    new Set(Object.values(NodeClass))
  );
  const [filteredNodes, setFilteredNodes] = useState<OpcUaNode[]>([]);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const treeContainerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Use controlled or internal expanded state
  const expandedNodes = expandedNodeIds ?? internalExpandedNodes;
  const setExpandedNodes = onExpandedNodesChange ?? setInternalExpandedNodes;

  // Filter nodes based on search and type filters
  useEffect(() => {
    const filterNodes = (nodes: OpcUaNode[]): OpcUaNode[] => {
      return nodes
        .filter(node => {
          // Check if node type is selected
          if (!selectedNodeTypes.has(node.nodeClass)) {
            return false;
          }
          
          // Check if node matches search text
          if (searchText) {
            const searchLower = searchText.toLowerCase();
            const matchesSearch = 
              node.displayName?.toLowerCase().includes(searchLower) ||
              node.browseName?.toLowerCase().includes(searchLower) ||
              node.nodeId?.toLowerCase().includes(searchLower) ||
              node.description?.toLowerCase().includes(searchLower);
            
            if (!matchesSearch) {
              return false;
            }
          }
          
          return true;
        })
        .map(node => {
          // Recursively filter children
          if (node.children && node.children.length > 0) {
            const filteredChildren = filterNodes(node.children);
            return { ...node, children: filteredChildren };
          }
          return node;
        });
    };

    setFilteredNodes(filterNodes(nodesetData.rootNodes));
  }, [nodesetData.rootNodes, searchText, selectedNodeTypes]);

  const toggleNode = useCallback((nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  }, [expandedNodes, setExpandedNodes]);

  const expandAll = () => {
    const allNodeIds = new Set<string>();
    const collectNodeIds = (nodes: OpcUaNode[]) => {
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          allNodeIds.add(node.nodeId);
          collectNodeIds(node.children);
        }
      });
    };
    collectNodeIds(filteredNodes);
    setExpandedNodes(allNodeIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const toggleNodeType = (nodeClass: NodeClass) => {
    const newTypes = new Set(selectedNodeTypes);
    if (newTypes.has(nodeClass)) {
      newTypes.delete(nodeClass);
    } else {
      newTypes.add(nodeClass);
    }
    setSelectedNodeTypes(newTypes);
  };

  // Scroll selected node into view
  useEffect(() => {
    if (selectedNodeId) {
      const nodeElement = nodeRefs.current.get(selectedNodeId);
      if (nodeElement) {
        nodeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedNodeId]);

  // Get all visible nodes in order for keyboard navigation
  const getVisibleNodes = useCallback((): OpcUaNode[] => {
    const visible: OpcUaNode[] = [];
    const traverse = (nodes: OpcUaNode[]) => {
      nodes.forEach(node => {
        visible.push(node);
        if (node.children && node.children.length > 0 && expandedNodes.has(node.nodeId)) {
          traverse(node.children);
        }
      });
    };
    traverse(filteredNodes);
    return visible;
  }, [expandedNodes, filteredNodes]);

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const visibleNodes = getVisibleNodes();
      if (visibleNodes.length === 0) return;

      const currentIndex = focusedNodeId 
        ? visibleNodes.findIndex(n => n.nodeId === focusedNodeId)
        : selectedNodeId
        ? visibleNodes.findIndex(n => n.nodeId === selectedNodeId)
        : -1;

      let newIndex = currentIndex;
      let handled = false;

      switch (e.key) {
        case 'ArrowDown':
          newIndex = currentIndex < visibleNodes.length - 1 ? currentIndex + 1 : currentIndex;
          handled = true;
          break;
        case 'ArrowUp':
          newIndex = currentIndex > 0 ? currentIndex - 1 : 0;
          handled = true;
          break;
        case 'ArrowRight': {
          const currentNode = visibleNodes[currentIndex];
          if (currentNode && currentNode.children && currentNode.children.length > 0) {
            if (!expandedNodes.has(currentNode.nodeId)) {
              toggleNode(currentNode.nodeId);
              handled = true;
            }
          }
          break;
        }
        case 'ArrowLeft': {
          const currentNode = visibleNodes[currentIndex];
          if (currentNode && expandedNodes.has(currentNode.nodeId)) {
            toggleNode(currentNode.nodeId);
            handled = true;
          }
          break;
        }
        case 'Enter': {
          const nodeToSelect = visibleNodes[newIndex >= 0 ? newIndex : 0];
          if (nodeToSelect) {
            onNodeSelect(nodeToSelect);
            handled = true;
          }
          break;
        }
      }

      if (handled) {
        e.preventDefault();
        if (newIndex >= 0 && newIndex < visibleNodes.length) {
          const newNode = visibleNodes[newIndex];
          setFocusedNodeId(newNode.nodeId);
          const nodeElement = nodeRefs.current.get(newNode.nodeId);
          if (nodeElement) {
            nodeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
      }
    };

    const container = treeContainerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      return () => container.removeEventListener('keydown', handleKeyDown);
    }
  }, [focusedNodeId, selectedNodeId, filteredNodes, expandedNodes, onNodeSelect, getVisibleNodes, toggleNode]);

  const getNodeIcon = (nodeClass: NodeClass): string => {
    const iconMap: Record<NodeClass, string> = {
      [NodeClass.Object]: '📦',
      [NodeClass.Variable]: '🔢',
      [NodeClass.Method]: '⚡',
      [NodeClass.ObjectType]: '📋',
      [NodeClass.VariableType]: '📊',
      [NodeClass.ReferenceType]: '🔗',
      [NodeClass.DataType]: '💾',
      [NodeClass.View]: '👁️',
    };
    return iconMap[nodeClass] || '⚪';
  };

  const renderTreeNode = (node: OpcUaNode, level = 0): JSX.Element => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.nodeId);
    const isSelected = selectedNodeId === node.nodeId;
    const isFocused = focusedNodeId === node.nodeId;
    const indentWidth = level * 20;

    return (
      <div key={node.nodeId} className="tree-node">
        <div
          ref={(el) => {
            if (el) nodeRefs.current.set(node.nodeId, el);
            else nodeRefs.current.delete(node.nodeId);
          }}
          className={`tree-item ${isSelected ? 'selected' : ''} ${isFocused ? 'focused' : ''}`}
          style={{ paddingLeft: `${indentWidth + 8}px` }}
          onClick={() => {
            onNodeSelect(node);
            setFocusedNodeId(node.nodeId);
          }}
          tabIndex={0}
          role="treeitem"
          aria-selected={isSelected}
          aria-expanded={hasChildren ? isExpanded : undefined}
          title={`${node.displayName || node.browseName}\nNodeId: ${node.nodeId}\nClass: ${node.nodeClass}`}
        >
          {hasChildren ? (
            <span
              className="tree-toggle"
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.nodeId);
              }}
            >
              {isExpanded ? '▼' : '▶'}
            </span>
          ) : (
            <span className="tree-toggle-placeholder"></span>
          )}
          <span className="tree-item-icon">{getNodeIcon(node.nodeClass)}</span>
          <span className="tree-item-label">
            {node.displayName || node.browseName}
          </span>
          {hasChildren && !isExpanded && (
            <span className="tree-item-count">({node.children!.length})</span>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="tree-children">
            {node.children!.map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const getTotalNodeCount = (): number => {
    let count = 0;
    const countNodes = (nodes: OpcUaNode[]) => {
      nodes.forEach(node => {
        count++;
        if (node.children && node.children.length > 0) {
          countNodes(node.children);
        }
      });
    };
    countNodes(filteredNodes);
    return count;
  };

  // SearchBar sub-component
  const SearchBar = () => (
    <div className="tree-search-bar">
      <input
        type="text"
        className="tree-search-input"
        placeholder="Search nodes..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        aria-label="Search nodes"
      />
      {searchText && (
        <IxButton
          className="tree-search-clear"
          onClick={() => setSearchText('')}
          title="Clear search"
          aria-label="Clear search"
        >
          ✕
        </IxButton>
      )}
    </div>
  );

  // TypeFilter sub-component
  const TypeFilter = () => (
    <div className="tree-filters">
      <div className="tree-filter-label">Filter by type:</div>
      <div className="tree-filter-buttons">
        {Object.values(NodeClass).map((nodeClass) => (
          <IxButton
            key={nodeClass}
            className={`tree-filter-button ${selectedNodeTypes.has(nodeClass) ? 'active' : ''}`}
            onClick={() => toggleNodeType(nodeClass)}
            title={nodeClass}
            aria-pressed={selectedNodeTypes.has(nodeClass)}
          >
            {getNodeIcon(nodeClass)} {nodeClass}
          </IxButton>
        ))}
      </div>
    </div>
  );

  return (
    <div className="node-tree" role="tree" aria-label="OPC UA Node Tree">
      <SearchBar />
      <TypeFilter />

      {/* Toolbar */}
      <div className="tree-toolbar">
        <button className="tree-toolbar-button" onClick={expandAll}>
          Expand All
        </button>
        <button className="tree-toolbar-button" onClick={collapseAll}>
          Collapse All
        </button>
        <span className="tree-node-count">
          Showing {getTotalNodeCount()} node{getTotalNodeCount() !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tree Container */}
      <div className="tree-container" ref={treeContainerRef} tabIndex={0}>
        {filteredNodes.length > 0 ? (
          filteredNodes.map((node) => renderTreeNode(node, 0))
        ) : (
          <div className="tree-empty-state">
            <p>No nodes found matching your filters</p>
            <button 
              onClick={() => {
                setSearchText('');
                setSelectedNodeTypes(new Set(Object.values(NodeClass)));
              }}
              aria-label="Reset all filters"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default NodeTree;
