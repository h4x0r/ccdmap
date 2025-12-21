'use client';

import { useRouter } from 'next/navigation';

export function MobileHome() {
  const router = useRouter();

  const handleViewMap = () => {
    router.push('/map');
  };

  return (
    <main className="mobile-home">
      <div className="mobile-pulse-banner">
        <span>NETWORK PULSE</span>
        <button className="mobile-map-btn" onClick={handleViewMap}>
          MAP
        </button>
      </div>

      <div className="mobile-stats-row">
        <span>STATS</span>
      </div>

      <div className="mobile-tabs">
        <span>TABS</span>
      </div>

      <div className="mobile-content">
        <span>CONTENT</span>
      </div>
    </main>
  );
}
