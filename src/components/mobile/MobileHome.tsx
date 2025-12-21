'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/hooks/useAppStore';
import { useNetworkMetrics, useNodes } from '@/hooks/useNodes';
import { useMetricHistory, type MetricSnapshot } from '@/hooks/useMetricHistory';
import { calculateNetworkPulse, getPulseStatus, THRESHOLDS, calculateFinalizationHealth, calculateLatencyHealth } from '@/lib/pulse';

function useCurrentTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return time;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', { hour12: false });
}

export function MobileHome() {
  const router = useRouter();
  const { selectedNodeId, selectNode } = useAppStore();
  const { metrics: networkMetrics, dataUpdatedAt } = useNetworkMetrics();
  const { data: nodes } = useNodes();

  const selectedNode = nodes?.find(n => n.nodeId === selectedNodeId) ?? null;
  const knownNodeIds = useMemo(() => new Set(nodes?.map(n => n.nodeId) ?? []), [nodes]);
  const { history, addSnapshot } = useMetricHistory();
  const currentTime = useCurrentTime();
  const [searchInput, setSearchInput] = useState('');
  const [activeTab, setActiveTab] = useState<'metrics' | 'nodes' | 'details'>('nodes');

  // Calculate metrics
  useEffect(() => {
    if (!networkMetrics) return;
    const consensusNodeCount = Math.round((networkMetrics.consensusParticipation / 100) * networkMetrics.totalNodes);
    const pulse = calculateNetworkPulse({
      finalizationTime: networkMetrics.maxFinalizationLag,
      latency: networkMetrics.avgLatency,
      consensusRunning: consensusNodeCount,
      totalNodes: networkMetrics.totalNodes,
    });

    const snapshot: MetricSnapshot = {
      timestamp: Date.now(),
      nodes: networkMetrics.totalNodes,
      finalizationTime: networkMetrics.maxFinalizationLag,
      latency: networkMetrics.avgLatency,
      packets: 1200000,
      consensus: networkMetrics.consensusParticipation,
      pulse,
    };
    addSnapshot(snapshot);
  }, [networkMetrics, addSnapshot]);

  const currentMetrics: MetricSnapshot = history.length > 0
    ? history[history.length - 1]
    : {
        timestamp: Date.now(),
        nodes: networkMetrics?.totalNodes ?? 0,
        finalizationTime: networkMetrics?.maxFinalizationLag ?? 0,
        latency: networkMetrics?.avgLatency ?? 50,
        packets: 1200000,
        consensus: networkMetrics?.consensusParticipation ?? 0,
        pulse: 100,
      };

  const pulseStatus = getPulseStatus(currentMetrics.pulse);
  const secondsAgo = dataUpdatedAt ? Math.floor((Date.now() - dataUpdatedAt) / 1000) : 0;

  // Filter nodes
  const filteredNodes = useMemo(() => {
    if (!nodes) return [];
    const term = searchInput.toLowerCase().trim();
    const filtered = term
      ? nodes.filter(n => n.nodeName.toLowerCase().includes(term) || n.nodeId.toLowerCase().includes(term))
      : nodes;
    return [...filtered].sort((a, b) => b.peersCount - a.peersCount);
  }, [nodes, searchInput]);

  const handleNodeClick = (nodeId: string) => {
    selectNode(nodeId);
    setActiveTab('details');
  };

  const handleViewMap = () => {
    router.push('/map');
  };

  return (
    <main className="mobile-home">
      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="mobile-logo">
          <svg className="mobile-logo-icon" viewBox="0 0 170 169" fill="currentColor">
            <path d="M25.9077 84.5718C25.9077 116.886 52.3315 143.06 84.9828 143.06C93.7219 143.06 102.014 141.105 109.48 137.743V165.186C101.739 167.485 93.5155 168.754 84.9828 168.754C38.053 168.754 0 131.088 0 84.5718C0 38.0553 38.053 0.389404 85.0172 0.389404C93.5499 0.389404 101.739 1.65866 109.514 3.95703V31.4003C102.048 28.0042 93.7563 26.0832 85.0172 26.0832C52.4003 26.0832 25.9421 52.2573 25.9421 84.5718H25.9077ZM84.9828 120.214C65.0961 120.214 48.9597 104.262 48.9597 84.5375C48.9597 64.8126 65.0961 48.8611 84.9828 48.8611C104.869 48.8611 121.006 64.8469 121.006 84.5375C121.006 104.228 104.869 120.214 84.9828 120.214ZM162.018 120.214H131.741C139.413 110.334 144.058 98.019 144.058 84.5718C144.058 71.1245 139.413 58.775 131.706 48.8955H161.983C167.11 59.7356 170 71.8106 170 84.5718C170 97.3329 167.11 109.408 161.983 120.214" />
          </svg>
          <span>CONCORDIUM</span>
        </div>
        <div className="mobile-time">
          {formatTime(currentTime)}
        </div>
      </header>

      {/* Pulse Banner */}
      <div className={`mobile-pulse-banner ${pulseStatus.label.toLowerCase()}`}>
        <div className="mobile-pulse-value">
          <span className="mobile-pulse-number">{currentMetrics.pulse}</span>
          <span className="mobile-pulse-unit">%</span>
        </div>
        <div className="mobile-pulse-info">
          <span className="mobile-pulse-label">NETWORK PULSE</span>
          <span className={`mobile-pulse-status ${pulseStatus.label.toLowerCase()}`}>
            {pulseStatus.label}
          </span>
        </div>
        <button className="mobile-map-btn" onClick={handleViewMap}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          <span>MAP</span>
        </button>
      </div>

      {/* Quick Stats Row */}
      <div className="mobile-stats-row">
        <div className="mobile-stat">
          <span className="mobile-stat-value">{currentMetrics.nodes}</span>
          <span className="mobile-stat-label">NODES</span>
        </div>
        <div className="mobile-stat">
          <span className={`mobile-stat-value ${currentMetrics.consensus >= THRESHOLDS.CONSENSUS_QUORUM ? 'positive' : 'negative'}`}>
            {currentMetrics.consensus}%
          </span>
          <span className="mobile-stat-label">CONSENSUS</span>
        </div>
        <div className="mobile-stat">
          <span className="mobile-stat-value">{currentMetrics.finalizationTime}</span>
          <span className="mobile-stat-label">SYNC LAG</span>
        </div>
        <div className="mobile-stat">
          <span className="mobile-stat-value">{currentMetrics.latency}ms</span>
          <span className="mobile-stat-label">LATENCY</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mobile-tabs">
        <button
          className={`mobile-tab ${activeTab === 'nodes' ? 'active' : ''}`}
          onClick={() => setActiveTab('nodes')}
        >
          NODES ({nodes?.length ?? 0})
        </button>
        <button
          className={`mobile-tab ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
          disabled={!selectedNode}
        >
          DETAILS {selectedNode ? '●' : ''}
        </button>
        <button
          className={`mobile-tab ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          METRICS
        </button>
      </div>

      {/* Content Area */}
      <div className="mobile-content">
        {activeTab === 'nodes' && (
          <div className="mobile-node-list">
            {/* Search */}
            <div className="mobile-search">
              <input
                type="text"
                placeholder="Search nodes..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            {/* Node List */}
            <div className="mobile-nodes">
              {filteredNodes.map((node) => (
                <div
                  key={node.nodeId}
                  className={`mobile-node-row ${selectedNodeId === node.nodeId ? 'selected' : ''}`}
                  onClick={() => handleNodeClick(node.nodeId)}
                >
                  <div className="mobile-node-main">
                    <span className={`mobile-node-status ${node.consensusRunning ? 'ok' : 'off'}`} />
                    <span className="mobile-node-name">
                      {node.nodeName || node.nodeId.slice(0, 12)}
                    </span>
                    {node.bakingCommitteeMember === 'ActiveInCommittee' && (
                      <span className="mobile-node-baker">BAKER</span>
                    )}
                  </div>
                  <div className="mobile-node-meta">
                    <span className="mobile-node-peers">{node.peersCount} peers</span>
                    <span className="mobile-node-height">#{node.finalizedBlockHeight}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="mobile-details">
            {selectedNode ? (
              <>
                <div className="mobile-detail-header">
                  <h2>{selectedNode.nodeName || 'Unnamed Node'}</h2>
                  <span className="mobile-detail-id">{selectedNode.nodeId.slice(0, 20)}...</span>
                </div>

                <div className="mobile-detail-section">
                  <h3>STATUS</h3>
                  <div className="mobile-detail-grid">
                    <div className="mobile-detail-item">
                      <span className="label">Consensus</span>
                      <span className={`value ${selectedNode.consensusRunning ? 'positive' : 'negative'}`}>
                        {selectedNode.consensusRunning ? 'RUNNING' : 'STOPPED'}
                      </span>
                    </div>
                    <div className="mobile-detail-item">
                      <span className="label">Uptime</span>
                      <span className="value">{Math.floor(selectedNode.uptime / 3600)}h {Math.floor((selectedNode.uptime % 3600) / 60)}m</span>
                    </div>
                    <div className="mobile-detail-item">
                      <span className="label">Baker</span>
                      <span className={`value ${selectedNode.bakingCommitteeMember === 'ActiveInCommittee' ? 'highlight' : ''}`}>
                        {selectedNode.bakingCommitteeMember === 'ActiveInCommittee' ? `#${selectedNode.consensusBakerId}` : 'NO'}
                      </span>
                    </div>
                    <div className="mobile-detail-item">
                      <span className="label">Type</span>
                      <span className="value">{selectedNode.peerType}</span>
                    </div>
                  </div>
                </div>

                <div className="mobile-detail-section">
                  <h3>NETWORK</h3>
                  <div className="mobile-detail-grid">
                    <div className="mobile-detail-item">
                      <span className="label">Peers</span>
                      <span className="value highlight">{selectedNode.peersCount}</span>
                    </div>
                    <div className="mobile-detail-item">
                      <span className="label">Latency</span>
                      <span className="value">{selectedNode.averagePing?.toFixed(0) ?? 'N/A'}ms</span>
                    </div>
                    <div className="mobile-detail-item">
                      <span className="label">BW In</span>
                      <span className="value">{selectedNode.averageBytesPerSecondIn ? `${(selectedNode.averageBytesPerSecondIn / 1024).toFixed(1)} KB/s` : 'N/A'}</span>
                    </div>
                    <div className="mobile-detail-item">
                      <span className="label">BW Out</span>
                      <span className="value">{selectedNode.averageBytesPerSecondOut ? `${(selectedNode.averageBytesPerSecondOut / 1024).toFixed(1)} KB/s` : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="mobile-detail-section">
                  <h3>BLOCKCHAIN</h3>
                  <div className="mobile-detail-grid cols-1">
                    <div className="mobile-detail-item">
                      <span className="label">Best Height</span>
                      <span className="value">{selectedNode.bestBlockHeight.toLocaleString()}</span>
                    </div>
                    <div className="mobile-detail-item">
                      <span className="label">Finalized</span>
                      <span className="value">{selectedNode.finalizedBlockHeight.toLocaleString()}</span>
                    </div>
                    <div className="mobile-detail-item">
                      <span className="label">Best Block</span>
                      <span className="value mono">{selectedNode.bestBlock?.slice(0, 24)}...</span>
                    </div>
                  </div>
                </div>

                {selectedNode.peersList.length > 0 && (
                  <div className="mobile-detail-section">
                    <h3>CONNECTED PEERS ({selectedNode.peersList.length})</h3>
                    <div className="mobile-peer-grid">
                      {selectedNode.peersList.slice(0, 12).map((peerId) => {
                        const isAvailable = knownNodeIds.has(peerId);
                        return (
                          <span
                            key={peerId}
                            className={`mobile-peer-tag ${!isAvailable ? 'unavailable' : ''}`}
                            onClick={() => isAvailable && handleNodeClick(peerId)}
                          >
                            {peerId.slice(0, 8)}
                            {!isAvailable && <span className="ext">EXT</span>}
                          </span>
                        );
                      })}
                      {selectedNode.peersList.length > 12 && (
                        <span className="mobile-peer-more">+{selectedNode.peersList.length - 12}</span>
                      )}
                    </div>
                  </div>
                )}

                <button className="mobile-view-on-map" onClick={handleViewMap}>
                  VIEW ON MAP
                </button>
              </>
            ) : (
              <div className="mobile-no-selection">
                <span>Select a node from the list</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="mobile-metrics">
            <div className="mobile-metric-card pulse">
              <div className="mobile-metric-header">
                <span className="mobile-metric-title">Network Pulse</span>
                <span className={`mobile-metric-badge ${pulseStatus.label.toLowerCase()}`}>
                  {pulseStatus.label}
                </span>
              </div>
              <div className="mobile-metric-value-large">{currentMetrics.pulse}%</div>
              <div className="mobile-metric-desc">
                Composite health score based on sync, latency, and consensus
              </div>
            </div>

            <div className="mobile-metric-grid">
              <div className="mobile-metric-card">
                <span className="mobile-metric-title">Sync Health</span>
                <span className="mobile-metric-value">{calculateFinalizationHealth(currentMetrics.finalizationTime)}%</span>
                <span className="mobile-metric-sub">{currentMetrics.finalizationTime} blks lag</span>
              </div>
              <div className="mobile-metric-card">
                <span className="mobile-metric-title">Latency Health</span>
                <span className="mobile-metric-value">{calculateLatencyHealth(currentMetrics.latency)}%</span>
                <span className="mobile-metric-sub">{currentMetrics.latency}ms avg</span>
              </div>
              <div className="mobile-metric-card">
                <span className="mobile-metric-title">Consensus</span>
                <span className={`mobile-metric-value ${currentMetrics.consensus >= THRESHOLDS.CONSENSUS_QUORUM ? 'positive' : 'negative'}`}>
                  {currentMetrics.consensus}%
                </span>
                <span className="mobile-metric-sub">{currentMetrics.consensus >= THRESHOLDS.CONSENSUS_QUORUM ? 'Quorum' : 'No Quorum'}</span>
              </div>
              <div className="mobile-metric-card">
                <span className="mobile-metric-title">Active Nodes</span>
                <span className="mobile-metric-value">{currentMetrics.nodes}</span>
                <span className="mobile-metric-sub">Reporting to dashboard</span>
              </div>
            </div>

            <div className="mobile-metric-card">
              <span className="mobile-metric-title">Last Updated</span>
              <span className="mobile-metric-value">{secondsAgo}s ago</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status */}
      <footer className="mobile-footer">
        <span className={`mobile-status-dot ${pulseStatus.label.toLowerCase()}`} />
        <span>CONCORDIUM MAINNET</span>
        <span className="mobile-footer-time">{secondsAgo}s</span>
      </footer>
    </main>
  );
}
