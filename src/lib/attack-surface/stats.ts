/**
 * Statistics Calculation
 *
 * Pure function for calculating attack surface statistics in a single pass.
 * O(n) instead of O(9n) from multiple filter calls.
 */

import type { AttackSurfaceNode, AttackSurfaceStats, RiskLevel } from './types';

/**
 * Calculate attack surface statistics in a single pass through the data.
 *
 * This is more efficient than calling .filter() 9 times:
 * - Before: O(9n) - 9 array traversals
 * - After: O(n) - 1 array traversal
 *
 * @param nodes - Array of attack surface nodes
 * @returns Statistics object with all counts
 */
export function calculateStats(nodes: AttackSurfaceNode[]): AttackSurfaceStats {
  // Initialize counters
  let withIp = 0;
  let validators = 0;
  let validatorsWithIp = 0;

  const riskLevels: Record<RiskLevel, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    unknown: 0,
  };

  const portExposure = {
    peering: 0,
    grpcDefault: 0,
    grpcOther: 0,
  };

  // Single pass through all nodes
  for (const node of nodes) {
    // IP tracking
    if (node.ipAddress !== null) {
      withIp++;
      if (node.isValidator) {
        validatorsWithIp++;
      }
    }

    // Validator tracking
    if (node.isValidator) {
      validators++;
    }

    // Risk level tracking
    riskLevels[node.riskLevel]++;

    // Port exposure tracking
    if (node.hasPeeringPort) {
      portExposure.peering++;
    }
    if (node.hasGrpcDefault) {
      portExposure.grpcDefault++;
    }
    if (node.hasGrpcOther.length > 0) {
      portExposure.grpcOther++;
    }
  }

  return {
    total: nodes.length,
    withIp,
    withoutIp: nodes.length - withIp,
    validators,
    validatorsWithIp,
    riskLevels,
    portExposure,
  };
}

/**
 * Create empty stats object (for loading/error states)
 */
export function emptyStats(): AttackSurfaceStats {
  return {
    total: 0,
    withIp: 0,
    withoutIp: 0,
    validators: 0,
    validatorsWithIp: 0,
    riskLevels: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      unknown: 0,
    },
    portExposure: {
      peering: 0,
      grpcDefault: 0,
      grpcOther: 0,
    },
  };
}
