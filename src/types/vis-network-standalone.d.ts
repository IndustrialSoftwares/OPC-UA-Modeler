declare module 'vis-network/standalone' {
  export class DataSet<T = unknown> {
    constructor(data?: T[]);
    add(data: T | T[]): void;
    update(data: T | T[]): void;
    remove(id: string | number | string[] | number[]): void;
    get(id?: string | number | string[] | number[]): T | T[] | null;
  }

  export interface NetworkOptions {
    nodes?: Record<string, unknown>;
    edges?: Record<string, unknown>;
    layout?: Record<string, unknown>;
    physics?: Record<string, unknown>;
    interaction?: Record<string, unknown>;
    manipulation?: Record<string, unknown>;
  }

  export interface NetworkData {
    nodes: DataSet<{ id: string; label: string; [key: string]: unknown }>;
    edges: DataSet<{ id: string; from: string; to: string; label?: string; [key: string]: unknown }>;
  }

  export interface NetworkEvents {
    selectNode: { nodes: Array<string | number>; edges: Array<string | number> };
    deselectNode: { nodes: Array<string | number>; edges: Array<string | number>; previousSelection: { nodes: Array<string | number>; edges: Array<string | number> } };
    click: { nodes: Array<string | number>; edges: Array<string | number>; pointer: { DOM: { x: number; y: number }; canvas: { x: number; y: number } } };
    [key: string]: unknown;
  }

  export class Network {
    constructor(container: HTMLElement, data: NetworkData, options?: NetworkOptions);
    on<K extends keyof NetworkEvents>(eventName: K, callback: (params: NetworkEvents[K]) => void): void;
    on(eventName: string, callback: (params: unknown) => void): void;
    selectNodes(nodeIds: string[]): void;
    destroy(): void;
  }
}
