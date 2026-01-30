import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { IxButton } from '@siemens/ix-react';
import { OpcUaNode, ParsedNodeset, NodeClass } from '@/types';
import './NodeGrid.css';

interface NodeGridProps {
  nodesetData: ParsedNodeset;
  onNodeSelect: (node: OpcUaNode) => void;
  selectedNodeId?: string;
}

type ColumnKey = 'displayName' | 'nodeClass' | 'nodeId' | 'browseName' | 'description';

interface ColumnWidths {
  displayName: number;
  nodeClass: number;
  nodeId: number;
  browseName: number;
  description: number;
}

const DEFAULT_COLUMN_WIDTHS: ColumnWidths = {
  displayName: 200,
  nodeClass: 120,
  nodeId: 180,
  browseName: 180,
  description: 300,
};

const STORAGE_KEY_COLUMN_WIDTHS = 'opcua-grid-column-widths';
const STORAGE_KEY_HIERARCHICAL = 'opcua-grid-hierarchical-view';

function NodeGrid({ nodesetData, onNodeSelect, selectedNodeId }: NodeGridProps) {
  const [searchText, setSearchText] = useState('');
  const [selectedNodeTypes] = useState<Set<NodeClass>>(
    new Set(Object.values(NodeClass))
  );
  const [sortColumns, setSortColumns] = useState<Array<{ column: keyof OpcUaNode; direction: 'asc' | 'desc' }>>(
    [{ column: 'displayName', direction: 'asc' }]
  );
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_COLUMN_WIDTHS);
      return stored ? JSON.parse(stored) : DEFAULT_COLUMN_WIDTHS;
    } catch {
      return DEFAULT_COLUMN_WIDTHS;
    }
  });
  const [resizingColumn, setResizingColumn] = useState<ColumnKey | null>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);
  const [columnFilters, setColumnFilters] = useState<Record<ColumnKey, string>>({
    displayName: '',
    nodeClass: '',
    nodeId: '',
    browseName: '',
    description: '',
  });
  const [, setActiveFilters] = useState<Set<ColumnKey>>(new Set());
  const [isHierarchical, setIsHierarchical] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_HIERARCHICAL);
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showNodeClassDropdown, setShowNodeClassDropdown] = useState(false);
  const [nodeClassFilters, setNodeClassFilters] = useState<Set<NodeClass>>(new Set());

  // Flatten all nodes from the tree structure
  const allNodes = useMemo(() => {
    const nodes: OpcUaNode[] = [];
    const flatten = (nodeList: OpcUaNode[]) => {
      nodeList.forEach(node => {
        nodes.push(node);
        if (node.children && node.children.length > 0) {
          flatten(node.children);
        }
      });
    };
    flatten(nodesetData.rootNodes);
    return nodes;
  }, [nodesetData.rootNodes]);

  // Filter and sort nodes
  const filteredAndSortedNodes = useMemo(() => {
    // First, filter nodes
    const filterNode = (node: OpcUaNode): OpcUaNode | null => {
      // Type filter
      if (!selectedNodeTypes.has(node.nodeClass)) {
        return null;
      }

      // Search filter
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const matchesSearch =
          node.displayName?.toLowerCase().includes(searchLower) ||
          node.browseName?.toLowerCase().includes(searchLower) ||
          node.nodeId?.toLowerCase().includes(searchLower) ||
          node.description?.toLowerCase().includes(searchLower);

        if (!matchesSearch) {
          return null;
        }
      }

      // Column filters
      if (columnFilters.displayName && !node.displayName?.toLowerCase().includes(columnFilters.displayName.toLowerCase())) {
        return null;
      }
      // Node Class multi-select filter
      if (nodeClassFilters.size > 0 && !nodeClassFilters.has(node.nodeClass)) {
        return null;
      }
      if (columnFilters.nodeId && !node.nodeId?.toLowerCase().includes(columnFilters.nodeId.toLowerCase())) {
        return null;
      }
      if (columnFilters.browseName && !node.browseName?.toLowerCase().includes(columnFilters.browseName.toLowerCase())) {
        return null;
      }
      if (columnFilters.description && !node.description?.toLowerCase().includes(columnFilters.description.toLowerCase())) {
        return null;
      }

      // If hierarchical, recursively filter children
      if (isHierarchical && node.children) {
        const filteredChildren = node.children
          .map(child => filterNode(child))
          .filter((child): child is OpcUaNode => child !== null);
        return { ...node, children: filteredChildren };
      }

      return node;
    };

    let filtered: OpcUaNode[];
    if (isHierarchical) {
      // Filter hierarchically
      filtered = nodesetData.rootNodes
        .map(node => filterNode(node))
        .filter((node): node is OpcUaNode => node !== null);
    } else {
      // Flatten and filter
      filtered = allNodes.filter(node => filterNode(node) !== null);

      // Multi-column sort for flat view
      filtered.sort((a, b) => {
        for (const { column, direction } of sortColumns) {
          const aVal = a[column] ?? '';
          const bVal = b[column] ?? '';
          const comparison = String(aVal).localeCompare(String(bVal));
          if (comparison !== 0) {
            return direction === 'asc' ? comparison : -comparison;
          }
        }
        return 0;
      });
    }

    return filtered;
  }, [allNodes, searchText, selectedNodeTypes, sortColumns, columnFilters, isHierarchical, nodesetData.rootNodes, nodeClassFilters]);

  const handleSort = (column: keyof OpcUaNode, shiftKey: boolean) => {
    if (shiftKey) {
      // Multi-column sort: add or modify column in sort array
      const existingIndex = sortColumns.findIndex(s => s.column === column);
      if (existingIndex >= 0) {
        // Toggle direction if already sorting by this column
        const newSortColumns = [...sortColumns];
        newSortColumns[existingIndex] = {
          column,
          direction: sortColumns[existingIndex].direction === 'asc' ? 'desc' : 'asc',
        };
        setSortColumns(newSortColumns);
      } else {
        // Add new column to sort
        setSortColumns([...sortColumns, { column, direction: 'asc' }]);
      }
    } else {
      // Single column sort: replace all with this column
      const existingIndex = sortColumns.findIndex(s => s.column === column);
      if (existingIndex === 0 && sortColumns.length === 1) {
        // Toggle direction if it's the only sort column
        setSortColumns([{ column, direction: sortColumns[0].direction === 'asc' ? 'desc' : 'asc' }]);
      } else {
        // Set as the only sort column
        setSortColumns([{ column, direction: 'asc' }]);
      }
    }
  };

  const getSortInfo = (column: keyof OpcUaNode) => {
    const index = sortColumns.findIndex(s => s.column === column);
    if (index === -1) return null;
    return {
      direction: sortColumns[index].direction,
      priority: sortColumns.length > 1 ? index + 1 : null,
    };
  };

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

  // Column resizing handlers
  const handleResizeStart = (e: React.MouseEvent, column: ColumnKey) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(column);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = columnWidths[column];
  };

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizingColumn) return;
    const delta = e.clientX - resizeStartX.current;
    const newWidth = Math.max(50, resizeStartWidth.current + delta);
    setColumnWidths(prev => ({
      ...prev,
      [resizingColumn]: newWidth,
    }));
  }, [resizingColumn]);

  const handleResizeEnd = useCallback(() => {
    setResizingColumn(null);
  }, []);

  const handleDoubleClickResize = (column: ColumnKey) => {
    // Auto-fit: reset to default width
    setColumnWidths(prev => ({
      ...prev,
      [column]: DEFAULT_COLUMN_WIDTHS[column],
    }));
  };

  const resetColumnWidths = () => {
    setColumnWidths(DEFAULT_COLUMN_WIDTHS);
  };

  // Column filter handlers
  const handleColumnFilterChange = (column: ColumnKey, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value,
    }));
    if (value) {
      setActiveFilters(prev => new Set(prev).add(column));
    } else {
      setActiveFilters(prev => {
        const newSet = new Set(prev);
        newSet.delete(column);
        return newSet;
      });
    }
  };

  const clearColumnFilter = (column: ColumnKey) => {
    handleColumnFilterChange(column, '');
  };

  const clearAllFilters = () => {
    setColumnFilters({
      displayName: '',
      nodeClass: '',
      nodeId: '',
      browseName: '',
      description: '',
    });
    setActiveFilters(new Set());
    setNodeClassFilters(new Set());
    setSearchText('');
  };

  const toggleNodeClassFilter = (nodeClass: NodeClass) => {
    setNodeClassFilters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeClass)) {
        newSet.delete(nodeClass);
      } else {
        newSet.add(nodeClass);
      }
      return newSet;
    });
  };

  const clearNodeClassFilter = () => {
    setNodeClassFilters(new Set());
  };

  // Hierarchical view handlers
  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

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
    collectNodeIds(nodesetData.rootNodes);
    setExpandedNodes(allNodeIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  // Build hierarchical display list
  const buildHierarchicalList = (nodes: OpcUaNode[], level = 0): Array<{ node: OpcUaNode; level: number }> => {
    const result: Array<{ node: OpcUaNode; level: number }> = [];
    nodes.forEach(node => {
      result.push({ node, level });
      if (node.children && node.children.length > 0 && expandedNodes.has(node.nodeId)) {
        result.push(...buildHierarchicalList(node.children, level + 1));
      }
    });
    return result;
  };

  // Add/remove event listeners for column resizing
  useEffect(() => {
    if (resizingColumn) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [resizingColumn, handleResizeMove, handleResizeEnd]);

  // Persist column widths to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COLUMN_WIDTHS, JSON.stringify(columnWidths));
    } catch (error) {
      console.warn('Failed to save column widths to localStorage:', error);
    }
  }, [columnWidths]);

  // Persist hierarchical view preference
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HIERARCHICAL, JSON.stringify(isHierarchical));
    } catch (error) {
      console.warn('Failed to save hierarchical view preference to localStorage:', error);
    }
  }, [isHierarchical]);

  // Close Node Class dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showNodeClassDropdown) {
        setShowNodeClassDropdown(false);
      }
    };
    
    if (showNodeClassDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [showNodeClassDropdown]);

  return (
    <div className="node-grid">
      <h3 className="panel-title">Uploaded Nodeset: {nodesetData.fileName}</h3>

      {/* View Controls */}
      <div className="grid-controls">
        <div className="view-toggle">
          <button
            className={`view-toggle-btn ${!isHierarchical ? 'active' : ''}`}
            onClick={() => setIsHierarchical(false)}
            title="Flat view"
          >
            Flat View
          </button>
          <button
            className={`view-toggle-btn ${isHierarchical ? 'active' : ''}`}
            onClick={() => setIsHierarchical(true)}
            title="Hierarchical view"
          >
            Hierarchical View
          </button>
        </div>
        <div className="grid-controls-right">
          {isHierarchical && (
            <div className="expansion-controls">
              <button className="expansion-btn" onClick={expandAll} title="Expand all">
                ▼ Expand All
              </button>
              <button className="expansion-btn" onClick={collapseAll} title="Collapse all">
                ▶ Collapse All
              </button>
            </div>
          )}
          <button 
            className="expansion-btn" 
            onClick={resetColumnWidths} 
            title="Reset all column widths to defaults"
          >
            ↔ Reset Column Widths
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="grid-table-container">
        <table className="grid-table">
          <thead>
            <tr>
              <th 
                onClick={(e) => handleSort('displayName', e.shiftKey)} 
                className="sortable resizable"
                style={{ width: `${columnWidths.displayName}px` }}
              >
                <div className="th-content">
                  Display Name
                  {(() => {
                    const sortInfo = getSortInfo('displayName');
                    if (sortInfo) {
                      return (
                        <span className="sort-indicator">
                          {sortInfo.direction === 'asc' ? '▲' : '▼'}
                          {sortInfo.priority && <span className="sort-priority">{sortInfo.priority}</span>}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
                <div 
                  className="resize-handle"
                  onMouseDown={(e) => handleResizeStart(e, 'displayName')}
                  onDoubleClick={() => handleDoubleClickResize('displayName')}
                  onClick={(e) => e.stopPropagation()}
                />
              </th>
              <th 
                onClick={(e) => handleSort('nodeClass', e.shiftKey)} 
                className="sortable resizable"
                style={{ width: `${columnWidths.nodeClass}px` }}
              >
                <div className="th-content">
                  Node Class
                  {(() => {
                    const sortInfo = getSortInfo('nodeClass');
                    if (sortInfo) {
                      return (
                        <span className="sort-indicator">
                          {sortInfo.direction === 'asc' ? '▲' : '▼'}
                          {sortInfo.priority && <span className="sort-priority">{sortInfo.priority}</span>}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
                <div 
                  className="resize-handle"
                  onMouseDown={(e) => handleResizeStart(e, 'nodeClass')}
                  onDoubleClick={() => handleDoubleClickResize('nodeClass')}
                  onClick={(e) => e.stopPropagation()}
                />
              </th>
              <th 
                onClick={(e) => handleSort('nodeId', e.shiftKey)} 
                className="sortable resizable"
                style={{ width: `${columnWidths.nodeId}px` }}
              >
                <div className="th-content">
                  Node ID
                  {(() => {
                    const sortInfo = getSortInfo('nodeId');
                    if (sortInfo) {
                      return (
                        <span className="sort-indicator">
                          {sortInfo.direction === 'asc' ? '▲' : '▼'}
                          {sortInfo.priority && <span className="sort-priority">{sortInfo.priority}</span>}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
                <div 
                  className="resize-handle"
                  onMouseDown={(e) => handleResizeStart(e, 'nodeId')}
                  onDoubleClick={() => handleDoubleClickResize('nodeId')}
                  onClick={(e) => e.stopPropagation()}
                />
              </th>
              <th 
                onClick={(e) => handleSort('browseName', e.shiftKey)} 
                className="sortable resizable"
                style={{ width: `${columnWidths.browseName}px` }}
              >
                <div className="th-content">
                  Browse Name
                  {(() => {
                    const sortInfo = getSortInfo('browseName');
                    if (sortInfo) {
                      return (
                        <span className="sort-indicator">
                          {sortInfo.direction === 'asc' ? '▲' : '▼'}
                          {sortInfo.priority && <span className="sort-priority">{sortInfo.priority}</span>}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
                <div 
                  className="resize-handle"
                  onMouseDown={(e) => handleResizeStart(e, 'browseName')}
                  onDoubleClick={() => handleDoubleClickResize('browseName')}
                  onClick={(e) => e.stopPropagation()}
                />
              </th>
              <th 
                className="resizable"
                style={{ width: `${columnWidths.description}px` }}
              >
                <div className="th-content">
                  Description
                </div>
                <div 
                  className="resize-handle"
                  onMouseDown={(e) => handleResizeStart(e, 'description')}
                  onDoubleClick={() => handleDoubleClickResize('description')}
                  onClick={(e) => e.stopPropagation()}
                />
              </th>
            </tr>
            <tr className="filter-row">
              <th style={{ width: `${columnWidths.displayName}px` }}>
                <div className="filter-cell">
                  <input
                    type="text"
                    className="column-filter-input"
                    placeholder="Filter..."
                    value={columnFilters.displayName}
                    onChange={(e) => handleColumnFilterChange('displayName', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {columnFilters.displayName && (
                    <button
                      className="filter-clear-btn"
                      onClick={() => clearColumnFilter('displayName')}
                      title="Clear filter"
                    >
                      ×
                    </button>
                  )}
                </div>
              </th>
              <th style={{ width: `${columnWidths.nodeClass}px` }}>
                <div className="filter-cell">
                  <button
                    className="nodeclass-filter-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowNodeClassDropdown(!showNodeClassDropdown);
                    }}
                    title="Filter by node class"
                  >
                    {nodeClassFilters.size > 0 ? `${nodeClassFilters.size} selected` : 'Filter...'}
                    <span className="dropdown-arrow">▼</span>
                  </button>
                  {nodeClassFilters.size > 0 && (
                    <button
                      className="filter-clear-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearNodeClassFilter();
                      }}
                      title="Clear filter"
                    >
                      ×
                    </button>
                  )}
                  {showNodeClassDropdown && (
                    <div className="nodeclass-dropdown" onClick={(e) => e.stopPropagation()}>
                      {Object.values(NodeClass).map((nodeClass) => (
                        <label key={nodeClass} className="nodeclass-option">
                          <input
                            type="checkbox"
                            checked={nodeClassFilters.has(nodeClass)}
                            onChange={() => toggleNodeClassFilter(nodeClass)}
                          />
                          <span>{nodeClass}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </th>
              <th style={{ width: `${columnWidths.nodeId}px` }}>
                <div className="filter-cell">
                  <input
                    type="text"
                    className="column-filter-input"
                    placeholder="Filter..."
                    value={columnFilters.nodeId}
                    onChange={(e) => handleColumnFilterChange('nodeId', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {columnFilters.nodeId && (
                    <button
                      className="filter-clear-btn"
                      onClick={() => clearColumnFilter('nodeId')}
                      title="Clear filter"
                    >
                      ×
                    </button>
                  )}
                </div>
              </th>
              <th style={{ width: `${columnWidths.browseName}px` }}>
                <div className="filter-cell">
                  <input
                    type="text"
                    className="column-filter-input"
                    placeholder="Filter..."
                    value={columnFilters.browseName}
                    onChange={(e) => handleColumnFilterChange('browseName', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {columnFilters.browseName && (
                    <button
                      className="filter-clear-btn"
                      onClick={() => clearColumnFilter('browseName')}
                      title="Clear filter"
                    >
                      ×
                    </button>
                  )}
                </div>
              </th>
              <th style={{ width: `${columnWidths.description}px` }}>
                <div className="filter-cell">
                  <input
                    type="text"
                    className="column-filter-input"
                    placeholder="Filter..."
                    value={columnFilters.description}
                    onChange={(e) => handleColumnFilterChange('description', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {columnFilters.description && (
                    <button
                      className="filter-clear-btn"
                      onClick={() => clearColumnFilter('description')}
                      title="Clear filter"
                    >
                      ×
                    </button>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {isHierarchical ? (
              // Hierarchical view
              buildHierarchicalList(filteredAndSortedNodes).length > 0 ? (
                buildHierarchicalList(filteredAndSortedNodes).map(({ node, level }) => (
                  <tr
                    key={node.nodeId}
                    className={selectedNodeId === node.nodeId ? 'selected' : ''}
                    onClick={() => onNodeSelect(node)}
                  >
                    <td className="node-name">
                      <div className="hierarchical-cell" style={{ paddingLeft: `${level * 1.5}rem` }}>
                        {node.children && node.children.length > 0 ? (
                          <button
                            className="expand-icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleNodeExpansion(node.nodeId);
                            }}
                          >
                            {expandedNodes.has(node.nodeId) ? '▼' : '▶'}
                          </button>
                        ) : (
                          <span className="expand-icon-placeholder"></span>
                        )}
                        <span className="node-icon">{getNodeIcon(node.nodeClass)}</span>
                        {node.displayName || node.browseName}
                      </div>
                    </td>
                    <td>
                      <span className={`node-class-badge ${node.nodeClass.toLowerCase()}`}>
                        {node.nodeClass}
                      </span>
                    </td>
                    <td className="node-id">{node.nodeId}</td>
                    <td>{node.browseName}</td>
                    <td className="node-description">{node.description || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="empty-state">
                    <div className="empty-state-content">
                      <p>No nodes found matching your filters</p>
                      <IxButton onClick={clearAllFilters}>
                        Clear All Filters
                      </IxButton>
                    </div>
                  </td>
                </tr>
              )
            ) : (
              // Flat view
              filteredAndSortedNodes.length > 0 ? (
                filteredAndSortedNodes.map((node) => (
                  <tr
                    key={node.nodeId}
                    className={selectedNodeId === node.nodeId ? 'selected' : ''}
                    onClick={() => onNodeSelect(node)}
                  >
                    <td className="node-name">
                      <span className="node-icon">{getNodeIcon(node.nodeClass)}</span>
                      {node.displayName || node.browseName}
                    </td>
                    <td>
                      <span className={`node-class-badge ${node.nodeClass.toLowerCase()}`}>
                        {node.nodeClass}
                      </span>
                    </td>
                    <td className="node-id">{node.nodeId}</td>
                    <td>{node.browseName}</td>
                    <td className="node-description">{node.description || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="empty-state">
                    <div className="empty-state-content">
                      <p>No nodes found matching your filters</p>
                      <IxButton onClick={clearAllFilters}>
                        Clear All Filters
                      </IxButton>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default NodeGrid;
