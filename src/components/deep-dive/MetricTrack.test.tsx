import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MetricTrack, type MetricTrackProps } from './MetricTrack';
import type { TimeRange } from '@/lib/timeline';
import type { NodeHistoryPoint } from '@/hooks/useDeepDiveData';

describe('MetricTrack', () => {
  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;
  const now = Date.now();

  const createMockData = (count: number): NodeHistoryPoint[] =>
    Array.from({ length: count }, (_, i) => ({
      timestamp: now - (count - i) * HOUR,
      healthStatus: 'healthy' as const,
      peersCount: 5 + i,
      avgPing: 40 + i * 2,
      finalizedHeight: 1000 + i,
      heightDelta: 0,
      bytesIn: 1000 + i * 100,
      bytesOut: 800 + i * 80,
    }));

  const defaultProps: MetricTrackProps = {
    label: 'Latency',
    metric: 'latency',
    range: { start: now - DAY, end: now },
    primaryData: createMockData(24),
    comparisonData: [],
    height: 80,
    collapsed: false,
    onToggleCollapse: vi.fn(),
  };

  describe('rendering', () => {
    it('renders track with label', () => {
      render(<MetricTrack {...defaultProps} />);

      expect(screen.getByTestId('metric-track')).toBeInTheDocument();
      expect(screen.getByText('LATENCY')).toBeInTheDocument();
    });

    it('renders SVG chart area', () => {
      render(<MetricTrack {...defaultProps} />);

      expect(screen.getByTestId('metric-chart')).toBeInTheDocument();
    });

    it('shows summary stats in header', () => {
      render(<MetricTrack {...defaultProps} />);

      // Should show some kind of summary (avg, current, etc.)
      const header = screen.getByTestId('track-header');
      expect(header.textContent).toMatch(/\d+/); // Contains numbers
    });
  });

  describe('metric types', () => {
    it('renders latency as line chart', () => {
      render(<MetricTrack {...defaultProps} metric="latency" />);

      const chart = screen.getByTestId('metric-chart');
      expect(chart.querySelector('path')).toBeInTheDocument();
    });

    it('renders peers as step chart', () => {
      render(<MetricTrack {...defaultProps} metric="peers" label="Peers" />);

      const chart = screen.getByTestId('metric-chart');
      expect(chart.querySelector('path')).toBeInTheDocument();
    });

    it('renders health as segmented bar', () => {
      render(<MetricTrack {...defaultProps} metric="health" label="Health" />);

      const chart = screen.getByTestId('metric-chart');
      expect(chart.querySelectorAll('rect').length).toBeGreaterThan(0);
    });

    it('renders bandwidth as mirrored chart', () => {
      render(
        <MetricTrack {...defaultProps} metric="bandwidth" label="Bandwidth" />
      );

      const chart = screen.getByTestId('metric-chart');
      // Should have paths for both in and out
      expect(chart.querySelectorAll('path').length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('comparison nodes', () => {
    it('renders multiple node lines with different colors', () => {
      const compData = [
        { nodeId: 'comp-1', data: createMockData(24) },
        { nodeId: 'comp-2', data: createMockData(24) },
      ];
      render(
        <MetricTrack {...defaultProps} comparisonData={compData} />
      );

      const chart = screen.getByTestId('metric-chart');
      // Should have paths for primary + 2 comparison nodes
      expect(chart.querySelectorAll('path').length).toBeGreaterThanOrEqual(3);
    });

    it('uses distinct colors for each node', () => {
      const compData = [{ nodeId: 'comp-1', data: createMockData(24) }];
      render(<MetricTrack {...defaultProps} comparisonData={compData} />);

      const paths = screen.getByTestId('metric-chart').querySelectorAll('path');
      const colors = Array.from(paths).map((p) => p.getAttribute('stroke'));
      // All colors should be different
      const uniqueColors = new Set(colors.filter(Boolean));
      expect(uniqueColors.size).toBe(colors.filter(Boolean).length);
    });
  });

  describe('collapse behavior', () => {
    it('shows full height when not collapsed', () => {
      render(<MetricTrack {...defaultProps} collapsed={false} />);

      const track = screen.getByTestId('metric-track');
      expect(track.style.height).not.toBe('0px');
    });

    it('collapses to header only when collapsed', () => {
      render(<MetricTrack {...defaultProps} collapsed={true} />);

      const chart = screen.queryByTestId('metric-chart');
      expect(chart).not.toBeInTheDocument();
    });

    it('calls onToggleCollapse when header clicked', () => {
      const onToggle = vi.fn();
      render(<MetricTrack {...defaultProps} onToggleCollapse={onToggle} />);

      const header = screen.getByTestId('track-header');
      fireEvent.click(header);

      expect(onToggle).toHaveBeenCalled();
    });
  });

  describe('crosshair integration', () => {
    it('shows value at crosshair position', () => {
      render(
        <MetricTrack
          {...defaultProps}
          crosshairTimestamp={now - 12 * HOUR}
        />
      );

      // Should highlight the data point at crosshair
      expect(screen.getByTestId('crosshair-value')).toBeInTheDocument();
    });

    it('shows comparison values at crosshair', () => {
      const compData = [{ nodeId: 'comp-1', data: createMockData(24) }];
      render(
        <MetricTrack
          {...defaultProps}
          comparisonData={compData}
          crosshairTimestamp={now - 12 * HOUR}
        />
      );

      // Should show values for all nodes
      const values = screen.getAllByTestId('crosshair-value');
      expect(values.length).toBeGreaterThanOrEqual(2);
    });
  });
});
