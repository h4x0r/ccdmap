import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { ConcordiumNode } from '@/lib/transforms';

async function fetchNodes(): Promise<ConcordiumNode[]> {
  const response = await fetch('/api/nodes');
  if (!response.ok) {
    throw new Error(`Failed to fetch nodes: ${response.status}`);
  }
  return response.json();
}

export function useNodes() {
  return useQuery({
    queryKey: ['nodes'],
    queryFn: fetchNodes,
    refetchInterval: 30_000, // 30 seconds
    staleTime: 10_000, // Consider fresh for 10s
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
  });
}

export interface NetworkMetrics {
  totalNodes: number;
  avgPeers: number;
  maxFinalizationLag: number;  // blocks behind (sync health)
  consensusParticipation: number;
  avgLatency: number;  // ms, from averagePing
}

export function useNetworkMetrics() {
  const { data: nodes, isLoading, isError, dataUpdatedAt } = useNodes();

  const metrics = useMemo<NetworkMetrics | null>(() => {
    if (!nodes || nodes.length === 0) return null;

    const totalNodes = nodes.length;

    // Average peer count
    const totalPeers = nodes.reduce((sum, node) => sum + node.peersCount, 0);
    const avgPeers = Math.round(totalPeers / totalNodes);

    // Finalization lag (max blocks behind the highest)
    const heights = nodes.map((n) => n.finalizedBlockHeight);
    const maxHeight = Math.max(...heights);
    const minHeight = Math.min(...heights);
    const maxFinalizationLag = maxHeight - minHeight;

    // Consensus participation (% of nodes with consensus running)
    const consensusNodes = nodes.filter((n) => n.consensusRunning);
    const consensusParticipation = Math.round((consensusNodes.length / totalNodes) * 100);

    // Average latency from nodes with ping data
    const nodesWithPing = nodes.filter((n) => n.averagePing !== null && n.averagePing > 0);
    const avgLatency = nodesWithPing.length > 0
      ? Math.round(nodesWithPing.reduce((sum, n) => sum + (n.averagePing ?? 0), 0) / nodesWithPing.length)
      : 50; // default fallback

    return {
      totalNodes,
      avgPeers,
      maxFinalizationLag,
      consensusParticipation,
      avgLatency,
    };
  }, [nodes]);

  return {
    metrics,
    isLoading,
    isError,
    dataUpdatedAt,
  };
}
