/**
 * Stark Industries HUD - Iron Man Inspired Interface
 *
 * Features the J.A.R.V.I.S./F.R.I.D.A.Y. aesthetic:
 * - Arc reactor-inspired pulse indicator
 * - Holographic translucent panels
 * - Electric blue with orange accents
 * - Scanning animations and glow effects
 */

import { Sparkline } from './Sparkline';
import { getPulseStatus } from '../../lib/pulse';
import type { MetricSnapshot } from '../../hooks/useMetricHistory';

export interface CommandHeaderProps {
  metrics: MetricSnapshot;
  history: MetricSnapshot[];
  className?: string;
}

function getMetricHistory(
  history: MetricSnapshot[],
  key: keyof Omit<MetricSnapshot, 'timestamp'>
): number[] {
  return history.map((h) => h[key]);
}

export function CommandHeader({
  metrics,
  history,
  className = '',
}: CommandHeaderProps) {
  const pulseStatus = getPulseStatus(metrics.pulse);
  const isNominal = pulseStatus.label === 'NOMINAL';

  return (
    <header data-testid="command-header" className={`stark-hud ${className}`}>
      {/* Scanning line animation */}
      <div className="hud-scanline" />

      {/* Left Section - Logo & Title */}
      <div className="hud-left">
        <div className="hud-logo-container">
          {/* Concordium Logo */}
          <svg
            width="36"
            height="36"
            viewBox="0 0 170 169"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="hud-logo"
          >
            <path
              d="M25.9077 84.5718C25.9077 116.886 52.3315 143.06 84.9828 143.06C93.7219 143.06 102.014 141.105 109.48 137.743V165.186C101.739 167.485 93.5155 168.754 84.9828 168.754C38.053 168.754 0 131.088 0 84.5718C0 38.0553 38.053 0.389404 85.0172 0.389404C93.5499 0.389404 101.739 1.65866 109.514 3.95703V31.4003C102.048 28.0042 93.7563 26.0832 85.0172 26.0832C52.4003 26.0832 25.9421 52.2573 25.9421 84.5718H25.9077ZM84.9828 120.214C65.0961 120.214 48.9597 104.262 48.9597 84.5375C48.9597 64.8126 65.0961 48.8611 84.9828 48.8611C104.869 48.8611 121.006 64.8469 121.006 84.5375C121.006 104.228 104.869 120.214 84.9828 120.214ZM162.018 120.214H131.741C139.413 110.334 144.058 98.019 144.058 84.5718C144.058 71.1245 139.413 58.775 131.706 48.8955H161.983C167.11 59.7356 170 71.8106 170 84.5718C170 97.3329 167.11 109.408 161.983 120.214"
              fill="currentColor"
            />
          </svg>
          {/* Rotating ring */}
          <div className="logo-ring" />
        </div>

        <div className="hud-title-block">
          <h1 className="hud-title">CONCORDIUM</h1>
          <span className="hud-subtitle">NETWORK COMMAND</span>
        </div>
      </div>

      {/* Center - Arc Reactor Style Pulse */}
      <div className="hud-center">
        <div className="arc-reactor">
          {/* Outer rings */}
          <div className="arc-ring arc-ring-1" />
          <div className="arc-ring arc-ring-2" />
          <div className="arc-ring arc-ring-3" />

          {/* Core */}
          <div className={`arc-core ${isNominal ? 'nominal' : 'warning'}`}>
            <span className="arc-value">{metrics.pulse}</span>
            <span className="arc-unit">%</span>
          </div>

          {/* Status label */}
          <div className={`arc-status ${isNominal ? 'nominal' : 'warning'}`}>
            {pulseStatus.label}
          </div>
        </div>

        {/* Pulse sparkline */}
        <div className="arc-history">
          <Sparkline
            data={getMetricHistory(history, 'pulse')}
            min={0}
            max={100}
            maxBars={24}
            className="arc-sparkline"
          />
        </div>
      </div>

      {/* Right - Metric Panels */}
      <div className="hud-right">
        {/* Metric: Nodes */}
        <div className="hud-panel">
          <div className="panel-corner tl" />
          <div className="panel-corner tr" />
          <div className="panel-corner bl" />
          <div className="panel-corner br" />
          <div className="panel-content">
            <span className="panel-value">{metrics.nodes}</span>
            <span className="panel-label">NODES</span>
            <Sparkline
              data={getMetricHistory(history, 'nodes')}
              maxBars={10}
              className="panel-spark"
            />
          </div>
        </div>

        {/* Metric: Finalization */}
        <div className="hud-panel">
          <div className="panel-corner tl" />
          <div className="panel-corner tr" />
          <div className="panel-corner bl" />
          <div className="panel-corner br" />
          <div className="panel-content">
            <span className="panel-value">{metrics.finalizationTime}s</span>
            <span className="panel-label">FINAL</span>
            <Sparkline
              data={getMetricHistory(history, 'finalizationTime')}
              maxBars={10}
              className="panel-spark"
            />
          </div>
        </div>

        {/* Metric: Latency */}
        <div className="hud-panel accent">
          <div className="panel-corner tl" />
          <div className="panel-corner tr" />
          <div className="panel-corner bl" />
          <div className="panel-corner br" />
          <div className="panel-content">
            <span className="panel-value">{metrics.latency}ms</span>
            <span className="panel-label">LATENCY</span>
            <Sparkline
              data={getMetricHistory(history, 'latency')}
              maxBars={10}
              className="panel-spark"
            />
          </div>
        </div>

        {/* Metric: Consensus */}
        <div className="hud-panel">
          <div className="panel-corner tl" />
          <div className="panel-corner tr" />
          <div className="panel-corner bl" />
          <div className="panel-corner br" />
          <div className="panel-content">
            <span className="panel-value">{metrics.consensus}%</span>
            <span className="panel-label">CONSENSUS</span>
            <Sparkline
              data={getMetricHistory(history, 'consensus')}
              min={0}
              max={100}
              maxBars={10}
              className="panel-spark"
            />
          </div>
        </div>
      </div>

      {/* Bottom edge glow */}
      <div className="hud-edge-glow" />
    </header>
  );
}
