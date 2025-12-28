'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/hooks/useAppStore';
import { useNetworkMetrics, useNodes } from '@/hooks/useNodes';
import { usePeers } from '@/hooks/usePeers';
import { calculateNetworkPulse, getPulseStatus, THRESHOLDS } from '@/lib/pulse';
import { MobileNodeDetail } from './MobileNodeDetail';

// Dynamic imports for map components
const TopologyGraph = dynamic(
  () => import('@/components/map/TopologyGraph').then((m) => ({ default: m.TopologyGraph })),
  { ssr: false, loading: () => <div className="mobile-loading">Loading...</div> }
);

const GeographicMap = dynamic(
  () => import('@/components/map/GeographicMap').then((m) => ({ default: m.GeographicMap })),
  { ssr: false, loading: () => <div className="mobile-loading">Loading...</div> }
);

type MobileView = 'list' | 'topology' | 'map';

export function MobileHome() {
  const { selectedNodeId, selectNode } = useAppStore();
  const { metrics: networkMetrics } = useNetworkMetrics();
  const { data: nodes } = useNodes();
  const { peers } = usePeers();
  const [activeView, setActiveView] = useState<MobileView>('list');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Sort by peer count descending
  const sortedNodes = useMemo(
    () => [...filteredNodes].sort((a, b) => b.peersCount - a.peersCount),
    [filteredNodes]
  );

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

            {/* Node List */}
            <div className="mobile-node-list">
              {sortedNodes.map((node) => (
                <button
                  key={node.nodeId}
                  className={`mobile-node-item ${selectedNodeId === node.nodeId ? 'selected' : ''}`}
                  onClick={() => selectNode(node.nodeId)}
                >
                  <div className="mobile-node-info">
                    <span className="mobile-node-name">{node.nodeName || 'Unnamed'}</span>
                    <span className="mobile-node-id">{node.nodeId.slice(0, 8)}...</span>
                  </div>
                  <div className="mobile-node-stats">
                    <span className={`mobile-node-status ${node.finalizedBlockHeight > 0 ? 'online' : 'offline'}`}>
                      {node.finalizedBlockHeight > 0 ? 'ONLINE' : 'OFFLINE'}
                    </span>
                    <span className="mobile-node-peers">{node.peersCount} peers</span>
                  </div>
                </button>
              ))}
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

        {activeView === 'map' && (
          <div className="mobile-viz">
            <GeographicMap />
          </div>
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
          className={`mobile-nav-btn ${activeView === 'map' ? 'active' : ''}`}
          onClick={() => setActiveView('map')}
        >
          <span className="mobile-nav-icon">&#127758;</span>
          <span className="mobile-nav-label">Map</span>
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
