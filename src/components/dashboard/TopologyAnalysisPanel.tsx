'use client';

import { useMemo, useCallback } from 'react';
import { useNodes } from '@/hooks/useNodes';
import { LcarsPanel } from './LcarsPanel';
import {
  buildAdjacencyList,
  getNetworkSummary,
  calculateBetweennessCentrality,
  identifyBottlenecks,
  identifyBridges,
  calculateDegreeDistribution,
  exportToGraphML,
  type GraphNode,
  type GraphEdge,
} from '@/lib/topology-analysis';
import type { ConcordiumNode } from '@/lib/transforms';

interface MetricRowProps {
  label: string;
  value: string | number;
  highlight?: boolean;
  warning?: boolean;
}

function MetricRow({ label, value, highlight, warning }: MetricRowProps) {
  return (
    <div className="flex justify-between py-1.5 text-sm font-mono border-b border-[var(--bb-gray)]/30 last:border-0">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span
        className={`font-medium ${
          warning
            ? 'text-[var(--bb-amber)]'
            : highlight
              ? 'text-[var(--bb-cyan)]'
              : 'text-foreground'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function DegreeDistributionChart({
  distribution,
}: {
  distribution: Map<number, number>;
}) {
  const sorted = Array.from(distribution.entries()).sort((a, b) => a[0] - b[0]);
  const maxCount = Math.max(...sorted.map(([, count]) => count));

  return (
    <div className="space-y-1 mt-2">
      <div className="text-[10px] font-mono text-muted-foreground mb-1">
        DEGREE DISTRIBUTION
      </div>
      <div className="flex items-end gap-0.5 h-12">
        {sorted.map(([degree, count]) => (
          <div key={degree} className="flex flex-col items-center flex-1">
            <div
              className="w-full bg-[var(--bb-cyan)]/60 rounded-t"
              style={{ height: `${(count / maxCount) * 100}%` }}
              title={`Degree ${degree}: ${count} nodes`}
            />
            <span className="text-[8px] text-muted-foreground mt-0.5">
              {degree}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BottleneckList({
  bottlenecks,
  nodes,
}: {
  bottlenecks: string[];
  nodes: ConcordiumNode[];
}) {
  const nodeMap = useMemo(() => {
    const map = new Map<string, ConcordiumNode>();
    for (const node of nodes) {
      map.set(node.nodeId, node);
    }
    return map;
  }, [nodes]);

  return (
    <div className="space-y-1 mt-2">
      <div className="text-[10px] font-mono text-muted-foreground mb-1">
        CRITICAL BOTTLENECKS
      </div>
      {bottlenecks.length === 0 ? (
        <div className="text-xs text-muted-foreground italic">
          No bottlenecks detected
        </div>
      ) : (
        <div className="space-y-1">
          {bottlenecks.map((nodeId) => {
            const node = nodeMap.get(nodeId);
            return (
              <div
                key={nodeId}
                className="flex items-center gap-2 px-2 py-1 bg-[var(--bb-amber)]/10 rounded border border-[var(--bb-amber)]/30"
              >
                <span className="h-2 w-2 rounded-full bg-[var(--bb-amber)]" />
                <span className="text-xs font-mono truncate flex-1">
                  {node?.nodeName || nodeId.slice(0, 12)}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {node?.peersCount ?? '?'} peers
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BridgesList({ bridges }: { bridges: [string, string][] }) {
  return (
    <div className="space-y-1 mt-2">
      <div className="text-[10px] font-mono text-muted-foreground mb-1">
        BRIDGE EDGES ({bridges.length})
      </div>
      {bridges.length === 0 ? (
        <div className="text-xs text-muted-foreground italic">
          No bridge edges - network is resilient
        </div>
      ) : (
        <div className="space-y-1 max-h-20 overflow-y-auto">
          {bridges.slice(0, 5).map(([a, b], i) => (
            <div
              key={i}
              className="flex items-center gap-1 px-2 py-0.5 bg-[var(--bb-red)]/10 rounded border border-[var(--bb-red)]/30 text-xs font-mono"
            >
              <span className="truncate">{a.slice(0, 8)}</span>
              <span className="text-[var(--bb-red)]">⟷</span>
              <span className="truncate">{b.slice(0, 8)}</span>
            </div>
          ))}
          {bridges.length > 5 && (
            <div className="text-[10px] text-muted-foreground">
              +{bridges.length - 5} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TopologyAnalysisPanel() {
  const { data: nodes } = useNodes();

  const analysis = useMemo(() => {
    if (!nodes || nodes.length === 0) return null;

    // Convert to graph format
    const graphNodes: GraphNode[] = nodes.map((n) => ({ id: n.nodeId }));
    const graphEdges: GraphEdge[] = [];
    const nodeIds = new Set(nodes.map((n) => n.nodeId));

    for (const node of nodes) {
      for (const peerId of node.peersList) {
        if (nodeIds.has(peerId)) {
          // Canonical edge (avoid duplicates)
          const [a, b] = [node.nodeId, peerId].sort();
          const edgeId = `${a}-${b}`;
          if (!graphEdges.some((e) => `${e.source}-${e.target}` === edgeId)) {
            graphEdges.push({ source: a, target: b });
          }
        }
      }
    }

    const adj = buildAdjacencyList(graphNodes, graphEdges);
    const summary = getNetworkSummary(adj);
    const distribution = calculateDegreeDistribution(adj);
    const bottlenecks = identifyBottlenecks(adj, 5);
    const bridges = identifyBridges(adj);

    return {
      summary,
      distribution,
      bottlenecks,
      bridges,
      graphNodes,
      graphEdges,
    };
  }, [nodes]);

  const handleExportGraphML = useCallback(() => {
    if (!nodes || !analysis) return;

    // Create enriched nodes with metadata
    const enrichedNodes = nodes.map((n) => ({
      id: n.nodeId,
      label: n.nodeName || n.nodeId.slice(0, 12),
      peersCount: n.peersCount,
      client: n.client,
      isBaker:
        n.bakingCommitteeMember === 'ActiveInCommittee' &&
        n.consensusBakerId !== null,
      finalizedBlockHeight: n.finalizedBlockHeight,
    }));

    const graphml = exportToGraphML(enrichedNodes, analysis.graphEdges);
    const blob = new Blob([graphml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `concordium-topology-${new Date().toISOString().slice(0, 10)}.graphml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [nodes, analysis]);

  if (!analysis) {
    return (
      <LcarsPanel title="TOPOLOGY ANALYSIS" accent="cyan">
        <div className="text-sm text-muted-foreground p-4">
          Loading network data...
        </div>
      </LcarsPanel>
    );
  }

  const { summary, distribution, bottlenecks, bridges } = analysis;

  // Determine network health status
  const getStatus = () => {
    if (!summary.isConnected) return 'critical' as const;
    if (bridges.length > 0) return 'elevated' as const;
    if (summary.globalClusteringCoefficient < 0.3) return 'degraded' as const;
    return 'nominal' as const;
  };

  return (
    <LcarsPanel title="TOPOLOGY ANALYSIS" accent="cyan" status={getStatus()}>
      <div className="space-y-3 p-2">
        {/* Network Summary */}
        <div>
          <MetricRow
            label="Nodes"
            value={summary.nodeCount}
            highlight
          />
          <MetricRow
            label="Edges"
            value={summary.edgeCount}
          />
          <MetricRow
            label="Avg Degree"
            value={summary.avgDegree.toFixed(1)}
          />
          <MetricRow
            label="Max Degree"
            value={summary.maxDegree}
            highlight
          />
          <MetricRow
            label="Network Diameter"
            value={summary.diameter === Infinity ? '∞ (disconnected)' : summary.diameter}
            warning={summary.diameter === Infinity}
          />
          <MetricRow
            label="Clustering Coeff"
            value={summary.globalClusteringCoefficient.toFixed(3)}
            warning={summary.globalClusteringCoefficient < 0.3}
          />
          <MetricRow
            label="Connected"
            value={summary.isConnected ? 'YES' : 'NO'}
            warning={!summary.isConnected}
          />
        </div>

        {/* Degree Distribution Chart */}
        <DegreeDistributionChart distribution={distribution} />

        {/* Bottlenecks */}
        <BottleneckList bottlenecks={bottlenecks} nodes={nodes ?? []} />

        {/* Bridge Edges */}
        <BridgesList bridges={bridges} />

        {/* Export Button */}
        <button
          onClick={handleExportGraphML}
          className="w-full mt-2 px-3 py-2 text-xs font-mono uppercase bg-[var(--bb-cyan)]/20 hover:bg-[var(--bb-cyan)]/30 border border-[var(--bb-cyan)]/50 rounded transition-colors"
        >
          Export GraphML
        </button>
      </div>
    </LcarsPanel>
  );
}
