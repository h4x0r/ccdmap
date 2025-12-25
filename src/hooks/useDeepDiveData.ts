'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import type { TimeRange } from '@/lib/timeline';
import type { HealthStatus } from '@/lib/db/schema';

export interface NodeHistoryPoint {
  timestamp: number;
  healthStatus: HealthStatus;
  peersCount: number | null;
  avgPing: number | null;
  finalizedHeight: number | null;
  heightDelta: number | null;
  bytesIn: number | null;
  bytesOut: number | null;
}

export interface ComparisonNodeData {
  nodeId: string;
  data: NodeHistoryPoint[];
}

interface ApiHistoryResponse {
  success: boolean;
  nodeId: string;
  timeRange: {
    since: number;
    until: number;
  };
  dataPoints: number;
  history: Array<{
    timestamp: number;
    timestampISO: string;
    healthStatus: HealthStatus;
    peersCount: number | null;
    avgPing: number | null;
    finalizedHeight: number | null;
    heightDelta: number | null;
    bytesIn: number | null;
    bytesOut: number | null;
  }>;
}

const MAX_COMPARISON_NODES = 2;

async function fetchNodeHistory(
  nodeId: string,
  timeRange: TimeRange
): Promise<NodeHistoryPoint[]> {
  const url = `/api/tracking/node-history?nodeId=${encodeURIComponent(
    nodeId
  )}&since=${timeRange.start}&until=${timeRange.end}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch history for ${nodeId}: ${response.status}`);
  }

  const data: ApiHistoryResponse = await response.json();
  return data.history.map((h) => ({
    timestamp: h.timestamp,
    healthStatus: h.healthStatus,
    peersCount: h.peersCount,
    avgPing: h.avgPing,
    finalizedHeight: h.finalizedHeight,
    heightDelta: h.heightDelta,
    bytesIn: h.bytesIn,
    bytesOut: h.bytesOut,
  }));
}

export interface UseDeepDiveDataReturn {
  /** Historical data for the primary node */
  primaryData: NodeHistoryPoint[];
  /** Historical data for comparison nodes */
  comparisonData: ComparisonNodeData[];
  /** IDs of comparison nodes */
  comparisonNodeIds: string[];
  /** Whether any data is loading */
  isLoading: boolean;
  /** Whether there was an error */
  isError: boolean;
  /** Add a comparison node */
  addComparisonNode: (nodeId: string) => void;
  /** Remove a comparison node */
  removeComparisonNode: (nodeId: string) => void;
}

/**
 * Hook for fetching and managing deep dive historical data
 * Supports comparing up to 2 additional nodes against the primary node
 */
export function useDeepDiveData(
  primaryNodeId: string,
  timeRange: TimeRange,
  initialComparisonNodeIds: string[] = []
): UseDeepDiveDataReturn {
  const [comparisonNodeIds, setComparisonNodeIds] = useState<string[]>(
    () => initialComparisonNodeIds.slice(0, MAX_COMPARISON_NODES)
  );

  // Fetch primary node data
  const primaryQuery = useQuery({
    queryKey: ['node-history', primaryNodeId, timeRange.start, timeRange.end],
    queryFn: () => fetchNodeHistory(primaryNodeId, timeRange),
    staleTime: 60 * 1000, // 1 minute
  });

  // Fetch comparison node data
  const comparisonQueries = useQueries({
    queries: comparisonNodeIds.map((nodeId) => ({
      queryKey: ['node-history', nodeId, timeRange.start, timeRange.end],
      queryFn: () => fetchNodeHistory(nodeId, timeRange),
      staleTime: 60 * 1000,
      enabled: !!nodeId,
    })),
  });

  const addComparisonNode = useCallback((nodeId: string) => {
    setComparisonNodeIds((current) => {
      // Don't add if it's the primary node
      if (nodeId === primaryNodeId) return current;
      // Don't add duplicates
      if (current.includes(nodeId)) return current;
      // Limit to max comparison nodes
      if (current.length >= MAX_COMPARISON_NODES) return current;
      return [...current, nodeId];
    });
  }, [primaryNodeId]);

  const removeComparisonNode = useCallback((nodeId: string) => {
    setComparisonNodeIds((current) => current.filter((id) => id !== nodeId));
  }, []);

  const comparisonData = useMemo<ComparisonNodeData[]>(() => {
    return comparisonNodeIds
      .map((nodeId, index) => {
        const query = comparisonQueries[index];
        if (!query?.data) return null;
        return {
          nodeId,
          data: query.data,
        };
      })
      .filter((d): d is ComparisonNodeData => d !== null);
  }, [comparisonNodeIds, comparisonQueries]);

  const isLoading =
    primaryQuery.isLoading ||
    comparisonQueries.some((q) => q.isLoading);

  const isError =
    primaryQuery.isError ||
    comparisonQueries.some((q) => q.isError);

  return {
    primaryData: primaryQuery.data ?? [],
    comparisonData,
    comparisonNodeIds,
    isLoading,
    isError,
    addComparisonNode,
    removeComparisonNode,
  };
}
