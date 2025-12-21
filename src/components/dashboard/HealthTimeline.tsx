'use client';

export type HealthStatusType = 'healthy' | 'lagging' | 'issue';

export interface HealthStatus {
  timestamp: number;
  status: HealthStatusType;
}

export interface HealthTimelineProps {
  data: HealthStatus[];
  showLabels?: boolean;
  height?: number;
  /** Time range in minutes (for label display) */
  timeRangeMinutes?: number;
}

const STATUS_COLORS = {
  healthy: 'var(--bb-green)',
  lagging: 'var(--bb-amber)',
  issue: 'var(--bb-red)',
};

export function HealthTimeline({
  data,
  showLabels = false,
  height = 16,
  timeRangeMinutes = 60,
}: HealthTimelineProps) {
  // Calculate time range from data if available, otherwise use prop
  const actualRange = data.length >= 2
    ? Math.round((data[data.length - 1].timestamp - data[0].timestamp) / 60000)
    : timeRangeMinutes;

  // Format time label (e.g., 60 -> "1h", 30 -> "30m")
  const formatTimeLabel = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };
  return (
    <div className="health-timeline" style={{ height: showLabels ? height + 16 : height }}>
      <div
        className="health-timeline-bar"
        style={{
          display: 'flex',
          height,
          width: '100%',
          borderRadius: '2px',
          overflow: 'hidden',
          background: 'var(--bb-black)',
          border: '1px solid var(--bb-border)',
        }}
      >
        {data.map((d, i) => (
          <div
            key={i}
            className={`health-segment ${d.status}`}
            style={{
              flex: 1,
              background: STATUS_COLORS[d.status],
              opacity: d.status === 'healthy' ? 0.7 : 0.9,
              transition: 'opacity 0.2s ease',
            }}
            title={`${new Date(d.timestamp).toLocaleTimeString()}: ${d.status}`}
          />
        ))}
      </div>

      {showLabels && (
        <div
          className="health-timeline-labels"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '4px',
            fontSize: '9px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--bb-gray)',
          }}
        >
          <span>-{formatTimeLabel(actualRange)}</span>
          <span style={{ opacity: 0.6 }}>-{formatTimeLabel(Math.round(actualRange / 2))}</span>
          <span>now</span>
        </div>
      )}
    </div>
  );
}
