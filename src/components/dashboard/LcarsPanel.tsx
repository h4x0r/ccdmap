/**
 * LCARS-style panel component with Star Trek aesthetic
 * Features curved corners, accent colors, and optional status indicators
 */

export type AccentColor = 'cyan' | 'amber' | 'magenta' | 'red';
export type StatusType = 'nominal' | 'elevated' | 'degraded' | 'critical';

export interface LcarsPanelProps {
  title: string;
  children: React.ReactNode;
  accent?: AccentColor;
  status?: StatusType;
  className?: string;
}

/**
 * LCARS Panel - Star Trek inspired UI panel
 */
export function LcarsPanel({
  title,
  children,
  accent = 'cyan',
  status,
  className = '',
}: LcarsPanelProps) {
  return (
    <div
      data-testid="lcars-panel"
      className={`lcars-panel accent-${accent} ${className}`}
    >
      {/* LCARS header bar with curved corner */}
      <div className="lcars-header">
        <div className="lcars-corner" />
        <div className="lcars-title-bar">
          <span className="lcars-title">{title}</span>
          {status && (
            <div
              data-testid="status-indicator"
              className={`lcars-status status-${status}`}
            >
              <span className="status-dot" />
              <span className="status-label">{status.toUpperCase()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Panel content */}
      <div className="lcars-content">{children}</div>
    </div>
  );
}
