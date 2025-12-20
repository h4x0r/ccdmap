import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NetworkPulse } from './NetworkPulse';

describe('NetworkPulse', () => {
  it('displays the pulse score', () => {
    render(<NetworkPulse pulse={94} status="nominal" />);
    expect(screen.getByTestId('pulse-score')).toHaveTextContent('94');
  });

  it('displays status label', () => {
    render(<NetworkPulse pulse={94} status="nominal" />);
    expect(screen.getByTestId('status-label')).toHaveTextContent('NOMINAL');
  });

  it('applies correct status color class', () => {
    render(<NetworkPulse pulse={94} status="nominal" />);
    const indicator = screen.getByTestId('pulse-indicator');
    expect(indicator).toHaveClass('status-nominal');
  });

  it('shows elevated status correctly', () => {
    render(<NetworkPulse pulse={85} status="elevated" />);
    expect(screen.getByTestId('status-label')).toHaveTextContent('ELEVATED');
    expect(screen.getByTestId('pulse-indicator')).toHaveClass('status-elevated');
  });

  it('shows degraded status correctly', () => {
    render(<NetworkPulse pulse={70} status="degraded" />);
    expect(screen.getByTestId('status-label')).toHaveTextContent('DEGRADED');
    expect(screen.getByTestId('pulse-indicator')).toHaveClass('status-degraded');
  });

  it('shows critical status correctly', () => {
    render(<NetworkPulse pulse={45} status="critical" />);
    expect(screen.getByTestId('status-label')).toHaveTextContent('CRITICAL');
    expect(screen.getByTestId('pulse-indicator')).toHaveClass('status-critical');
  });

  it('renders sparkline when history provided', () => {
    const history = [90, 92, 94, 93, 94];
    render(<NetworkPulse pulse={94} status="nominal" history={history} />);
    expect(screen.getByTestId('sparkline')).toBeInTheDocument();
  });

  it('does not render sparkline when history empty', () => {
    render(<NetworkPulse pulse={94} status="nominal" history={[]} />);
    expect(screen.queryByTestId('sparkline')).not.toBeInTheDocument();
  });

  it('renders without history prop', () => {
    render(<NetworkPulse pulse={94} status="nominal" />);
    expect(screen.queryByTestId('sparkline')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<NetworkPulse pulse={94} status="nominal" className="custom-class" />);
    const container = screen.getByTestId('network-pulse');
    expect(container).toHaveClass('custom-class');
  });

  it('displays percentage symbol', () => {
    render(<NetworkPulse pulse={94} status="nominal" />);
    expect(screen.getByTestId('pulse-score')).toHaveTextContent('%');
  });
});
