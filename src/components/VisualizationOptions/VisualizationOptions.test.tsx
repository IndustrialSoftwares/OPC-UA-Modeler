import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import VisualizationOptions from './VisualizationOptions';

/**
 * Unit tests for `VisualizationOptions`.
 *
 * These tests focus on the small presentational behavior:
 * - rendering the nodeset selector and options
 * - showing a compact active-nodeset summary
 * - invoking callbacks when the user changes selection or view mode
 */
describe('VisualizationOptions', () => {
  // Two simple nodeset fixtures: one has a namespace, the other none.
  // `prefix` is required to match the production `ParsedNodeset` shape.
  type TestNodeset = { id: string; name: string; namespaces: Array<{ index: number; uri: string; prefix: string }>; nodeCount: number };
  // Two simple nodeset fixtures: one has a namespace, the other none.
  const nodesets: TestNodeset[] = [
    { id: 'n1', name: 'Nodeset A', namespaces: [{ index: 0, uri: 'urn:a', prefix: 'a' }], nodeCount: 5 },
    { id: 'n2', name: 'Nodeset B', namespaces: [], nodeCount: 2 },
  ];

  it('renders selector and active nodeset info', () => {
    // Render the component with nodeset 'n1' active and assert the UI shows
    // the select and the inline summary for that nodeset.
    const onNodesetSwitch = vi.fn();
    const onViewModeChange = vi.fn();

    render(
      <VisualizationOptions
        nodesetList={nodesets}
        activeNodesetId="n1"
        onNodesetSwitch={onNodesetSwitch}
        onNodeSelect={() => {}}
        viewMode="tree"
        onViewModeChange={onViewModeChange}
      />
    );

    const select = screen.getByLabelText(/Active Nodeset/i) as HTMLSelectElement;
    expect(select).toBeTruthy();
    expect(screen.getByRole('option', { name: /Nodeset A/i })).toBeTruthy();
    expect(screen.getByRole('option', { name: /Nodeset B/i })).toBeTruthy();

    // The inline summary uses the nodeCount and namespace length values
    expect(screen.getByText(/\(5 nodes, 1 NS\)/)).toBeTruthy();
  });

  it('calls onNodesetSwitch when selection changes', () => {
    // Ensure the parent callback is invoked with the new nodeset id
    const onNodesetSwitch = vi.fn();
    const onViewModeChange = vi.fn();

    render(
      <VisualizationOptions
        nodesetList={nodesets}
        activeNodesetId="n1"
        onNodesetSwitch={onNodesetSwitch}
        onNodeSelect={() => {}}
        viewMode="tree"
        onViewModeChange={onViewModeChange}
      />
    );

    const select = screen.getByLabelText(/Active Nodeset/i);
    fireEvent.change(select, { target: { value: 'n2' } });

    expect(onNodesetSwitch).toHaveBeenCalledWith('n2');
  });

  it('renders view mode buttons and calls onViewModeChange', () => {
    // Verify the Tree/Graph buttons render and clicking Graph calls handler
    const onNodesetSwitch = vi.fn();
    const onViewModeChange = vi.fn();

    const { rerender } = render(
      <VisualizationOptions
        nodesetList={nodesets}
        activeNodesetId="n1"
        onNodesetSwitch={onNodesetSwitch}
        onNodeSelect={() => {}}
        viewMode="tree"
        onViewModeChange={onViewModeChange}
      />
    );

    const treeBtn = screen.getByText(/Tree/i);
    const graphBtn = screen.getByText(/Graph/i);

    expect(treeBtn.className.includes('active')).toBe(true);

    fireEvent.click(graphBtn);
    expect(onViewModeChange).toHaveBeenCalledWith('graph');

    // Rerender with graph active to ensure active class toggles correctly
    rerender(
      <VisualizationOptions
        nodesetList={nodesets}
        activeNodesetId="n1"
        onNodesetSwitch={onNodesetSwitch}
        onNodeSelect={() => {}}
        viewMode="graph"
        onViewModeChange={onViewModeChange}
      />
    );

    expect(graphBtn.className.includes('active')).toBe(true);
  });

  it("select's value reflects activeNodesetId (controlled select)", () => {
    // The select is controlled by `activeNodesetId` and should reflect it
    const onNodesetSwitch = vi.fn();
    const onViewModeChange = vi.fn();

    render(
      <VisualizationOptions
        nodesetList={nodesets}
        activeNodesetId="n2"
        onNodesetSwitch={onNodesetSwitch}
        onNodeSelect={() => {}}
        viewMode="tree"
        onViewModeChange={onViewModeChange}
      />
    );

    const select = screen.getByLabelText(/Active Nodeset/i) as HTMLSelectElement;
    expect(select.value).toBe('n2');
  });

  it('does not render nodeset info when activeNodesetId is not found', () => {
    // When active id doesn't match any nodeset the info badge should be hidden
    const onNodesetSwitch = vi.fn();
    const onViewModeChange = vi.fn();

    render(
      <VisualizationOptions
        nodesetList={nodesets}
        activeNodesetId="missing"
        onNodesetSwitch={onNodesetSwitch}
        onNodeSelect={() => {}}
        viewMode="tree"
        onViewModeChange={onViewModeChange}
      />
    );

    // nodeset-info span should not be present
    expect(screen.queryByText(/\(\d+ nodes, \d+ NS\)/)).toBeNull();
  });

  it('handles empty nodesetList gracefully (no options)', () => {
    // When no nodesets are available the select should have zero options
    const onNodesetSwitch = vi.fn();
    const onViewModeChange = vi.fn();

    render(
      <VisualizationOptions
        nodesetList={[] as TestNodeset[]}
        activeNodesetId={''}
        onNodesetSwitch={onNodesetSwitch}
        onNodeSelect={() => {}}
        viewMode="tree"
        onViewModeChange={onViewModeChange}
      />
    );

    const select = screen.getByLabelText(/Active Nodeset/i);
    const options = Array.from((select as HTMLSelectElement).options);
    expect(options.length).toBe(0);
  });

  it('clicking Tree button calls onViewModeChange with "tree"', () => {
    // Clicking the Tree button should notify the parent to switch view mode
    const onNodesetSwitch = vi.fn();
    const onViewModeChange = vi.fn();

    render(
      <VisualizationOptions
        nodesetList={nodesets}
        activeNodesetId="n1"
        onNodesetSwitch={onNodesetSwitch}
        onNodeSelect={() => {}}
        viewMode="graph"
        onViewModeChange={onViewModeChange}
      />
    );

    const treeBtn = screen.getByText(/Tree/i);
    fireEvent.click(treeBtn);
    expect(onViewModeChange).toHaveBeenCalledWith('tree');
  });

  it('shows (N nodes, 0 NS) when active nodeset has zero namespaces', () => {
    // The inline summary should reflect zero namespaces for nodeset 'n2'
    const onNodesetSwitch = vi.fn();
    const onViewModeChange = vi.fn();

    render(
      <VisualizationOptions
        nodesetList={nodesets}
        activeNodesetId="n2"
        onNodesetSwitch={onNodesetSwitch}
        onNodeSelect={() => {}}
        viewMode="tree"
        onViewModeChange={onViewModeChange}
      />
    );

    expect(screen.getByText(/\(2 nodes, 0 NS\)/)).toBeTruthy();
  });

  it('option elements have value attributes matching nodeset ids', () => {
    // Ensure option `value` attributes are the nodeset ids
    const onNodesetSwitch = vi.fn();
    const onViewModeChange = vi.fn();

    render(
      <VisualizationOptions
        nodesetList={nodesets}
        activeNodesetId="n1"
        onNodesetSwitch={onNodesetSwitch}
        onNodeSelect={() => {}}
        viewMode="tree"
        onViewModeChange={onViewModeChange}
      />
    );

    const opts = screen.getAllByRole('option') as HTMLOptionElement[];
    expect(opts.length).toBe(nodesets.length);
    expect(opts[0].value).toBe('n1');
    expect(opts[1].value).toBe('n2');
  });
});
