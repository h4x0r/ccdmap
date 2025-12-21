'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/hooks/useAppStore';

const TopologyGraph = dynamic(
  () => import('@/components/map/TopologyGraph').then((m) => ({ default: m.TopologyGraph })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[var(--bb-black)]">
        <span className="text-[var(--bb-gray)]">LOADING...</span>
      </div>
    ),
  }
);

export default function MapPage() {
  const router = useRouter();
  const { selectedNodeId, selectNode } = useAppStore();

  const handleBack = () => {
    router.push('/');
  };

  const handleNodeSelect = (nodeId: string | null) => {
    if (nodeId && selectedNodeId === nodeId) {
      // Double-tap: navigate back with selection
      router.push('/');
    } else {
      selectNode(nodeId);
    }
  };

  return (
    <main className="h-screen w-screen flex flex-col bg-[var(--bb-black)]">
      <div className="mobile-map-header">
        <button className="mobile-back-btn" onClick={handleBack}>
          BACK
        </button>
      </div>

      <div className="flex-1">
        <TopologyGraph onNodeSelect={handleNodeSelect} />
      </div>
    </main>
  );
}
