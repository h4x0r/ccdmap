'use client';

import {
  RISK_FILTER_TOOLTIPS,
  FILTER_MODE_CONFIG,
  RISK_FILTER_CONFIG,
} from '@/lib/attack-surface';
import type { AttackSurfaceStats, FilterMode, RiskFilter } from '@/lib/attack-surface';

interface AttackSurfaceFiltersProps {
  stats: AttackSurfaceStats;
  filterMode: FilterMode;
  riskFilter: RiskFilter;
  searchTerm: string;
  onFilterModeChange: (mode: FilterMode) => void;
  onRiskFilterChange: (risk: RiskFilter) => void;
  onSearchTermChange: (term: string) => void;
}

/**
 * Filter controls for the attack surface view
 */
export function AttackSurfaceFilters({
  stats,
  filterMode,
  riskFilter,
  searchTerm,
  onFilterModeChange,
  onRiskFilterChange,
  onSearchTermChange,
}: AttackSurfaceFiltersProps) {
  const getFilterCount = (mode: FilterMode): number => {
    switch (mode) {
      case 'all':
        return stats.total;
      case 'validators':
        return stats.validators;
      case 'withIp':
        return stats.withIp;
      case 'withoutIp':
        return stats.withoutIp;
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--bb-border)]">
      {/* Mode filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--bb-gray)]">FILTER:</span>
        {FILTER_MODE_CONFIG.map(({ mode, label, activeColor }) => (
          <button
            key={mode}
            onClick={() => onFilterModeChange(mode)}
            className={`px-2 py-1 text-xs ${
              filterMode === mode
                ? `${activeColor} text-black`
                : 'bg-[var(--bb-panel-bg)] text-[var(--bb-gray)]'
            }`}
          >
            {label} ({getFilterCount(mode)})
          </button>
        ))}
      </div>

      {/* Risk filter */}
      <div className="flex items-center gap-2 ml-4">
        <span className="text-xs text-[var(--bb-gray)]">RISK:</span>
        {RISK_FILTER_CONFIG.map(({ risk, activeColor }) => (
          <button
            key={risk}
            onClick={() => onRiskFilterChange(risk)}
            title={RISK_FILTER_TOOLTIPS[risk]}
            className={`px-2 py-1 text-xs ${
              riskFilter === risk
                ? `${activeColor} text-black`
                : 'bg-[var(--bb-panel-bg)] text-[var(--bb-gray)]'
            }`}
          >
            {risk.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search nodes, IPs..."
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        className="ml-auto px-2 py-1 text-xs bg-[var(--bb-panel-bg)] border border-[var(--bb-border)] text-[var(--bb-text)] focus:outline-none focus:border-[var(--bb-cyan)]"
        style={{ width: '200px' }}
      />
    </div>
  );
}
