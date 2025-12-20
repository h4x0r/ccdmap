import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CommandHeader } from './CommandHeader';
import type { MetricSnapshot } from '../../hooks/useMetricHistory';

describe('CommandHeader', () => {
  const mockMetrics: MetricSnapshot = {
    timestamp: Date.now(),
    nodes: 157,
    finalizationTime: 2.5,
    latency: 45,
    packets: 1200000,
    consensus: 98,
    pulse: 94,
  };

  const mockHistory: MetricSnapshot[] = [
    { ...mockMetrics, pulse: 92 },
    { ...mockMetrics, pulse: 93 },
    { ...mockMetrics, pulse: 94 },
  ];

  it('renders the header container', () => {
    render(<CommandHeader metrics={mockMetrics} history={mockHistory} />);
    expect(screen.getByTestId('command-header')).toBeInTheDocument();
  });

  it('displays network pulse', () => {
    render(<CommandHeader metrics={mockMetrics} history={mockHistory} />);
    expect(screen.getByTestId('network-pulse')).toBeInTheDocument();
  });

  it('displays node count', () => {
    render(<CommandHeader metrics={mockMetrics} history={mockHistory} />);
    expect(screen.getByText('157')).toBeInTheDocument();
  });

  it('displays finalization time', () => {
    render(<CommandHeader metrics={mockMetrics} history={mockHistory} />);
    expect(screen.getByText('2.5s')).toBeInTheDocument();
  });

  it('displays latency', () => {
    render(<CommandHeader metrics={mockMetrics} history={mockHistory} />);
    expect(screen.getByText('45ms')).toBeInTheDocument();
  });

  it('displays consensus percentage', () => {
    render(<CommandHeader metrics={mockMetrics} history={mockHistory} />);
    expect(screen.getByText('98%')).toBeInTheDocument();
  });

  it('displays packets formatted with K suffix', () => {
    render(<CommandHeader metrics={mockMetrics} history={mockHistory} />);
    expect(screen.getByText('1.2M')).toBeInTheDocument();
  });

  it('renders LCARS panels for metrics', () => {
    render(<CommandHeader metrics={mockMetrics} history={mockHistory} />);
    const panels = screen.getAllByTestId('lcars-panel');
    expect(panels.length).toBeGreaterThan(0);
  });

  it('renders sparklines for each metric', () => {
    render(<CommandHeader metrics={mockMetrics} history={mockHistory} />);
    const sparklines = screen.getAllByTestId('sparkline');
    expect(sparklines.length).toBeGreaterThan(0);
  });

  it('shows logo or title', () => {
    render(<CommandHeader metrics={mockMetrics} history={mockHistory} />);
    // Should have either logo SVG or title text
    const header = screen.getByTestId('command-header');
    expect(header.querySelector('.header-logo, .header-title')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <CommandHeader
        metrics={mockMetrics}
        history={mockHistory}
        className="custom-header"
      />
    );
    expect(screen.getByTestId('command-header')).toHaveClass('custom-header');
  });
});
