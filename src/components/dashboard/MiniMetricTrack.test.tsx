import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MiniMetricTrack, type MiniMetricTrackProps } from './MiniMetricTrack';

describe('MiniMetricTrack', () => {
  const mockLatencyData = [
    { timestamp: 1000, value: 50 },
    { timestamp: 2000, value: 75 },
    { timestamp: 3000, value: 60 },
  ];

  const mockHealthData = [
    { timestamp: 1000, status: 'healthy' as const },
    { timestamp: 2000, status: 'lagging' as const },
    { timestamp: 3000, status: 'healthy' as const },
  ];

  const mockBandwidthData = {
    inbound: [
      { timestamp: 1000, value: 100 },
      { timestamp: 2000, value: 150 },
    ],
    outbound: [
      { timestamp: 1000, value: 80 },
      { timestamp: 2000, value: 90 },
    ],
  };

  describe('rendering', () => {
    it('renders with uppercase label', () => {
      render(
        <MiniMetricTrack
          label="Latency"
          metric="latency"
          data={mockLatencyData}
        />
      );

      expect(screen.getByText('LATENCY')).toBeInTheDocument();
    });

    it('renders SVG chart', () => {
      render(
        <MiniMetricTrack
          label="Latency"
          metric="latency"
          data={mockLatencyData}
        />
      );

      expect(screen.getByTestId('mini-metric-chart')).toBeInTheDocument();
    });

    it('shows summary value', () => {
      render(
        <MiniMetricTrack
          label="Latency"
          metric="latency"
          data={mockLatencyData}
        />
      );

      // Should show some summary (current or avg)
      const header = screen.getByTestId('mini-track-header');
      expect(header.textContent).toMatch(/\d+/);
    });
  });

  describe('collapse behavior', () => {
    it('shows collapse icon', () => {
      render(
        <MiniMetricTrack
          label="Latency"
          metric="latency"
          data={mockLatencyData}
          collapsible
        />
      );

      expect(screen.getByText('▼')).toBeInTheDocument();
    });

    it('toggles collapse on header click', () => {
      render(
        <MiniMetricTrack
          label="Latency"
          metric="latency"
          data={mockLatencyData}
          collapsible
        />
      );

      const header = screen.getByTestId('mini-track-header');
      fireEvent.click(header);

      expect(screen.getByText('▶')).toBeInTheDocument();
      expect(screen.queryByTestId('mini-metric-chart')).not.toBeInTheDocument();
    });
  });

  describe('metric types', () => {
    it('renders latency as line chart', () => {
      render(
        <MiniMetricTrack
          label="Latency"
          metric="latency"
          data={mockLatencyData}
        />
      );

      const chart = screen.getByTestId('mini-metric-chart');
      expect(chart.querySelector('path')).toBeInTheDocument();
    });

    it('renders health as segmented bar', () => {
      render(
        <MiniMetricTrack
          label="Health"
          metric="health"
          healthData={mockHealthData}
        />
      );

      const chart = screen.getByTestId('mini-metric-chart');
      expect(chart.querySelectorAll('rect').length).toBeGreaterThan(0);
    });

    it('renders bandwidth as mirrored bar chart', () => {
      render(
        <MiniMetricTrack
          label="Bandwidth"
          metric="bandwidth"
          bandwidthData={mockBandwidthData}
        />
      );

      const chart = screen.getByTestId('mini-metric-chart');
      // Should have rect bars for both in and out
      expect(chart.querySelectorAll('rect').length).toBeGreaterThanOrEqual(2);
    });

    it('renders peers as step chart', () => {
      render(
        <MiniMetricTrack
          label="Peers"
          metric="peers"
          data={mockLatencyData}
        />
      );

      const chart = screen.getByTestId('mini-metric-chart');
      expect(chart.querySelector('path')).toBeInTheDocument();
    });
  });
});
