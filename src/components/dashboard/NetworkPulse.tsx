/**
 * Network Pulse display component
 * Shows composite health score with status indicator and sparkline
 */

import { Sparkline } from './Sparkline';

export type PulseStatus = 'nominal' | 'elevated' | 'degraded' | 'critical';

export interface NetworkPulseProps {
  pulse: number;
  status: PulseStatus;
  history?: number[];
  className?: string;
}

/**
 * Network Pulse - displays health score with visual indicator
 */
export function NetworkPulse({
  pulse,
  status,
  history,
  className = '',
}: NetworkPulseProps) {
  const hasHistory = history && history.length > 0;

  return (
    <div data-testid="network-pulse" className={`network-pulse ${className}`}>
      {/* Pulse indicator with glow effect */}
      <div
        data-testid="pulse-indicator"
        className={`pulse-indicator status-${status}`}
      >
        {/* Score display */}
        <div data-testid="pulse-score" className="pulse-score">
          <span className="pulse-value">{pulse}</span>
          <span className="pulse-percent">%</span>
        </div>

        {/* Status label */}
        <div data-testid="status-label" className="status-label">
          {status.toUpperCase()}
        </div>
      </div>

      {/* Sparkline history */}
      {hasHistory && (
        <div className="pulse-history">
          <Sparkline data={history} min={0} max={100} maxBars={30} />
        </div>
      )}
    </div>
  );
}
