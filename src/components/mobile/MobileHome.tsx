'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/hooks/useAppStore';
import { useNetworkMetrics, useNodes } from '@/hooks/useNodes';
import { usePeers } from '@/hooks/usePeers';
import { calculateNetworkPulse, getPulseStatus, THRESHOLDS } from '@/lib/pulse';
import { MobileNodeDetail } from './MobileNodeDetail';
import { MobileSecurityView } from './MobileSecurityView';

// Dynamic imports for map components
const TopologyGraph = dynamic(
  () => import('@/components/map/TopologyGraph').then((m) => ({ default: m.TopologyGraph })),
  { ssr: false, loading: () => <div className="mobile-loading">Loading...</div> }
);

type MobileView = 'list' | 'topology' | 'security';
type ListSortColumn = 'name' | 'peers';
type NodeSortStage = 1 | 2 | 3 | 4;

/**
 * Get sort indicator for node column based on 4-stage cycle
 */
function getNodeSortIndicator(stage: NodeSortStage): string {
  switch (stage) {
    case 1: return '▲';      // A-Z
    case 2: return '▼';      // Z-A
    case 3: return '✓▲';     // Validators first, A-Z
    case 4: return '✓▼';     // Validators first, Z-A
  }
}

export function MobileHome() {
  const { selectedNodeId, selectNode } = useAppStore();
  const { metrics: networkMetrics } = useNetworkMetrics();
  const { data: nodes } = useNodes();
  const { peers } = usePeers();
  const [activeView, setActiveView] = useState<MobileView>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<ListSortColumn>('peers');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [nodeSortStage, setNodeSortStage] = useState<NodeSortStage>(1);

  // Calculate pulse
  const consensusNodeCount = networkMetrics
    ? Math.round((networkMetrics.consensusParticipation / 100) * networkMetrics.totalNodes)
    : 0;

  const pulse = networkMetrics
    ? calculateNetworkPulse({
        finalizationTime: networkMetrics.maxFinalizationLag,
        latency: networkMetrics.avgLatency,
        consensusRunning: consensusNodeCount,
        totalNodes: networkMetrics.totalNodes,
      })
    : 100;

  const pulseStatus = getPulseStatus(pulse);

  // Filter nodes by search
  const filteredNodes = useMemo(() => {
    if (!nodes) return [];
    if (!searchQuery.trim()) return nodes;
    const q = searchQuery.toLowerCase();
    return nodes.filter(
      (n) => n.nodeName.toLowerCase().includes(q) || n.nodeId.toLowerCase().includes(q)
    );
  }, [nodes, searchQuery]);

  // Sort nodes based on column and direction
  const sortedNodes = useMemo(() => {
    return [...filteredNodes].sort((a, b) => {
      // Special handling for 'name' column: 4-stage sort
      if (sortColumn === 'name') {
        const validatorsFirst = nodeSortStage === 3 || nodeSortStage === 4;
        const descending = nodeSortStage === 2 || nodeSortStage === 4;

        // Validators first when in stage 3 or 4
        if (validatorsFirst) {
          const aIsBaker = a.consensusBakerId !== null;
          const bIsBaker = b.consensusBakerId !== null;
          if (aIsBaker && !bIsBaker) return -1;
          if (!aIsBaker && bIsBaker) return 1;
        }

        // Then sort alphabetically
        const nameA = (a.nodeName || a.nodeId).toLowerCase();
        const nameB = (b.nodeName || b.nodeId).toLowerCase();
        const comparison = nameA.localeCompare(nameB);
        return descending ? -comparison : comparison;
      }

      // For peers column: normal asc/desc
      const comparison = a.peersCount - b.peersCount;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredNodes, sortColumn, sortDirection, nodeSortStage]);

  // Handle column header click
  const handleSort = (column: ListSortColumn) => {
    if (column === 'name') {
      if (sortColumn === 'name') {
        // Cycle through 4 stages
        setNodeSortStage((prev) => ((prev % 4) + 1) as NodeSortStage);
      } else {
        setSortColumn('name');
        setNodeSortStage(1);
      }
    } else {
      // For peers: toggle asc/desc
      if (sortColumn === column) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortColumn(column);
        setSortDirection('desc');
      }
    }
  };

  // Find selected node
  const selectedNode = nodes?.find((n) => n.nodeId === selectedNodeId) ?? null;
  const selectedNodePeer = peers.find((p) => p.peerId === selectedNodeId);

  return (
    <div className="mobile-container">
      {/* Header */}
      <header className="mobile-header">
        <div className="mobile-logo">
          <svg className="mobile-logo-icon" viewBox="0 0 170 169" fill="currentColor">
            <path d="M25.9077 84.5718C25.9077 116.886 52.3315 143.06 84.9828 143.06C93.7219 143.06 102.014 141.105 109.48 137.743V165.186C101.739 167.485 93.5155 168.754 84.9828 168.754C38.053 168.754 0 131.088 0 84.5718C0 38.0553 38.053 0.389404 85.0172 0.389404C93.5499 0.389404 101.739 1.65866 109.514 3.95703V31.4003C102.048 28.0042 93.7563 26.0832 85.0172 26.0832C52.4003 26.0832 25.9421 52.2573 25.9421 84.5718H25.9077ZM84.9828 120.214C65.0961 120.214 48.9597 104.262 48.9597 84.5375C48.9597 64.8126 65.0961 48.8611 84.9828 48.8611C104.869 48.8611 121.006 64.8469 121.006 84.5375C121.006 104.228 104.869 120.214 84.9828 120.214ZM162.018 120.214H131.741C139.413 110.334 144.058 98.019 144.058 84.5718C144.058 71.1245 139.413 58.775 131.706 48.8955H161.983C167.11 59.7356 170 71.8106 170 84.5718C170 97.3329 167.11 109.408 161.983 120.214" />
          </svg>
          <span className="mobile-logo-text">CONCORDIUM</span>
        </div>
        <div className={`mobile-pulse ${pulseStatus.label.toLowerCase()}`}>
          <span className="mobile-pulse-value">{pulse}%</span>
          <span className="mobile-pulse-label">{pulseStatus.label}</span>
        </div>
      </header>

      {/* Stats Row */}
      <div className="mobile-stats">
        <div className="mobile-stat">
          <span className="mobile-stat-value">{networkMetrics?.totalNodes ?? 0}</span>
          <span className="mobile-stat-label">NODES</span>
        </div>
        <div className="mobile-stat">
          <span className="mobile-stat-value">{networkMetrics?.avgPeers ?? 0}</span>
          <span className="mobile-stat-label">AVG PEERS</span>
        </div>
        <div className="mobile-stat">
          <span className="mobile-stat-value">{networkMetrics?.maxFinalizationLag ?? 0}</span>
          <span className="mobile-stat-label">SYNC LAG</span>
        </div>
        <div className="mobile-stat">
          <span className={`mobile-stat-value ${(networkMetrics?.consensusParticipation ?? 0) < THRESHOLDS.CONSENSUS_QUORUM ? 'negative' : ''}`}>
            {networkMetrics?.consensusParticipation ?? 0}%
          </span>
          <span className="mobile-stat-label">CONSENSUS</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="mobile-content">
        {activeView === 'list' && (
          <>
            {/* Search */}
            <div className="mobile-search">
              <input
                type="text"
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Sortable Column Headers */}
            <div className="mobile-list-headers">
              <button
                className={`mobile-list-header ${sortColumn === 'name' ? 'active' : ''}`}
                onClick={() => handleSort('name')}
              >
                NODE {sortColumn === 'name' ? getNodeSortIndicator(nodeSortStage) : ''}
              </button>
              <button
                className={`mobile-list-header ${sortColumn === 'peers' ? 'active' : ''}`}
                onClick={() => handleSort('peers')}
              >
                PEERS {sortColumn === 'peers' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
              </button>
              <span className="mobile-list-header">FIN</span>
            </div>

            {/* Node List */}
            <div className="mobile-node-list">
              {sortedNodes.map((node) => {
                const isBaker = node.consensusBakerId !== null;
                return (
                  <button
                    key={node.nodeId}
                    data-testid="mobile-node-item"
                    className={`mobile-node-item ${selectedNodeId === node.nodeId ? 'selected' : ''}`}
                    onClick={() => selectNode(node.nodeId)}
                  >
                    <div className="mobile-node-info">
                      <span className="mobile-node-name">
                        {isBaker && <span className="mobile-node-validator">✓</span>}
                        {node.nodeName || 'Unnamed'}
                      </span>
                      <span className="mobile-node-id">{node.nodeId.slice(0, 8)}...</span>
                    </div>
                    <div className="mobile-node-stats">
                      <span className="mobile-node-peers">{node.peersCount}</span>
                      <span className="mobile-node-fin">#{node.finalizedBlockHeight}</span>
                    </div>
                  </button>
                );
              })}
              {sortedNodes.length === 0 && (
                <div className="mobile-empty">
                  {searchQuery ? 'No nodes match your search' : 'Loading nodes...'}
                </div>
              )}
            </div>
          </>
        )}

        {activeView === 'topology' && (
          <div className="mobile-viz">
            <TopologyGraph />
          </div>
        )}

        {activeView === 'security' && (
          <MobileSecurityView />
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="mobile-nav">
        <button
          className={`mobile-nav-btn ${activeView === 'list' ? 'active' : ''}`}
          onClick={() => setActiveView('list')}
        >
          <span className="mobile-nav-icon">&#9776;</span>
          <span className="mobile-nav-label">List</span>
        </button>
        <button
          className={`mobile-nav-btn ${activeView === 'topology' ? 'active' : ''}`}
          onClick={() => setActiveView('topology')}
        >
          <span className="mobile-nav-icon">&#9673;</span>
          <span className="mobile-nav-label">Topology</span>
        </button>
        <button
          className={`mobile-nav-btn ${activeView === 'security' ? 'active' : ''}`}
          onClick={() => setActiveView('security')}
        >
          <span className="mobile-nav-icon">&#128737;</span>
          <span className="mobile-nav-label">Security</span>
        </button>
      </nav>

      {/* Node Detail Bottom Sheet */}
      {selectedNode && (
        <MobileNodeDetail
          node={selectedNode}
          peer={selectedNodePeer}
          onClose={() => selectNode(null)}
        />
      )}
    </div>
  );
}
