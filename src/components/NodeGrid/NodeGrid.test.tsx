import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NodeGrid from './NodeGrid';
import { OpcUaNode, NodeClass, ParsedNodeset } from '../../types/opcua.types';

// Mock IX components
vi.mock('@siemens/ix-react', () => ({
  IxButton: ({ children, onClick }: { children?: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

// Mock data for testing
const createMockNode = (
  id: string,
  name: string,
  nodeClass: NodeClass,
  children?: OpcUaNode[]
): OpcUaNode => ({
  nodeId: id,
  browseName: name,
  displayName: name,
  nodeClass,
  description: `Description for ${name}`,
  references: [],
  children: children || [],
});

const mockNodeset: ParsedNodeset = {
  fileName: 'test.xml',
  namespaceUri: 'http://test.com/UA',
  namespaceIndex: 1,
  nodes: new Map(),
  rootNodes: [
    createMockNode('ns=0;i=1', 'Objects', NodeClass.Object, [
      createMockNode('ns=0;i=2', 'Server', NodeClass.Object, [
        createMockNode('ns=0;i=3', 'ServerStatus', NodeClass.Variable),
      ]),
      createMockNode('ns=0;i=4', 'Device', NodeClass.Object),
    ]),
    createMockNode('ns=0;i=5', 'Types', NodeClass.ObjectType, [
      createMockNode('ns=0;i=6', 'BaseObjectType', NodeClass.ObjectType),
    ]),
  ],
};

describe('NodeGrid Component', () => {
  let mockOnNodeSelect: (node: OpcUaNode) => void;

  beforeEach(() => {
    mockOnNodeSelect = vi.fn();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Basic Rendering', () => {
    it('should render the grid with table headers', () => {
      render(<NodeGrid nodesetData={mockNodeset} onNodeSelect={mockOnNodeSelect} />);
      
      expect(screen.getByText('Display Name')).toBeInTheDocument();
      expect(screen.getByText('Node Class')).toBeInTheDocument();
      expect(screen.getByText('Node ID')).toBeInTheDocument();
      expect(screen.getByText('Browse Name')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('should render nodeset filename in title', () => {
      render(<NodeGrid nodesetData={mockNodeset} onNodeSelect={mockOnNodeSelect} />);
      
      expect(screen.getByText(/test\.xml/)).toBeInTheDocument();
    });

    it('should render all nodes in flat view by default', () => {
      render(<NodeGrid nodesetData={mockNodeset} onNodeSelect={mockOnNodeSelect} />);
      
      // Check by node IDs which are unique
      expect(screen.getByText('ns=0;i=1')).toBeInTheDocument(); // Objects
      expect(screen.getByText('ns=0;i=2')).toBeInTheDocument(); // Server
      expect(screen.getByText('ns=0;i=3')).toBeInTheDocument(); // ServerStatus
      expect(screen.getByText('ns=0;i=4')).toBeInTheDocument(); // Device
      expect(screen.getByText('ns=0;i=5')).toBeInTheDocument(); // Types
      expect(screen.getByText('ns=0;i=6')).toBeInTheDocument(); // BaseObjectType
    });
  });

  describe('Column Filtering', () => {
    it('should filter nodes by display name', async () => {
      const user = userEvent.setup();
      render(<NodeGrid nodesetData={mockNodeset} onNodeSelect={mockOnNodeSelect} />);
      
      const filterInputs = screen.getAllByPlaceholderText('Filter...');
      const displayNameFilter = filterInputs[0];
      
      await user.type(displayNameFilter, 'Server');
      
      await waitFor(() => {
        expect(screen.getByText('ns=0;i=2')).toBeInTheDocument(); // Server
        expect(screen.getByText('ns=0;i=3')).toBeInTheDocument(); // ServerStatus
        expect(screen.queryByText('ns=0;i=4')).not.toBeInTheDocument(); // Device should be filtered out
        expect(screen.queryByText('ns=0;i=5')).not.toBeInTheDocument(); // Types should be filtered out
      });
    });

    it('should filter nodes by node class using multi-select dropdown', async () => {
      const user = userEvent.setup();
      render(<NodeGrid nodesetData={mockNodeset} onNodeSelect={mockOnNodeSelect} />);
      
      // Find and click the Node Class filter button
      const buttons = screen.getAllByRole('button');
      const nodeClassButton = buttons.find(btn => btn.textContent?.includes('Filter...') && btn.className.includes('nodeclass'));
      expect(nodeClassButton).toBeInTheDocument();
      
      if (nodeClassButton) {
        await user.click(nodeClassButton);
        
        // Wait for dropdown to appear
        await waitFor(() => {
          expect(document.querySelector('.nodeclass-dropdown')).toBeInTheDocument();
        });
        
        // Find Variable checkbox within the dropdown
        const dropdown = document.querySelector('.nodeclass-dropdown');
        expect(dropdown).toBeInTheDocument();
        
        const variableCheckbox = Array.from(dropdown!.querySelectorAll('input[type="checkbox"]')).find((input) => {
          const label = input.closest('label');
          return label?.textContent?.includes('Variable');
        }) as HTMLInputElement;
        
        expect(variableCheckbox).toBeInTheDocument();
        await user.click(variableCheckbox);
        
        // Close dropdown
        await user.click(document.body);
        
        await waitFor(() => {
          expect(screen.getByText('ns=0;i=3')).toBeInTheDocument(); // ServerStatus (Variable)
          expect(screen.queryByText('ns=0;i=1')).not.toBeInTheDocument(); // Objects filtered out
        });
      }
    });

    it('should show number of selected filters in Node Class button', async () => {
      const user = userEvent.setup();
      render(<NodeGrid nodesetData={mockNodeset} onNodeSelect={mockOnNodeSelect} />);
      
      const buttons = screen.getAllByRole('button');
      const nodeClassButton = buttons.find(btn => btn.textContent?.includes('Filter...') && btn.className.includes('nodeclass'));
      
      if (nodeClassButton) {
        await user.click(nodeClassButton);
        
        await waitFor(() => {
          expect(document.querySelector('.nodeclass-dropdown')).toBeInTheDocument();
        });
        
        const dropdown = document.querySelector('.nodeclass-dropdown');
        const variableCheckbox = Array.from(dropdown!.querySelectorAll('input[type="checkbox"]')).find((input) => {
          const label = input.closest('label');
          return label?.textContent?.includes('Variable');
        }) as HTMLInputElement;
        
        await user.click(variableCheckbox);
        
        await waitFor(() => {
          expect(screen.getByText('1 selected')).toBeInTheDocument();
        });
      }
    });

    it('should show clear button when filter is active', async () => {
      const user = userEvent.setup();
      render(<NodeGrid nodesetData={mockNodeset} onNodeSelect={mockOnNodeSelect} />);
      
      const filterInputs = screen.getAllByPlaceholderText('Filter...');
      await user.type(filterInputs[0], 'Server');
      
      await waitFor(() => {
        const clearButtons = screen.getAllByTitle('Clear filter');
        expect(clearButtons.length).toBeGreaterThan(0);
      });
    });

    it('should clear individual column filter', async () => {
      const user = userEvent.setup();
      render(<NodeGrid nodesetData={mockNodeset} onNodeSelect={mockOnNodeSelect} />);
      
      const filterInputs = screen.getAllByPlaceholderText('Filter...');
      await user.type(filterInputs[0], 'Server');
      
      await waitFor(() => {
        expect(screen.queryByText('ns=0;i=4')).not.toBeInTheDocument(); // Device filtered out
      });
      
      const clearButton = screen.getByTitle('Clear filter');
      await user.click(clearButton);
      
      await waitFor(() => {
        expect(screen.getByText('ns=0;i=4')).toBeInTheDocument(); // Device back
      });
    });

    it('should clear all filters with Clear All Filters button', async () => {
      const user = userEvent.setup();
      render(<NodeGrid nodesetData={mockNodeset} onNodeSelect={mockOnNodeSelect} />);
      
      const filterInputs = screen.getAllByPlaceholderText('Filter...');
      await user.type(filterInputs[0], 'NonExistent');
      
      await waitFor(() => {
        expect(screen.getByText('No nodes found matching your filters')).toBeInTheDocument();
      });
      
      const clearAllButton = screen.getByText('Clear All Filters');
      await user.click(clearAllButton);
      
      await waitFor(() => {
        expect(screen.getByText('ns=0;i=1')).toBeInTheDocument(); // Objects back
      });
    });
  });

  describe('Column Sorting', () => {
    it('should sort by display name ascending by default', () => {
      render(<NodeGrid nodesetData={mockNodeset} onNodeSelect={mockOnNodeSelect} />);
      
      const rows = screen.getAllByRole('row');
      // First row is header, second is filter row, third is first data row
      const firstDataCell = rows[2].querySelector('.node-name');
      expect(firstDataCell?.textContent).toContain('BaseObjectType');
    });

    it('should toggle sort direction on column click', async () => {
      const user = userEvent.setup();
      render(<NodeGrid nodesetData={mockNodeset} onNodeSelect={mockOnNodeSelect} />);
      
      const displayNameHeader = screen.getByText('Display Name').closest('th');
      expect(displayNameHeader).toBeInTheDocument();
      
      // Click to toggle sort direction
      if (displayNameHeader) {
        await user.click(displayNameHeader);
        
        await waitFor(() => {
          const rows = screen.getAllByRole('row');
          const firstDataCell = rows[2].querySelector('.node-name');
          expect(firstDataCell?.textContent).toContain('Types');
        });
      }
    });

    it('should show sort indicator on sorted column', () => {
      render(<NodeGrid nodesetData={mockNodeset} onNodeSelect={mockOnNodeSelect} />);
      
      const sortIndicators = screen.getAllByText('▲');
      expect(sortIndicators.length).toBeGreaterThan(0);
    });
  });

  describe('Hierarchical View', () => {
    it('should toggle between flat and hierarchical view', async () => {
      const user = userEvent.setup();
      render(<NodeGrid nodesetData={mockNodeset} onNodeSelect={mockOnNodeSelect} />);
      
      const hierarchicalBtn = screen.getByText('Hierarchical View');
      await user.click(hierarchicalBtn);
      
      await waitFor(() => {
        expect(hierarchicalBtn).toHaveClass('active');
      });
      
      const flatBtn = screen.getByText('Flat View');
      await user.click(flatBtn);
      
      await waitFor(() => {
        expect(flatBtn).toHaveClass('active');
      });
    });

    it('should show expand/collapse controls in hierarchical view', async () => {
      const user = userEvent.setup();
      render(<NodeGrid nodesetData={mockNodeset} onNodeSelect={mockOnNodeSelect} />);
      
      const hierarchicalBtn = screen.getByText('Hierarchical View');
      await user.click(hierarchicalBtn);
      
      await waitFor(() => {
        expect(screen.getByText('▼ Expand All')).toBeInTheDocument();
        expect(screen.getByText('▶ Collapse All')).toBeInTheDocument();
      });
    });

    it('should collapse child nodes by default in hierarchical view', async () => {
      const user = userEvent.setup();
      render(<NodeGrid nodesetData={mockNodeset} onNodeSelect={mockOnNodeSelect} />);
      
      const hierarchicalBtn = screen.getByText('Hierarchical View');
      await user.click(hierarchicalBtn);
      
      await waitFor(() => {
        // Check that root nodes exist
        const rows = screen.getAllByRole('row');
        const hasObjects = rows.some(row => row.textContent?.includes('Objects'));
        expect(hasObjects).toBe(true);
        
        // Check that child nodes like 'Server' and 'Device' are NOT in the table
        const serverCells = screen.queryAllByText((_content, element) => {
          return element?.textContent === 'Server' && element?.tagName === 'TD';
        });
        expect(serverCells.length).toBe(0);
      });
    });

    it('should expand node when clicking expand icon', async () => {
      const user = userEvent.setup();
      render(<NodeGrid nodesetData={mockNodeset} onNodeSelect={mockOnNodeSelect} />);
      
      const hierarchicalBtn = screen.getByText('Hierarchical View');
      await user.click(hierarchicalBtn);
      
      await waitFor(() => {
        const expandIcons = screen.getAllByText('▶');
        expect(expandIcons.length).toBeGreaterThan(0);
      });
      
      const expandIcons = screen.getAllByText('▶');
      await user.click(expandIcons[0]);
      
      await waitFor(() => {
        // At least one child node should now be visible
        const rows = screen.getAllByRole('row');
        expect(rows.length).toBeGreaterThan(3); // header + filter + initial rows
      });
    });

    it('should expand all nodes when clicking Expand All', async () => {
      const user = userEvent.setup();
      render(<NodeGrid nodesetData={mockNodeset} onNodeSelect={mockOnNodeSelect} />);
      
      const hierarchicalBtn = screen.getByText('Hierarchical View');
      await user.click(hierarchicalBtn);
      
      const expandAllBtn = await screen.findByText('▼ Expand All');
      await user.click(expandAllBtn);
      
      // Wait for nodes to appear
      const server = await screen.findByText((_content, element) => {
        return element?.textContent === 'Server' && element?.tagName === 'TD';
      });
      expect(server).toBeInTheDocument();
    });

    it('should collapse all nodes when clicking Collapse All', async () => {
      const user = userEvent.setup();
      render(<NodeGrid nodesetData={mockNodeset} onNodeSelect={mockOnNodeSelect} />);
      
      const hierarchicalBtn = screen.getByText('Hierarchical View');
      await user.click(hierarchicalBtn);
      
      const expandAllBtn = await screen.findByText('▼ Expand All');
      await user.click(expandAllBtn);
      
      // Verify nodes are expanded
      await screen.findByText((_content, element) => {
        return element?.textContent === 'Server' && element?.tagName === 'TD';
      });
      
      const collapseAllBtn = screen.getByText('▶ Collapse All');
      await user.click(collapseAllBtn);
      
      await waitFor(() => {
        const serverCells = screen.queryAllByText((__content, element) => {
          return element?.textContent === 'Server' && element?.tagName === 'TD';
        });
        expect(serverCells.length).toBe(0);
      });
    });
  });

  describe('LocalStorage Persistence', () => {
    it('should persist column widths to localStorage', async () => {
      render(<NodeGrid nodesetData={mockNodeset} onNodeSelect={mockOnNodeSelect} />);
      
      await waitFor(() => {
        const storedWidths = localStorage.getItem('opcua-grid-column-widths');
        expect(storedWidths).toBeTruthy();
      });
    });

    it('should load column widths from localStorage on mount', () => {
      const customWidths = {
        displayName: 300,
        nodeClass: 150,
        nodeId: 200,
        browseName: 200,
        description: 400,
      };
      localStorage.setItem('opcua-grid-column-widths', JSON.stringify(customWidths));
      
      render(<NodeGrid nodesetData={mockNodeset} onNodeSelect={mockOnNodeSelect} />);
      
      const displayNameHeader = screen.getByText('Display Name').closest('th');
      expect(displayNameHeader).toHaveStyle({ width: '300px' });
    });

    it('should persist hierarchical view preference', async () => {
      const user = userEvent.setup();
      render(<NodeGrid nodesetData={mockNodeset} onNodeSelect={mockOnNodeSelect} />);
      
      const hierarchicalBtn = screen.getByText('Hierarchical View');
      await user.click(hierarchicalBtn);
      
      await waitFor(() => {
        const stored = localStorage.getItem('opcua-grid-hierarchical-view');
        expect(stored).toBe('true');
      });
    });

    it('should load hierarchical view preference on mount', () => {
      localStorage.setItem('opcua-grid-hierarchical-view', 'true');
      
      render(<NodeGrid nodesetData={mockNodeset} onNodeSelect={mockOnNodeSelect} />);
      
      const hierarchicalBtn = screen.getByText('Hierarchical View');
      expect(hierarchicalBtn).toHaveClass('active');
    });
  });

  describe('Node Selection', () => {
    it('should call onNodeSelect when clicking a row', async () => {
      const user = userEvent.setup();
      render(<NodeGrid nodesetData={mockNodeset} onNodeSelect={mockOnNodeSelect} />);
      
      const rows = screen.getAllByRole('row');
      const objectsRow = rows.find(row => row.textContent?.includes('ns=0;i=1'));
      expect(objectsRow).toBeInTheDocument();
      
      if (objectsRow) {
        await user.click(objectsRow);
        
        expect(mockOnNodeSelect).toHaveBeenCalled();
      }
    });

    it('should highlight selected row', () => {
      render(
        <NodeGrid 
          nodesetData={mockNodeset} 
          onNodeSelect={mockOnNodeSelect} 
          selectedNodeId="ns=0;i=1"
        />
      );
      
      const rows = screen.getAllByRole('row');
      const objectsRow = rows.find(row => row.textContent?.includes('ns=0;i=1'));
      expect(objectsRow).toHaveClass('selected');
    });
  });

  describe('Column Resizing', () => {
    it('should render resize handles on columns', () => {
      render(<NodeGrid nodesetData={mockNodeset} onNodeSelect={mockOnNodeSelect} />);
      
      const resizeHandles = document.querySelectorAll('.resize-handle');
      expect(resizeHandles.length).toBe(5); // One for each column
    });

    it('should have resizable class on columns', () => {
      render(<NodeGrid nodesetData={mockNodeset} onNodeSelect={mockOnNodeSelect} />);
      
      const headers = screen.getAllByRole('columnheader');
      const resizableHeaders = Array.from(headers).filter(header => 
        header.classList.contains('resizable')
      );
      
      expect(resizableHeaders.length).toBe(5);
    });

    it('should have Reset Column Widths button', () => {
      render(<NodeGrid nodesetData={mockNodeset} onNodeSelect={mockOnNodeSelect} />);
      
      expect(screen.getByText('↔ Reset Column Widths')).toBeInTheDocument();
    });

    it('should reset column widths when clicking Reset button', async () => {
      const user = userEvent.setup();
      
      // Set custom widths first
      const customWidths = {
        displayName: 500,
        nodeClass: 200,
        nodeId: 300,
        browseName: 300,
        description: 600,
      };
      localStorage.setItem('opcua-grid-column-widths', JSON.stringify(customWidths));
      
      render(<NodeGrid nodesetData={mockNodeset} onNodeSelect={mockOnNodeSelect} />);
      
      const displayNameHeader = screen.getByText('Display Name').closest('th');
      expect(displayNameHeader).toHaveStyle({ width: '500px' });
      
      const resetButton = screen.getByText('↔ Reset Column Widths');
      await user.click(resetButton);
      
      await waitFor(() => {
        const updatedHeader = screen.getByText('Display Name').closest('th');
        expect(updatedHeader).toHaveStyle({ width: '200px' }); // Default width
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no nodes match filters', async () => {
      const user = userEvent.setup();
      render(<NodeGrid nodesetData={mockNodeset} onNodeSelect={mockOnNodeSelect} />);
      
      const filterInputs = screen.getAllByPlaceholderText('Filter...');
      await user.type(filterInputs[0], 'NonExistentNode');
      
      await waitFor(() => {
        expect(screen.getByText('No nodes found matching your filters')).toBeInTheDocument();
      });
    });

    it('should show Clear All Filters button in empty state', async () => {
      const user = userEvent.setup();
      render(<NodeGrid nodesetData={mockNodeset} onNodeSelect={mockOnNodeSelect} />);
      
      const filterInputs = screen.getAllByPlaceholderText('Filter...');
      await user.type(filterInputs[0], 'NonExistent');
      
      await waitFor(() => {
        expect(screen.getByText('Clear All Filters')).toBeInTheDocument();
      });
    });
  });
});
