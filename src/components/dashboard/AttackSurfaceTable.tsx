'use client';

import {
  getPortLegend,
  getNodeSortIndicator,
  type AttackSurfaceNode,
  type SortColumn,
  type SortDirection,
  type NodeSortStage,
} from '@/lib/attack-surface';
import { AttackSurfaceTableRow } from './AttackSurfaceTableRow';

interface AttackSurfaceTableProps {
  nodes: AttackSurfaceNode[];
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  nodeSortStage: NodeSortStage;
  onSort: (column: SortColumn) => void;
  onNodeSelect: (nodeId: string) => void;
}

/**
 * Table component for displaying attack surface data
 */
export function AttackSurfaceTable({
  nodes,
  sortColumn,
  sortDirection,
  nodeSortStage,
  onSort,
  onNodeSelect,
}: AttackSurfaceTableProps) {
  const legend = getPortLegend();

  // Sort indicator for non-node columns (simple asc/desc)
  const sortIndicator = (column: SortColumn) => {
    if (column === 'node') {
      // Node column uses 4-stage indicator
      return sortColumn === 'node' ? getNodeSortIndicator(nodeSortStage) : '';
    }
    return sortColumn === column ? (sortDirection === 'asc' ? '▲' : '▼') : '';
  };

  return (
    <>
      <div className="flex-1 overflow-auto">
        <table className="bb-table w-full">
          <thead className="sticky top-0 bg-[var(--bb-panel-bg)] z-10">
            <tr>
              <th className="text-left cursor-pointer" onClick={() => onSort('risk')}>
                RISK {sortIndicator('risk')}
              </th>
              <th className="text-left cursor-pointer" onClick={() => onSort('node')}>
                NODE {sortIndicator('node')}
              </th>
              <th className="text-left cursor-pointer" onClick={() => onSort('ip')}>
                IP {sortIndicator('ip')}
              </th>
              <th className="text-center cursor-pointer" onClick={() => onSort('port8888')}>
                8888 {sortIndicator('port8888')}
              </th>
              <th className="text-center cursor-pointer" onClick={() => onSort('port20000')}>
                20000 {sortIndicator('port20000')}
              </th>
              <th className="text-center cursor-pointer" onClick={() => onSort('portGrpcOther')}>
                Other gRPC {sortIndicator('portGrpcOther')}
              </th>
              <th className="text-center cursor-pointer" onClick={() => onSort('portOther')}>
                OTHER {sortIndicator('portOther')}
              </th>
              <th className="text-center cursor-pointer" onClick={() => onSort('vulns')}>
                CVE {sortIndicator('vulns')}
              </th>
            </tr>
          </thead>
          <tbody>
            {nodes.map((node) => (
              <AttackSurfaceTableRow
                key={node.nodeId}
                node={node}
                onSelect={onNodeSelect}
              />
            ))}
          </tbody>
        </table>

        {nodes.length === 0 && (
          <div className="flex items-center justify-center h-64">
            <span className="text-[var(--bb-gray)]">No nodes match the current filters</span>
          </div>
        )}
      </div>

      {/* Footer with legend - using single source of truth */}
      <div className="border-t border-[var(--bb-border)] px-4 py-2 text-xs text-[var(--bb-gray)]">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
          <span>LEGEND:</span>
          {legend.map((item) => (
            <span key={item.label}>
              {item.label} = {item.description}
            </span>
          ))}
          <span className="text-[var(--bb-amber)]">⚠️ Data from OSINT only - no active scanning</span>
        </div>
      </div>
    </>
  );
}
