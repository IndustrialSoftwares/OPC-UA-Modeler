import React, { useEffect, useRef } from 'react';
import { DataSet, Network } from 'vis-network/standalone';
import 'vis-network/styles/vis-network.css';
import './NodeGraph.css';

// Define interfaces based on the technical details
interface Node {
  nodeId: string;
  displayName: { text: string };
  // Add other properties as needed from your data model
}

interface Reference {
  sourceNode: string;
  targetNode: string;
  referenceType: string;
}

interface ParsedNodeset {
  id: string;
  nodes: Node[];
  references: Reference[];
}

interface NodeGraphProps {
  activeNodeset: ParsedNodeset;
  selectedNodeId?: string;
  onNodeSelect: (nodeId: string) => void;
}

const NodeGraph: React.FC<NodeGraphProps> = ({ activeNodeset, selectedNodeId, onNodeSelect }) => {
  const graphRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  useEffect(() => {
    if (graphRef.current && activeNodeset) {
      const nodes = new DataSet(
        activeNodeset.nodes.map((node) => ({
          id: node.nodeId,
          label: node.displayName.text,
        }))
      );

      const edges = new DataSet(
        activeNodeset.references.map((ref, index) => ({
          id: `${ref.sourceNode}-${ref.targetNode}-${index}`,
          from: ref.sourceNode,
          to: ref.targetNode,
          label: ref.referenceType,
        }))
      );

      const data = { nodes, edges };
      const options = {
        layout: {
          hierarchical: false,
        },
        edges: {
          arrows: 'to',
        },
        interaction: {
          dragNodes: true,
          dragView: true,
          zoomView: true,
        },
      };

      const network = new Network(graphRef.current, data, options);
      network.on('selectNode', (params: { nodes: Array<string | number> }) => {
        if (params.nodes.length > 0) {
          onNodeSelect(String(params.nodes[0]));
        }
      });
      networkRef.current = network;
    }

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [activeNodeset, onNodeSelect]);

  useEffect(() => {
    if (networkRef.current && selectedNodeId) {
      networkRef.current.selectNodes([selectedNodeId]);
    }
  }, [selectedNodeId]);

  return <div ref={graphRef} className="node-graph" />;
};

export default NodeGraph;
