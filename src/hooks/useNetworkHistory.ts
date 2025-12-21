'use client';

import { useQuery } from '@tanstack/react-query';
import type { MRTGDataPoint } from '@/components/dashboard/MRTGChart';

interface NetworkHistoryDataPoint {
  timestamp: number;
  timestampISO: string;
  totalNodes: number;
  healthyNodes: number;
  laggingNodes: number;
  issueNodes: number;
  avgPeers: number | null;
  avgLatency: number | null;
  maxFinalizationLag: number | null;
  consensusParticipation: number | null;
  pulseScore: number | null;
}

interface NetworkHistoryResponse {
  success: boolean;
  timeRange: {
    since: number;
    until: number;
    sinceISO: string;
    untilISO: string;
  };
  dataPoints: number;
  history: NetworkHistoryDataPoint[];
}

export interface NetworkHistoryData {
  pulseHistory: MRTGDataPoint[];
  nodesHistory: MRTGDataPoint[];
  finalizationLagHistory: MRTGDataPoint[];
  latencyHistory: MRTGDataPoint[];
  consensusHistory: MRTGDataPoint[];
  peersHistory: MRTGDataPoint[];
}

async function fetchNetworkHistory(minutes: number = 15): Promise<NetworkHistoryResponse> {
  const now = Date.now();
  const since = now - minutes * 60 * 1000;

  const response = await fetch(
    `/api/tracking/network-history?since=${since}&until=${now}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch network history: ${response.status}`);
  }

  return response.json();
}

function transformHistory(response: NetworkHistoryResponse): NetworkHistoryData {
  const { history } = response;

  const pulseHistory: MRTGDataPoint[] = history
    .filter(h => h.pulseScore !== null)
    .map(h => ({
      timestamp: h.timestamp,
      value: h.pulseScore!,
    }));

  const nodesHistory: MRTGDataPoint[] = history.map(h => ({
    timestamp: h.timestamp,
    value: h.totalNodes,
  }));

  const finalizationLagHistory: MRTGDataPoint[] = history
    .filter(h => h.maxFinalizationLag !== null)
    .map(h => ({
      timestamp: h.timestamp,
      value: h.maxFinalizationLag!,
    }));

  const latencyHistory: MRTGDataPoint[] = history
    .filter(h => h.avgLatency !== null)
    .map(h => ({
      timestamp: h.timestamp,
      value: h.avgLatency!,
    }));

  const consensusHistory: MRTGDataPoint[] = history
    .filter(h => h.consensusParticipation !== null)
    .map(h => ({
      timestamp: h.timestamp,
      value: h.consensusParticipation!,
    }));

  const peersHistory: MRTGDataPoint[] = history
    .filter(h => h.avgPeers !== null)
    .map(h => ({
      timestamp: h.timestamp,
      value: h.avgPeers!,
    }));

  return {
    pulseHistory,
    nodesHistory,
    finalizationLagHistory,
    latencyHistory,
    consensusHistory,
    peersHistory,
  };
}

/**
 * Hook to fetch network-wide historical metrics from Turso
 * @param minutes - Number of minutes of history to fetch (default: 15)
 */
export function useNetworkHistory(minutes: number = 15) {
  const query = useQuery({
    queryKey: ['networkHistory', minutes],
    queryFn: () => fetchNetworkHistory(minutes),
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  const data = query.data ? transformHistory(query.data) : null;

  return {
    data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    dataPoints: query.data?.dataPoints ?? 0,
  };
}
