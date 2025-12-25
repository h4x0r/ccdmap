import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { useDeepDiveData, type NodeHistoryPoint } from './useDeepDiveData';
import type { TimeRange } from '@/lib/timeline';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const now = Date.now();

function createMockHistoryPoint(
  overrides: Partial<NodeHistoryPoint> = {}
): NodeHistoryPoint {
  return {
    timestamp: now - HOUR,
    healthStatus: 'healthy',
    peersCount: 5,
    avgPing: 50,
    finalizedHeight: 1000,
    heightDelta: 0,
    bytesIn: 1000,
    bytesOut: 800,
    ...overrides,
  };
}

function createMockApiResponse(nodeId: string, points: NodeHistoryPoint[]) {
  return {
    success: true,
    nodeId,
    timeRange: { since: now - DAY, until: now },
    dataPoints: points.length,
    history: points.map((p) => ({
      timestamp: p.timestamp,
      timestampISO: new Date(p.timestamp).toISOString(),
      healthStatus: p.healthStatus,
      peersCount: p.peersCount,
      avgPing: p.avgPing,
      finalizedHeight: p.finalizedHeight,
      heightDelta: p.heightDelta,
      bytesIn: p.bytesIn,
      bytesOut: p.bytesOut,
    })),
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

describe('useDeepDiveData', () => {
  const defaultTimeRange: TimeRange = {
    start: now - DAY,
    end: now,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('primary node data', () => {
    it('fetches history for primary node', async () => {
      const mockPoints = [
        createMockHistoryPoint({ timestamp: now - 2 * HOUR }),
        createMockHistoryPoint({ timestamp: now - HOUR }),
        createMockHistoryPoint({ timestamp: now }),
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockApiResponse('node-1', mockPoints)),
      });

      const { result } = renderHook(
        () => useDeepDiveData('node-1', defaultTimeRange),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.primaryData).toHaveLength(3);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tracking/node-history?nodeId=node-1')
      );
    });

    it('includes time range in API request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockApiResponse('node-1', [])),
      });

      renderHook(() => useDeepDiveData('node-1', defaultTimeRange), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain(`since=${defaultTimeRange.start}`);
      expect(url).toContain(`until=${defaultTimeRange.end}`);
    });
  });

  describe('comparison nodes', () => {
    it('fetches data for comparison nodes', async () => {
      const primaryData = [createMockHistoryPoint()];
      const compNode1Data = [
        createMockHistoryPoint({ peersCount: 10 }),
      ];
      const compNode2Data = [
        createMockHistoryPoint({ peersCount: 15 }),
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve(createMockApiResponse('primary', primaryData)),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve(createMockApiResponse('comp-1', compNode1Data)),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve(createMockApiResponse('comp-2', compNode2Data)),
        });

      const { result } = renderHook(
        () =>
          useDeepDiveData('primary', defaultTimeRange, ['comp-1', 'comp-2']),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.comparisonData).toHaveLength(2);
      });

      expect(result.current.comparisonData[0].nodeId).toBe('comp-1');
      expect(result.current.comparisonData[1].nodeId).toBe('comp-2');
    });

    it('limits comparison nodes to 2', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createMockApiResponse('node', [])),
      });

      const { result } = renderHook(
        () =>
          useDeepDiveData('primary', defaultTimeRange, [
            'comp-1',
            'comp-2',
            'comp-3',
          ]),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should only have 2 comparison nodes max
      expect(result.current.comparisonData.length).toBeLessThanOrEqual(2);
    });
  });

  describe('addComparisonNode', () => {
    it('adds a comparison node', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createMockApiResponse('node', [])),
      });

      const { result } = renderHook(
        () => useDeepDiveData('primary', defaultTimeRange),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.addComparisonNode('new-comp');
      });

      expect(result.current.comparisonNodeIds).toContain('new-comp');
    });

    it('does not add duplicate comparison nodes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createMockApiResponse('node', [])),
      });

      const { result } = renderHook(
        () => useDeepDiveData('primary', defaultTimeRange, ['comp-1']),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.addComparisonNode('comp-1');
      });

      expect(
        result.current.comparisonNodeIds.filter((id) => id === 'comp-1').length
      ).toBe(1);
    });

    it('does not add primary node as comparison', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createMockApiResponse('node', [])),
      });

      const { result } = renderHook(
        () => useDeepDiveData('primary', defaultTimeRange),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.addComparisonNode('primary');
      });

      expect(result.current.comparisonNodeIds).not.toContain('primary');
    });
  });

  describe('removeComparisonNode', () => {
    it('removes a comparison node', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createMockApiResponse('node', [])),
      });

      const { result } = renderHook(
        () => useDeepDiveData('primary', defaultTimeRange, ['comp-1', 'comp-2']),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.removeComparisonNode('comp-1');
      });

      expect(result.current.comparisonNodeIds).not.toContain('comp-1');
      expect(result.current.comparisonNodeIds).toContain('comp-2');
    });
  });

  describe('error handling', () => {
    it('handles API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const { result } = renderHook(
        () => useDeepDiveData('node-1', defaultTimeRange),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.primaryData).toEqual([]);
    });
  });

  describe('data transformation', () => {
    it('provides aligned data for all nodes', async () => {
      const timestamp1 = now - 2 * HOUR;
      const timestamp2 = now - HOUR;

      const primaryData = [
        createMockHistoryPoint({ timestamp: timestamp1, peersCount: 5 }),
        createMockHistoryPoint({ timestamp: timestamp2, peersCount: 6 }),
      ];
      const compData = [
        createMockHistoryPoint({ timestamp: timestamp1, peersCount: 10 }),
        createMockHistoryPoint({ timestamp: timestamp2, peersCount: 12 }),
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve(createMockApiResponse('primary', primaryData)),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve(createMockApiResponse('comp-1', compData)),
        });

      const { result } = renderHook(
        () => useDeepDiveData('primary', defaultTimeRange, ['comp-1']),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.comparisonData).toHaveLength(1);
      });

      // Both nodes should have data at same timestamps
      expect(result.current.primaryData.map((d) => d.timestamp)).toEqual(
        result.current.comparisonData[0].data.map((d) => d.timestamp)
      );
    });
  });
});
