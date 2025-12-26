'use client';

import { useMemo } from 'react';
import { type HealthStatus } from './HealthTimeline';
import { type MRTGDataPoint } from './MRTGChart';
import { MiniMetricTrack } from './MiniMetricTrack';

export interface NodeDetailPanelProps {
  nodeId: string;
  nodeName: string;
  healthHistory: HealthStatus[];
  latencyHistory: MRTGDataPoint[];
  bandwidthInHistory: MRTGDataPoint[];
  bandwidthOutHistory: MRTGDataPoint[];
  peerCountHistory: MRTGDataPoint[];
  onClose: () => void;
  onOpenDeepDive?: () => void;
}

export function NodeDetailPanel({
  nodeId,
  nodeName,
  healthHistory,
  latencyHistory,
  bandwidthInHistory,
  bandwidthOutHistory,
  peerCountHistory,
  onClose,
  onOpenDeepDive,
}: NodeDetailPanelProps) {
  return (
    <div className="node-detail-panel bb-panel">
      {/* Header */}
      <div
        className="bb-panel-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          background: 'var(--bb-panel)',
          borderBottom: '1px solid var(--bb-border)',
        }}
      >
        <div>
          <span className="font-mono font-bold text-[var(--bb-orange)]">
            {nodeName}
          </span>
          <span
            className="font-mono text-[10px] text-[var(--bb-gray)] ml-2"
            style={{ opacity: 0.7 }}
          >
            {nodeId}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={onOpenDeepDive}
            aria-label="deep dive"
            className="text-[var(--bb-cyan)] hover:text-[var(--bb-orange)] transition-colors font-mono"
            style={{
              background: 'none',
              border: '1px solid var(--bb-border)',
              cursor: 'pointer',
              fontSize: '10px',
              padding: '4px 8px',
              borderRadius: '2px',
            }}
          >
            Deep Dive
          </button>
          <button
            onClick={onClose}
            aria-label="close"
            className="text-[var(--bb-gray)] hover:text-[var(--bb-orange)] transition-colors"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '4px 8px',
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Metric Tracks - matching DeepDivePanel style */}
      <MiniMetricTrack
        label="Health"
        metric="health"
        healthData={healthHistory}
        height={30}
        collapsible
      />
      <MiniMetricTrack
        label="Latency"
        metric="latency"
        data={latencyHistory}
        height={50}
        collapsible
      />
      <MiniMetricTrack
        label="Bandwidth"
        metric="bandwidth"
        bandwidthData={{
          inbound: bandwidthInHistory,
          outbound: bandwidthOutHistory,
        }}
        height={50}
        collapsible
      />
      <MiniMetricTrack
        label="Peers"
        metric="peers"
        data={peerCountHistory}
        height={50}
        collapsible
      />
    </div>
  );
}
