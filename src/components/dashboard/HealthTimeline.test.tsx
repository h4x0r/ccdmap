import { render, screen } from '@testing-library/react';
import { HealthTimeline, type HealthStatus } from './HealthTimeline';

describe('HealthTimeline', () => {
  const mockData: HealthStatus[] = [
    { timestamp: 1000, status: 'healthy' },
    { timestamp: 2000, status: 'healthy' },
    { timestamp: 3000, status: 'lagging' },
    { timestamp: 4000, status: 'healthy' },
    { timestamp: 5000, status: 'issue' },
  ];

  it('renders the timeline container', () => {
    const { container } = render(<HealthTimeline data={mockData} />);
    expect(container.querySelector('.health-timeline')).toBeInTheDocument();
  });

  it('renders correct number of segments', () => {
    const { container } = render(<HealthTimeline data={mockData} />);
    const segments = container.querySelectorAll('.health-segment');
    expect(segments.length).toBe(5);
  });

  it('applies correct color classes based on status', () => {
    const { container } = render(<HealthTimeline data={mockData} />);
    const segments = container.querySelectorAll('.health-segment');

    // First two should be healthy (green)
    expect(segments[0]).toHaveClass('healthy');
    expect(segments[1]).toHaveClass('healthy');
    // Third should be lagging (amber)
    expect(segments[2]).toHaveClass('lagging');
    // Fourth should be healthy
    expect(segments[3]).toHaveClass('healthy');
    // Fifth should be issue (red)
    expect(segments[4]).toHaveClass('issue');
  });

  it('handles empty data gracefully', () => {
    const { container } = render(<HealthTimeline data={[]} />);
    expect(container.querySelector('.health-timeline')).toBeInTheDocument();
    expect(container.querySelectorAll('.health-segment').length).toBe(0);
  });

  it('shows time labels when showLabels is true', () => {
    // Use realistic timestamps with 5-minute intervals
    const now = Date.now();
    const realisticData: HealthStatus[] = [
      { timestamp: now - 20 * 60000, status: 'healthy' },  // -20 min
      { timestamp: now - 15 * 60000, status: 'healthy' },  // -15 min
      { timestamp: now - 10 * 60000, status: 'lagging' },  // -10 min
      { timestamp: now - 5 * 60000, status: 'healthy' },   // -5 min
      { timestamp: now, status: 'issue' },                  // now
    ];
    render(<HealthTimeline data={realisticData} showLabels />);
    // Should have labels for each segment showing minutes ago
    expect(screen.getByText(/now/i)).toBeInTheDocument();
    // Should have labels showing minutes ago (could be -5, -10, -15, -20)
    expect(screen.getByText(/-5/)).toBeInTheDocument();
  });
});
