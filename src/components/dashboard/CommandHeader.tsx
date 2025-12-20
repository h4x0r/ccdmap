/**
 * Command Header - LCARS-style dashboard header
 * Displays network pulse, metrics with sparklines, and logo
 */

import { LcarsPanel } from './LcarsPanel';
import { NetworkPulse } from './NetworkPulse';
import { Sparkline } from './Sparkline';
import { getPulseStatus } from '../../lib/pulse';
import type { MetricSnapshot } from '../../hooks/useMetricHistory';

export interface CommandHeaderProps {
  metrics: MetricSnapshot;
  history: MetricSnapshot[];
  className?: string;
}

/**
 * Format number with K/M suffix
 */
function formatNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toString();
}

/**
 * Extract metric history for sparkline
 */
function getMetricHistory(
  history: MetricSnapshot[],
  key: keyof Omit<MetricSnapshot, 'timestamp'>
): number[] {
  return history.map((h) => h[key]);
}

/**
 * Command Header component
 */
export function CommandHeader({
  metrics,
  history,
  className = '',
}: CommandHeaderProps) {
  const pulseStatus = getPulseStatus(metrics.pulse);

  return (
    <header data-testid="command-header" className={`command-header ${className}`}>
      {/* Logo Section */}
      <div className="header-logo">
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" />
          <circle cx="20" cy="20" r="8" fill="currentColor" />
        </svg>
        <span className="header-title">CONCORDIUM</span>
      </div>

      {/* Network Pulse - Center */}
      <div className="header-pulse">
        <NetworkPulse
          pulse={metrics.pulse}
          status={pulseStatus.label.toLowerCase() as 'nominal' | 'elevated' | 'degraded' | 'critical'}
          history={getMetricHistory(history, 'pulse')}
        />
      </div>

      {/* Metric Panels */}
      <div className="header-metrics">
        {/* Nodes */}
        <LcarsPanel title="NODES" accent="cyan">
          <div className="metric-value">{metrics.nodes}</div>
          <Sparkline
            data={getMetricHistory(history, 'nodes')}
            maxBars={20}
          />
        </LcarsPanel>

        {/* Finalization Time */}
        <LcarsPanel title="FINALIZATION" accent="cyan">
          <div className="metric-value">{metrics.finalizationTime}s</div>
          <Sparkline
            data={getMetricHistory(history, 'finalizationTime')}
            maxBars={20}
          />
        </LcarsPanel>

        {/* Latency */}
        <LcarsPanel title="LATENCY" accent="amber">
          <div className="metric-value">{metrics.latency}ms</div>
          <Sparkline
            data={getMetricHistory(history, 'latency')}
            maxBars={20}
          />
        </LcarsPanel>

        {/* Consensus */}
        <LcarsPanel title="CONSENSUS" accent="cyan">
          <div className="metric-value">{metrics.consensus}%</div>
          <Sparkline
            data={getMetricHistory(history, 'consensus')}
            min={0}
            max={100}
            maxBars={20}
          />
        </LcarsPanel>

        {/* Packets */}
        <LcarsPanel title="PACKETS" accent="magenta">
          <div className="metric-value">{formatNumber(metrics.packets)}</div>
          <Sparkline
            data={getMetricHistory(history, 'packets')}
            maxBars={20}
          />
        </LcarsPanel>
      </div>
    </header>
  );
}
