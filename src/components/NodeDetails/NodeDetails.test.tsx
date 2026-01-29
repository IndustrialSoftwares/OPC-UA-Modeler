import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import NodeDetails from './NodeDetails';
import { OpcUaNode } from '@/types';

describe('NodeDetails component', () => {
  it('shows empty state when node is null', () => {
    render(<NodeDetails node={null} />);
    expect(screen.getByText('Node Details')).toBeDefined();
    expect(screen.getByText('Select a node to view its details.')).toBeDefined();
  });

  it('renders node properties and falls back for missing values', () => {
    const node = {
      nodeId: 'ns=1;i=100',
      displayName: 'Test Node',
      browseName: 'TestNode',
      nodeClass: 'Variable',
      // leave optional fields undefined to exercise fallbacks
      dataType: undefined,
      valueRank: undefined,
      typeDefinition: undefined,
      derivedFrom: undefined,
      description: undefined,
      references: [],
    } as unknown as OpcUaNode;

    render(<NodeDetails node={node} />);

    expect(screen.getByText('Test Node')).toBeDefined();
    expect(screen.getByText('TestNode')).toBeDefined();
    expect(screen.getByText('ns=1;i=100')).toBeDefined();
    expect(screen.getByText('Variable')).toBeDefined();

    // fallbacks render as '-'
    expect(screen.getAllByText('-').length).toBeGreaterThanOrEqual(1);
    // When there are no references, the muted message is shown
    expect(screen.getByText('No references available.')).toBeDefined();
  });

  it('renders numeric valueRank when present', () => {
    const node = {
      nodeId: 'ns=1;i=101',
      displayName: 'VR Node',
      browseName: 'VRNode',
      nodeClass: 'Variable',
      valueRank: -1,
      references: [],
    } as unknown as OpcUaNode;

    render(<NodeDetails node={node} />);
    expect(screen.getByText('-1')).toBeDefined();
  });

  it('renders valueRank 0 when provided', () => {
    const node = {
      nodeId: 'ns=1;i=102',
      displayName: 'ZeroVR Node',
      browseName: 'ZeroVRNode',
      nodeClass: 'Variable',
      valueRank: 0,
      references: [],
    } as unknown as OpcUaNode;

    render(<NodeDetails node={node} />);
    expect(screen.getByText('0')).toBeDefined();
  });

  it('lists references and shows direction arrows', () => {
    const node = {
      nodeId: 'ns=1;i=110',
      displayName: 'RefNode',
      browseName: 'RefNode',
      nodeClass: 'Object',
      references: [
        { referenceType: 'HasComponent', isForward: true, targetNodeId: 'ns=1;i=111' },
        { referenceType: 'HasProperty', isForward: false, targetNodeId: 'ns=1;i=112' },
      ],
    } as unknown as OpcUaNode;

    render(<NodeDetails node={node} />);

    // reference target ids present
    expect(screen.getByText('ns=1;i=111')).toBeDefined();
    expect(screen.getByText('ns=1;i=112')).toBeDefined();

    // arrows indicating direction
    expect(screen.getByText('→')).toBeDefined();
    expect(screen.getByText('←')).toBeDefined();
  });

  it('renders dataType when provided', () => {
    const node = {
      nodeId: 'ns=1;i=200',
      displayName: 'DT Node',
      browseName: 'DTNode',
      nodeClass: 'Variable',
      dataType: 'String',
      references: [],
    } as unknown as OpcUaNode;

    render(<NodeDetails node={node} />);
    expect(screen.getByText('String')).toBeDefined();
  });

  it('renders typeDefinition, derivedFrom and description when provided', () => {
    const node = {
      nodeId: 'ns=1;i=300',
      displayName: 'Full Node',
      browseName: 'FullNode',
      nodeClass: 'ObjectType',
      typeDefinition: 'ns=1;i=301',
      derivedFrom: 'ns=1;i=302',
      description: 'This is a detailed description',
      references: [],
    } as unknown as OpcUaNode;

    render(<NodeDetails node={node} />);

    expect(screen.getByText('ns=1;i=301')).toBeDefined();
    expect(screen.getByText('ns=1;i=302')).toBeDefined();
    expect(screen.getByText('This is a detailed description')).toBeDefined();
  });

  it('renders all field labels', () => {
    const node = {
      nodeId: 'ns=1;i=400',
      displayName: 'LabelNode',
      browseName: 'LabelNode',
      nodeClass: 'Object',
      dataType: 'Int32',
      valueRank: 1,
      typeDefinition: 'ns=1;i=401',
      derivedFrom: 'ns=1;i=402',
      description: 'Label description',
      references: [],
    } as unknown as OpcUaNode;

    render(<NodeDetails node={node} />);

    // Assert presence of all labels used in the component
    expect(screen.getByText('Display Name')).toBeDefined();
    expect(screen.getByText('Browse Name')).toBeDefined();
    expect(screen.getByText('NodeId')).toBeDefined();
    expect(screen.getByText('Class')).toBeDefined();
    expect(screen.getByText('Data Type')).toBeDefined();
    expect(screen.getByText('Value Rank')).toBeDefined();
    expect(screen.getByText('Type Definition')).toBeDefined();
    expect(screen.getByText('Derived From')).toBeDefined();
    expect(screen.getByText('Description')).toBeDefined();
  });

  it('renders multiple references in correct order and length', () => {
    const node = {
      nodeId: 'ns=1;i=500',
      displayName: 'MultiRefNode',
      browseName: 'MultiRefNode',
      nodeClass: 'Object',
      references: [
        { referenceType: 'RefA', isForward: true, targetNodeId: 'ns=1;i=501' },
        { referenceType: 'RefB', isForward: true, targetNodeId: 'ns=1;i=502' },
        { referenceType: 'RefC', isForward: false, targetNodeId: 'ns=1;i=503' },
      ],
    } as unknown as OpcUaNode;

    render(<NodeDetails node={node} />);

    const items = screen.getAllByRole('listitem');
    expect(items.length).toBe(3);
    expect(items[0].textContent).toContain('ns=1;i=501');
    expect(items[1].textContent).toContain('ns=1;i=502');
    expect(items[2].textContent).toContain('ns=1;i=503');
  });

  it("falls back to '-' for empty-string fields", () => {
    const node = {
      nodeId: 'ns=1;i=600',
      displayName: '',
      browseName: '',
      nodeClass: 'Variable',
      dataType: '',
      valueRank: undefined,
      typeDefinition: '',
      derivedFrom: '',
      description: '',
      references: [],
    } as unknown as OpcUaNode;

    render(<NodeDetails node={node} />);

    const labelToValue = (label: string) => {
      const labelEl = screen.getByText(label);
      const parent = labelEl.parentElement as HTMLElement;
      const spans = parent.querySelectorAll('span');
      return spans[1]?.textContent?.trim();
    };

    expect(labelToValue('Display Name')).toBe('-');
    expect(labelToValue('Browse Name')).toBe('-');
    expect(labelToValue('Data Type')).toBe('-');
    expect(labelToValue('Type Definition')).toBe('-');
    expect(labelToValue('Derived From')).toBe('-');
    expect(labelToValue('Description')).toBe('-');
  });
});
