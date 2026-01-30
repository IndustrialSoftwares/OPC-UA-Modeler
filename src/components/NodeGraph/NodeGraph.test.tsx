import { render, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import NodeGraph from './NodeGraph';

// Local test-only types matching NodeGraph's expected shape
interface NodeTest {
  nodeId: string;
  displayName: { text: string };
}

interface ReferenceTest {
  sourceNode: string;
  targetNode: string;
  referenceType: string;
}

interface ParsedNodesetTest {
  id: string;
  nodes: NodeTest[];
  references: ReferenceTest[];
}

// Mock vis-network/standalone to avoid rendering canvas and complex layout.
vi.mock('vis-network/standalone', () => {
  const visMock = {
    networkInstances: [] as unknown[],
    nodesArg: undefined as unknown,
    edgesArg: undefined as unknown,
    _lastInstance: undefined as unknown,
  } as {
    networkInstances: unknown[];
    nodesArg?: unknown;
    edgesArg?: unknown;
    _lastInstance?: unknown;
  };

  class DataSet {
    items: unknown;
    constructor(items: unknown) {
      this.items = items;
      // classify by presence of 'from' to determine edges vs nodes
      if (Array.isArray(items) && items.length > 0 && Object.prototype.hasOwnProperty.call(items[0] as Record<string, unknown>, 'from')) {
        visMock.edgesArg = items;
      } else {
        visMock.nodesArg = items;
      }
    }
  }

  class Network {
    el: HTMLElement | null;
    data: unknown;
    options: unknown;
    handlers: Record<string, (params: unknown) => void> = {};
    destroyed = false;
    selectCalls: Array<Array<string | number>> = [];
    constructor(el: HTMLElement, data: unknown, options: unknown) {
      this.el = el;
      this.data = data;
      this.options = options;
      visMock.networkInstances.push(this as unknown);
      visMock._lastInstance = this as unknown;
    }
    on(event: string, cb: (params: unknown) => void) {
      this.handlers[event] = cb;
    }
    // helper used by tests to simulate a selectNode event
    triggerSelectNode(nodeId: string | number) {
      const h = this.handlers['selectNode'];
      if (h) h({ nodes: [nodeId] } as unknown);
    }
    selectNodes(ids: Array<string | number>) {
      this.selectCalls.push(ids);
    }
    destroy() {
      this.destroyed = true;
    }
  }

  (globalThis as unknown as Record<string, unknown>)['__visMock'] = visMock;
  return { DataSet, Network, __esModule: true };
});

describe('NodeGraph', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // reset mock capture
    const m = (globalThis as unknown as { __visMock?: { networkInstances?: unknown[]; nodesArg?: unknown; edgesArg?: unknown; _lastInstance?: unknown } }).__visMock;
    if (m) {
      m.networkInstances = [];
      m.nodesArg = undefined;
      m.edgesArg = undefined;
      m._lastInstance = undefined;
    }
  });

  afterEach(() => {
    cleanup();
  });

  it('constructs DataSet with mapped nodes and edges', () => {
    const activeNodeset = {
      id: '1',
      nodes: [
        { nodeId: 'n1', displayName: { text: 'Node One' } },
        { nodeId: 'n2', displayName: { text: 'Node Two' } },
      ],
      references: [
        { sourceNode: 'n1', targetNode: 'n2', referenceType: 'HasComponent' },
      ],
    } as ParsedNodesetTest;
    render(<NodeGraph activeNodeset={activeNodeset} onNodeSelect={() => {}} />);

    const vis = (globalThis as unknown as Record<string, unknown>)['__visMock'] as {
      nodesArg?: unknown;
      edgesArg?: Array<Record<string, unknown>>;
      _lastInstance?: unknown;
    };
    expect(vis.nodesArg).toEqual([
      { id: 'n1', label: 'Node One' },
      { id: 'n2', label: 'Node Two' },
    ]);

    expect(vis.edgesArg).toHaveLength(1);
    const edges = vis.edgesArg!;
    expect(edges[0].from).toBe('n1');
    expect(edges[0].to).toBe('n2');
    expect(edges[0].label).toBe('HasComponent');
  });

  it('calls onNodeSelect when network emits selectNode', () => {
    const activeNodeset = {
      id: '1',
      nodes: [{ nodeId: 'n1', displayName: { text: 'N1' } }],
      references: [],
    } as ParsedNodesetTest;

    const onNodeSelect = vi.fn();
    render(<NodeGraph activeNodeset={activeNodeset} onNodeSelect={onNodeSelect} />);

    const vis = (globalThis as unknown as Record<string, unknown>)['__visMock'] as {
      _lastInstance?: {
        triggerSelectNode?: (id: string | number) => void;
      };
    };
    const instance = vis._lastInstance;
    expect(instance).toBeTruthy();

    act(() => {
      const instWithTrigger = instance as { triggerSelectNode?: (id: string | number) => void } | undefined;
      instWithTrigger?.triggerSelectNode?.('n1');
    });

    expect(onNodeSelect).toHaveBeenCalledWith('n1');
  });

  it('calls network.selectNodes when selectedNodeId prop changes', () => {
    const activeNodeset = {
      id: '1',
      nodes: [{ nodeId: 'a', displayName: { text: 'A' } }],
      references: [],
    } as ParsedNodesetTest;

    const onNodeSelect = vi.fn();
    const { rerender } = render(
      <NodeGraph activeNodeset={activeNodeset} onNodeSelect={onNodeSelect} />
    );

    const vis = (globalThis as unknown as Record<string, unknown>)['__visMock'] as {
      _lastInstance?: { selectCalls?: Array<Array<string | number>> };
    };
    const instance = vis._lastInstance as { selectCalls?: Array<Array<string | number>> } | undefined;
    expect(instance?.selectCalls ?? []).toHaveLength(0);

    act(() => {
      rerender(
        <NodeGraph activeNodeset={activeNodeset} selectedNodeId={'a'} onNodeSelect={onNodeSelect} />
      );
    });

    // after rerender the mock should have recorded selectNodes call
    expect(instance).toBeTruthy();
    const inst = instance as { selectCalls: Array<Array<string | number>> };
    expect(inst.selectCalls.length).toBeGreaterThanOrEqual(1);
    expect(inst.selectCalls[inst.selectCalls.length - 1]).toEqual(['a']);
  });

  it('destroys network on unmount', () => {
    const activeNodeset = {
      id: '1',
      nodes: [{ nodeId: 'x', displayName: { text: 'X' } }],
      references: [],
    } as ParsedNodesetTest;

    const { unmount } = render(
      <NodeGraph activeNodeset={activeNodeset} onNodeSelect={() => {}} />
    );

    const vis = (globalThis as unknown as Record<string, unknown>)['__visMock'] as {
      _lastInstance?: { destroyed?: boolean };
    };
    const instance = vis._lastInstance;
    expect(instance).toBeTruthy();

    unmount();

    const inst2 = instance as { destroyed?: boolean };
    expect(inst2.destroyed).toBe(true);
  });
});
