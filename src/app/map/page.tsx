'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/hooks/useAppStore';
import { useNodes } from '@/hooks/useNodes';

const TopologyGraph = dynamic(
  () => import('@/components/map/TopologyGraph').then((m) => ({ default: m.TopologyGraph })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[var(--bb-black)]">
        <div className="text-center">
          <div className="bb-loading-ring mx-auto mb-4" />
          <span className="text-[var(--bb-gray)] font-mono text-sm">LOADING TOPOLOGY...</span>
        </div>
      </div>
    ),
  }
);

export default function MapPage() {
  const router = useRouter();
  const { selectedNodeId, selectNode } = useAppStore();
  const { data: nodes } = useNodes();

  const selectedNode = nodes?.find(n => n.nodeId === selectedNodeId);

  const handleBackToHome = () => {
    router.push('/');
  };

  const handleNodeSelect = (nodeId: string | null) => {
    selectNode(nodeId);
    // Navigate back to home when a node is selected on mobile
    if (nodeId) {
      router.push('/');
    }
  };

  return (
    <main className="h-screen w-screen flex flex-col overflow-hidden bg-[var(--bb-black)]">
      {/* Floating Header */}
      <div className="mobile-map-header">
        <button
          onClick={handleBackToHome}
          className="mobile-back-btn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>BACK</span>
        </button>

        <div className="mobile-map-title">
          <span className="text-[var(--bb-orange)]">NETWORK TOPOLOGY</span>
          {selectedNode && (
            <span className="text-[var(--bb-cyan)] text-xs ml-2">
              {selectedNode.nodeName || selectedNode.nodeId.slice(0, 12)}
            </span>
          )}
        </div>

        <div className="mobile-node-count">
          <span className="text-[var(--bb-gray)]">{nodes?.length ?? 0}</span>
          <span className="text-[8px] text-[var(--bb-gray-dim)]">NODES</span>
        </div>
      </div>

      {/* Full Screen Map */}
      <div className="flex-1 relative">
        <TopologyGraph onNodeSelect={handleNodeSelect} />
      </div>

      {/* Bottom hint */}
      <div className="mobile-map-hint">
        <span>TAP NODE TO SELECT</span>
        <span className="text-[var(--bb-orange)]">•</span>
        <span>TAP AGAIN TO VIEW DETAILS</span>
      </div>
    </main>
  );
}
