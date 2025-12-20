'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useAppStore } from '@/hooks/useAppStore';
import { useNetworkMetrics } from '@/hooks/useNodes';
import { useMetricHistory, type MetricSnapshot } from '@/hooks/useMetricHistory';
import { calculateNetworkPulse } from '@/lib/pulse';
import { ViewToggle } from '@/components/map/ViewToggle';
import { NodeDetailPanel } from '@/components/panels/NodeDetailPanel';
import { CommandHeader } from '@/components/dashboard/CommandHeader';

// Dynamic imports for heavy map components
const TopologyGraph = dynamic(
  () => import('@/components/map/TopologyGraph').then((m) => ({ default: m.TopologyGraph })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-[var(--concordium-teal)] opacity-20" />
            <div className="absolute inset-0 rounded-full border-2 border-[var(--concordium-teal)] border-t-transparent animate-spin" />
          </div>
          <p className="text-muted-foreground font-mono text-sm tracking-wider">
            INITIALIZING TOPOLOGY VIEW<span className="cursor-blink" />
          </p>
        </div>
      </div>
    ),
  }
);

const GeographicMap = dynamic(
  () => import('@/components/map/GeographicMap').then((m) => ({ default: m.GeographicMap })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-[var(--concordium-teal)] opacity-20" />
            <div className="absolute inset-0 rounded-full border-2 border-[var(--concordium-teal)] border-t-transparent animate-spin" />
          </div>
          <p className="text-muted-foreground font-mono text-sm tracking-wider">
            INITIALIZING GEOGRAPHIC VIEW<span className="cursor-blink" />
          </p>
        </div>
      </div>
    ),
  }
);

export default function Home() {
  const { currentView, isPanelOpen } = useAppStore();
  const { metrics: networkMetrics } = useNetworkMetrics();
  const { history, addSnapshot } = useMetricHistory();

  // Calculate pulse and create snapshot from network metrics
  useEffect(() => {
    if (!networkMetrics) return;

    const pulse = calculateNetworkPulse({
      finalizationTime: networkMetrics.maxFinalizationLag,
      latency: 45, // TODO: Get from API when available
      consensusRunning: Math.round((networkMetrics.consensusParticipation / 100) * networkMetrics.totalNodes),
      totalNodes: networkMetrics.totalNodes,
    });

    const snapshot: MetricSnapshot = {
      timestamp: Date.now(),
      nodes: networkMetrics.totalNodes,
      finalizationTime: networkMetrics.maxFinalizationLag,
      latency: 45, // Placeholder
      packets: 1200000, // Placeholder
      consensus: networkMetrics.consensusParticipation,
      pulse,
    };

    addSnapshot(snapshot);
  }, [networkMetrics, addSnapshot]);

  // Get current metrics or defaults
  const currentMetrics: MetricSnapshot = history.length > 0
    ? history[history.length - 1]
    : {
        timestamp: Date.now(),
        nodes: networkMetrics?.totalNodes ?? 0,
        finalizationTime: networkMetrics?.maxFinalizationLag ?? 0,
        latency: 45,
        packets: 1200000,
        consensus: networkMetrics?.consensusParticipation ?? 0,
        pulse: 94,
      };

  return (
    <main className="h-screen w-screen flex flex-col overflow-hidden bg-[var(--lcars-black)]">
      {/* LCARS Command Header with Network Pulse */}
      <CommandHeader metrics={currentMetrics} history={history} />

      {/* LCARS Controls Bar */}
      <div className="h-10 flex items-center justify-between px-4 shrink-0 bg-[var(--lcars-black)] border-t-4 border-[var(--lcars-lavender)]">
        <div className="flex items-center gap-3">
          {/* Status indicator */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--lcars-sky)]">
            <div className="w-2 h-2 rounded-full bg-[var(--lcars-black)] animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-[var(--lcars-black)] tracking-wider uppercase">LIVE</span>
          </div>
        </div>

        <ViewToggle />
      </div>

      {/* Main content - map area */}
      <div className="flex-1 relative min-h-0 overflow-hidden">
        <div
          className="h-full w-full transition-all duration-300"
          style={{
            paddingRight: isPanelOpen ? '24rem' : 0,
          }}
        >
          {currentView === 'topology' ? <TopologyGraph /> : <GeographicMap />}
        </div>

        {/* Detail panel */}
        <NodeDetailPanel />
      </div>
    </main>
  );
}
