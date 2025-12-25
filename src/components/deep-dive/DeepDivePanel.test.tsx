import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { DeepDivePanel } from './DeepDivePanel';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const now = Date.now();

function createMockApiResponse(nodeId: string, pointCount: number) {
  const history = Array.from({ length: pointCount }, (_, i) => ({
    timestamp: now - (pointCount - i) * HOUR,
    timestampISO: new Date(now - (pointCount - i) * HOUR).toISOString(),
    healthStatus: 'healthy',
    peersCount: 5 + i,
    avgPing: 40 + i * 2,
    finalizedHeight: 1000 + i,
    heightDelta: 0,
    bytesIn: 1000 + i * 100,
    bytesOut: 800 + i * 80,
  }));

  return {
    success: true,
    nodeId,
    timeRange: { since: now - DAY, until: now },
    dataPoints: history.length,
    history,
  };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('DeepDivePanel', () => {
  const defaultProps = {
    nodeId: 'test-node-123',
    nodeName: 'BAKERMAN',
    isOpen: true,
    onClose: vi.fn(),
    onAddComparisonNode: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(createMockApiResponse('test-node-123', 24)),
    });
  });

  describe('panel structure', () => {
    it('renders when open', async () => {
      render(<DeepDivePanel {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId('deep-dive-panel')).toBeInTheDocument();
      });
    });

    it('does not render when closed', () => {
      render(<DeepDivePanel {...defaultProps} isOpen={false} />, {
        wrapper: createWrapper(),
      });

      expect(screen.queryByTestId('deep-dive-panel')).not.toBeInTheDocument();
    });

    it('shows node name in header', async () => {
      render(<DeepDivePanel {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('BAKERMAN')).toBeInTheDocument();
      });
    });

    it('shows close button', async () => {
      render(<DeepDivePanel {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
      });
    });

    it('calls onClose when close button clicked', async () => {
      const onClose = vi.fn();
      render(<DeepDivePanel {...defaultProps} onClose={onClose} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        const closeButton = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeButton);
      });

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('time range controls', () => {
    it('renders preset buttons', async () => {
      render(<DeepDivePanel {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('1h')).toBeInTheDocument();
        expect(screen.getByText('6h')).toBeInTheDocument();
        expect(screen.getByText('24h')).toBeInTheDocument();
        expect(screen.getByText('7d')).toBeInTheDocument();
        expect(screen.getByText('30d')).toBeInTheDocument();
      });
    });

    it('changes time range when preset clicked', async () => {
      render(<DeepDivePanel {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        const button7d = screen.getByText('7d');
        fireEvent.click(button7d);
      });

      // Should have active state
      expect(screen.getByText('7d').closest('button')).toHaveAttribute(
        'data-active',
        'true'
      );
    });
  });

  describe('timeline ruler', () => {
    it('renders timeline ruler', async () => {
      render(<DeepDivePanel {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId('timeline-ruler')).toBeInTheDocument();
      });
    });
  });

  describe('metric tracks', () => {
    it('renders health track', async () => {
      render(<DeepDivePanel {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('HEALTH')).toBeInTheDocument();
      });
    });

    it('renders latency track', async () => {
      render(<DeepDivePanel {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('LATENCY')).toBeInTheDocument();
      });
    });

    it('renders bandwidth track', async () => {
      render(<DeepDivePanel {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('BANDWIDTH')).toBeInTheDocument();
      });
    });

    it('renders peers track', async () => {
      render(<DeepDivePanel {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('PEERS')).toBeInTheDocument();
      });
    });
  });

  describe('comparison nodes', () => {
    it('shows add comparison button', async () => {
      render(<DeepDivePanel {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /add.*node|compare/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe('loading state', () => {
    it('shows loading indicator while fetching', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<DeepDivePanel {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });
  });
});
