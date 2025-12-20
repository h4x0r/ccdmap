import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LcarsPanel } from './LcarsPanel';

describe('LcarsPanel', () => {
  it('renders children content', () => {
    render(
      <LcarsPanel title="Test Panel">
        <span data-testid="child">Hello World</span>
      </LcarsPanel>
    );
    expect(screen.getByTestId('child')).toHaveTextContent('Hello World');
  });

  it('displays the title', () => {
    render(<LcarsPanel title="Network Status">Content</LcarsPanel>);
    expect(screen.getByText('Network Status')).toBeInTheDocument();
  });

  it('applies accent color class', () => {
    render(
      <LcarsPanel title="Test" accent="amber">
        Content
      </LcarsPanel>
    );
    const panel = screen.getByTestId('lcars-panel');
    expect(panel).toHaveClass('accent-amber');
  });

  it('shows status indicator when provided', () => {
    render(
      <LcarsPanel title="Test" status="nominal">
        Content
      </LcarsPanel>
    );
    expect(screen.getByTestId('status-indicator')).toBeInTheDocument();
    expect(screen.getByText('NOMINAL')).toBeInTheDocument();
  });

  it('applies correct status color', () => {
    render(
      <LcarsPanel title="Test" status="critical">
        Content
      </LcarsPanel>
    );
    const indicator = screen.getByTestId('status-indicator');
    expect(indicator).toHaveClass('status-critical');
  });

  it('applies custom className', () => {
    render(
      <LcarsPanel title="Test" className="custom-class">
        Content
      </LcarsPanel>
    );
    const panel = screen.getByTestId('lcars-panel');
    expect(panel).toHaveClass('custom-class');
  });

  it('renders without status indicator when not provided', () => {
    render(<LcarsPanel title="Test">Content</LcarsPanel>);
    expect(screen.queryByTestId('status-indicator')).not.toBeInTheDocument();
  });

  it('defaults to cyan accent', () => {
    render(<LcarsPanel title="Test">Content</LcarsPanel>);
    const panel = screen.getByTestId('lcars-panel');
    expect(panel).toHaveClass('accent-cyan');
  });
});
