import { OpcUaNode } from '@/types/opcua.types';
import './NodeDetails.css';

interface NodeDetailsProps {
  node: OpcUaNode | null;
}

function NodeDetails({ node }: NodeDetailsProps) {
  if (!node) {
    return (
      <div className="node-details empty">
        <h3>Node Details</h3>
        <p>Select a node to view its details.</p>
      </div>
    );
  }

  return (
    <div className="node-details">
      <h3>Node Details</h3>
      <div className="details-grid">
        <div>
          <span className="label">Display Name</span>
          <span>{node.displayName || '-'}</span>
        </div>
        <div>
          <span className="label">Browse Name</span>
          <span>{node.browseName || '-'}</span>
        </div>
        <div>
          <span className="label">NodeId</span>
          <span>{node.nodeId}</span>
        </div>
        <div>
          <span className="label">Class</span>
          <span>{node.nodeClass}</span>
        </div>
        <div>
          <span className="label">Data Type</span>
          <span>{node.dataType || '-'}</span>
        </div>
        <div>
          <span className="label">Value Rank</span>
          <span>{node.valueRank ?? '-'}</span>
        </div>
        <div>
          <span className="label">Type Definition</span>
          <span>{node.typeDefinition || '-'}</span>
        </div>
        <div>
          <span className="label">Derived From</span>
          <span>{node.derivedFrom || '-'}</span>
        </div>
        <div className="full">
          <span className="label">Description</span>
          <span>{node.description || '-'}</span>
        </div>
      </div>

      <div className="references">
        <h4>References</h4>
        {node.references.length === 0 ? (
          <p className="muted">No references available.</p>
        ) : (
          <ul>
            {node.references.map((ref, idx) => (
              <li key={`${ref.referenceType}-${idx}`}>
                <span>{ref.referenceType}</span>
                <span className="muted">{ref.isForward ? '→' : '←'}</span>
                <span>{ref.targetNodeId}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default NodeDetails;
