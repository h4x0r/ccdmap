'use client';

import { memo } from 'react';
import { RISK_LEVELS, type AttackSurfaceNode } from '@/lib/attack-surface';

interface AttackSurfaceTableRowProps {
  node: AttackSurfaceNode;
  onSelect: (nodeId: string) => void;
}

/**
 * Format risk tooltip from cached reasons.
 * Uses pre-calculated reasons instead of recalculating risk.
 */
function formatCachedRiskTooltip(node: AttackSurfaceNode): string {
  const label = node.riskLevel.toUpperCase();
  return `${label}: ${node.riskReasons.join(' • ')}`;
}

/**
 * Single table row for attack surface data.
 *
 * Memoized to prevent unnecessary re-renders when other rows change.
 * Uses cached riskReasons instead of recalculating risk assessment.
 */
export const AttackSurfaceTableRow = memo(function AttackSurfaceTableRow({
  node,
  onSelect,
}: AttackSurfaceTableRowProps) {
  const riskConfig = RISK_LEVELS[node.riskLevel];

  return (
    <tr
      onClick={() => onSelect(node.nodeId)}
      className="cursor-pointer hover:bg-[var(--bb-panel-bg)]"
    >
      {/* Risk indicator */}
      <td style={{ color: riskConfig.color }} title={formatCachedRiskTooltip(node)}>
        {riskConfig.emoji}
      </td>

      {/* Node name with validator badge */}
      <td>
        {node.isValidator && (
          <span className="bb-validator-icon mr-1" title="Validator">
            ✓
          </span>
        )}
        <span className="text-[var(--bb-cyan)]">{node.nodeName}</span>
      </td>

      {/* IP address */}
      <td className="font-mono text-xs">
        {node.ipAddress ? (
          <span className="text-[var(--bb-text)]">{node.ipAddress}</span>
        ) : (
          <span className="text-[var(--bb-gray)] italic">No IP</span>
        )}
      </td>

      {/* Port 8888 (Peering) */}
      <td className="text-center">
        <PortIndicator hasPort={node.hasPeeringPort} />
      </td>

      {/* Port 20000 (Default gRPC) */}
      <td className="text-center">
        <PortIndicator hasPort={node.hasGrpcDefault} />
      </td>

      {/* Other gRPC ports */}
      <td className="text-center">
        {node.hasGrpcOther.length > 0 ? (
          <span className="text-[var(--bb-cyan)]">{node.hasGrpcOther.join(',')}</span>
        ) : (
          <span className="text-[var(--bb-gray)]">-</span>
        )}
      </td>

      {/* Other exposed ports */}
      <td className="text-center">
        <CountIndicator count={node.hasOtherPorts.length} color="var(--bb-amber)" />
      </td>

      {/* CVE count */}
      <td className="text-center">
        <CountIndicator count={node.osintVulns.length} color="var(--bb-red)" />
      </td>
    </tr>
  );
});

/**
 * Boolean port indicator (checkmark or dash)
 */
function PortIndicator({ hasPort }: { hasPort: boolean }) {
  return hasPort ? (
    <span className="text-[var(--bb-cyan)]">✓</span>
  ) : (
    <span className="text-[var(--bb-gray)]">-</span>
  );
}

/**
 * Count indicator (number or dash if zero)
 */
function CountIndicator({ count, color }: { count: number; color: string }) {
  return count > 0 ? (
    <span style={{ color }}>{count}</span>
  ) : (
    <span className="text-[var(--bb-gray)]">-</span>
  );
}
