'use client';

import { useMemo } from 'react';
import { useAttackSurface } from '@/hooks/useAttackSurface';
import { useAttackSurfaceFilters } from '@/hooks/useAttackSurfaceFilters';
import { useAppStore } from '@/hooks/useAppStore';
import {
  filterAttackSurfaceNodes,
  sortAttackSurfaceNodes,
  RISK_LEVELS,
  type FilterMode,
  type RiskFilter,
} from '@/lib/attack-surface';

const FILTER_MODES: { mode: FilterMode; label: string }[] = [
  { mode: 'all', label: 'ALL' },
  { mode: 'validators', label: 'VALIDATORS' },
  { mode: 'withIp', label: 'WITH IP' },
  { mode: 'withoutIp', label: 'NO IP' },
];

const RISK_FILTERS: { risk: RiskFilter; label: string }[] = [
  { risk: 'all', label: 'ALL' },
  { risk: 'critical', label: 'CRIT' },
  { risk: 'high', label: 'HIGH' },
  { risk: 'medium', label: 'MED' },
  { risk: 'low', label: 'LOW' },
];

/**
 * Mobile Security view (Attack Surface)
 */
export function MobileSecurityView() {
  const { nodes, stats, isLoading, osintError } = useAttackSurface();
  const { selectNode } = useAppStore();

  const {
    filterMode,
    riskFilter,
    searchTerm,
    sortColumn,
    sortDirection,
    nodeSortStage,
    setFilterMode,
    setRiskFilter,
    setSearchTerm,
  } = useAttackSurfaceFilters();

  // Apply filtering and sorting
  const filteredAndSortedNodes = useMemo(() => {
    const filtered = filterAttackSurfaceNodes(nodes, filterMode, riskFilter, searchTerm);
    return sortAttackSurfaceNodes(filtered, {
      column: sortColumn,
      direction: sortDirection,
      nodeSortStage,
    });
  }, [nodes, filterMode, riskFilter, searchTerm, sortColumn, sortDirection, nodeSortStage]);

  if (isLoading) {
    return (
      <div className="mobile-security-loading">
        <span>Loading security data...</span>
      </div>
    );
  }

  return (
    <div className="mobile-security">
      {/* Stats bar with risk counts */}
      <div className="mobile-security-stats">
        {stats.riskLevels.critical > 0 && (
          <button
            className={`mobile-security-stat critical ${riskFilter === 'critical' ? 'active' : ''}`}
            onClick={() => setRiskFilter(riskFilter === 'critical' ? 'all' : 'critical')}
          >
            <span className="mobile-security-stat-emoji">🔴</span>
            <span className="mobile-security-stat-count">{stats.riskLevels.critical}</span>
            <span className="mobile-security-stat-label">CRIT</span>
          </button>
        )}
        {stats.riskLevels.high > 0 && (
          <button
            className={`mobile-security-stat high ${riskFilter === 'high' ? 'active' : ''}`}
            onClick={() => setRiskFilter(riskFilter === 'high' ? 'all' : 'high')}
          >
            <span className="mobile-security-stat-emoji">🟠</span>
            <span className="mobile-security-stat-count">{stats.riskLevels.high}</span>
            <span className="mobile-security-stat-label">HIGH</span>
          </button>
        )}
        {stats.riskLevels.medium > 0 && (
          <button
            className={`mobile-security-stat medium ${riskFilter === 'medium' ? 'active' : ''}`}
            onClick={() => setRiskFilter(riskFilter === 'medium' ? 'all' : 'medium')}
          >
            <span className="mobile-security-stat-emoji">🟡</span>
            <span className="mobile-security-stat-count">{stats.riskLevels.medium}</span>
            <span className="mobile-security-stat-label">MED</span>
          </button>
        )}
        {stats.riskLevels.low > 0 && (
          <button
            className={`mobile-security-stat low ${riskFilter === 'low' ? 'active' : ''}`}
            onClick={() => setRiskFilter(riskFilter === 'low' ? 'all' : 'low')}
          >
            <span className="mobile-security-stat-emoji">🟢</span>
            <span className="mobile-security-stat-count">{stats.riskLevels.low}</span>
            <span className="mobile-security-stat-label">LOW</span>
          </button>
        )}
      </div>

      {/* OSINT error banner */}
      {osintError && (
        <div className="mobile-security-error">
          ⚠️ {osintError}
        </div>
      )}

      {/* Filter pills */}
      <div className="mobile-security-filters">
        {FILTER_MODES.map(({ mode, label }) => (
          <button
            key={mode}
            className={`mobile-security-filter ${filterMode === mode ? 'active' : ''}`}
            onClick={() => setFilterMode(mode)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mobile-security-search">
        <input
          type="text"
          placeholder="Search nodes, IPs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Node list */}
      <div className="mobile-security-list">
        {filteredAndSortedNodes.map((node) => {
          const riskConfig = RISK_LEVELS[node.riskLevel];

          return (
            <button
              key={node.nodeId}
              className="mobile-security-item"
              onClick={() => selectNode(node.nodeId)}
            >
              <div className="mobile-security-item-row1">
                <span
                  className="mobile-security-item-risk"
                  style={{ color: riskConfig.color }}
                >
                  {riskConfig.emoji}
                </span>
                <span className="mobile-security-item-name">{node.nodeName}</span>
                <span className="mobile-security-item-ip">
                  {node.ipAddress ?? 'No IP'}
                </span>
              </div>
              <div className="mobile-security-item-row2">
                {node.isValidator && (
                  <span className="mobile-security-item-validator">✓</span>
                )}
                <span className="mobile-security-item-ports">
                  {node.hasPeeringPort && '8888 '}
                  {node.hasGrpcDefault && '20000 '}
                  {node.hasGrpcOther.length > 0 && node.hasGrpcOther.join(' ')}
                </span>
                {node.osintVulns.length > 0 && (
                  <span className="mobile-security-item-cve">
                    {node.osintVulns.length} CVE
                  </span>
                )}
              </div>
            </button>
          );
        })}

        {filteredAndSortedNodes.length === 0 && (
          <div className="mobile-security-empty">
            {searchTerm ? 'No nodes match your search' : 'No nodes found'}
          </div>
        )}
      </div>
    </div>
  );
}
