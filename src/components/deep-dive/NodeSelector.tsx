'use client';

import { useState, useMemo, useCallback } from 'react';

export interface NodeInfo {
  nodeId: string;
  nodeName: string;
}

export interface NodeSelectorProps {
  isOpen: boolean;
  nodes: NodeInfo[];
  excludeNodeIds: string[];
  onSelect: (nodeId: string) => void;
  onClose: () => void;
}

export function NodeSelector({
  isOpen,
  nodes,
  excludeNodeIds,
  onSelect,
  onClose,
}: NodeSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNodes = useMemo(() => {
    const excluded = new Set(excludeNodeIds);
    const term = searchTerm.toLowerCase().trim();

    return nodes.filter((node) => {
      if (excluded.has(node.nodeId)) return false;
      if (!term) return true;
      return (
        node.nodeName.toLowerCase().includes(term) ||
        node.nodeId.toLowerCase().includes(term)
      );
    });
  }, [nodes, excludeNodeIds, searchTerm]);

  const handleSelect = useCallback(
    (nodeId: string) => {
      onSelect(nodeId);
      onClose();
    },
    [onSelect, onClose]
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div
      data-testid="node-selector-backdrop"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        data-testid="node-selector"
        style={{
          background: 'var(--bb-black, #0a0a0f)',
          border: '2px solid var(--bb-border)',
          borderRadius: '4px',
          width: '400px',
          maxHeight: '500px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid var(--bb-border)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--bb-amber)',
              fontWeight: 'bold',
            }}
          >
            SELECT NODE TO COMPARE
          </span>
          <button
            onClick={onClose}
            aria-label="close"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--bb-gray)',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '0 4px',
            }}
          >
            ×
          </button>
        </div>

        {/* Search input */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--bb-border)' }}>
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              background: 'var(--bb-panel, #1a1a1f)',
              border: '1px solid var(--bb-border)',
              borderRadius: '2px',
              padding: '8px 12px',
              color: 'var(--bb-text)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              outline: 'none',
            }}
          />
        </div>

        {/* Node list */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            maxHeight: '350px',
          }}
        >
          {filteredNodes.length === 0 ? (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                color: 'var(--bb-gray)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
              }}
            >
              No nodes found
            </div>
          ) : (
            filteredNodes.map((node) => (
              <div
                key={node.nodeId}
                onClick={() => handleSelect(node.nodeId)}
                style={{
                  padding: '10px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--bb-border)',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bb-panel, #1a1a1f)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: 'var(--bb-cyan)',
                    fontWeight: 'bold',
                  }}
                >
                  {node.nodeName}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9px',
                    color: 'var(--bb-gray)',
                    marginTop: '2px',
                    opacity: 0.7,
                  }}
                >
                  {node.nodeId}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
