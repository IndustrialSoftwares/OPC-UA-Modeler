import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

// Tests for the top-level `App` component.
// Purpose: verify the header renders, the upload control is present,
// and the import dialog opens when the upload button is clicked.

// Mock Siemens IX components used by `App` to avoid pulling in the full UI
// library during tests. Each mock returns a simple DOM element that
// preserves the important contract used by `App` (props and children).
vi.mock('@siemens/ix-react', () => ({
  // Application shell wrapper
  IxApplication: (props: React.PropsWithChildren<unknown>) => <div>{props.children}</div>,
  // Header component: exposes `name` prop and child header controls
  IxApplicationHeader: (props: { name?: React.ReactNode; children?: React.ReactNode }) => (
    <header>{props.name}{props.children}</header>
  ),
  // Icon button: forward onClick and render children so tests can click it
  IxIconButton: (props: { onClick?: () => void; children?: React.ReactNode }) => (
    <button onClick={props.onClick}>{props.children}</button>
  ),
}));

// Mock icon module used by the header. We don't need the actual icon
// implementation; a placeholder value is sufficient for tests.
vi.mock('@siemens/ix-icons/icons', () => ({
  iconCloudUploadFilled: 'iconCloudUploadFilled',
}));

// Mock child components used by `App`.
// - `FileImport` is mocked with a forwarded ref signature so the
//   component shape matches the real implementation. It exposes a
//   `data-testid="file-import"` element and reflects the
//   `isDialogOpen` prop via a `data-open` attribute so tests can
//   assert dialog open/close state without rendering the full dialog.
vi.mock('./components/FileImport/FileImport', () => {
  return {
    __esModule: true,
    default: React.forwardRef<HTMLDivElement, { isDialogOpen?: boolean }>((props, ref) => {
      void ref;
      return <div data-testid="file-import" data-open={props.isDialogOpen ? 'true' : 'false'} />;
    }),
  };
});

// Stub `NodeTree` — `App` only needs to render it conditionally, so a
// simple placeholder is sufficient for these high-level tests.
vi.mock('./components/NodeTree/NodeTree', () => ({
  __esModule: true,
  default: () => <div data-testid="node-tree" />,
}));

// Stub `DetailPanel` similarly — a lightweight placeholder keeps tests
// focused on `App` behaviour rather than child implementation details.
vi.mock('./components/DetailPanel/DetailPanel', () => ({
  __esModule: true,
  default: () => <div data-testid="detail-panel" />,
}));

describe('App component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders header and Upload button', () => {
    // Smoke test: ensure top-level header text and the Upload button are present
    render(<App />);
    expect(screen.getByText('OPC UA Modeler')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Upload/i })).toBeTruthy();
  });

  it('shows empty workspace text when no nodeset loaded', () => {
    // With no nodeset provided, App should render the empty-workspace message
    render(<App />);
    expect(screen.getByText('No nodeset loaded yet.')).toBeTruthy();
  });

  it('opens import dialog when Upload button is clicked', () => {
    // Clicking the Upload button should set `isDialogOpen` on the mocked
    // `FileImport` component. We assert this by reading the
    // `data-open` attribute rendered by the mock.
    render(<App />);
    const btn = screen.getByRole('button', { name: /Upload/i });
    fireEvent.click(btn);
    const fi = screen.getByTestId('file-import');
    expect(fi.getAttribute('data-open')).toBe('true');
  });
});