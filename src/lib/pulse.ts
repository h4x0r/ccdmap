/**
 * Network Pulse calculation logic
 * Computes composite health score from finalization, latency, and consensus metrics
 *
 * Thresholds based on Concordium protocol specifications:
 * - Finalization: 2s minimum, 10s timeout (ConcordiumBFT)
 * - Latency: Based on Prometheus gRPC buckets (100ms-1000ms)
 * - Consensus: 2/3 (67%) stake required for finalization
 *
 * Sources:
 * - https://docs.concordium.com/en/mainnet/docs/protocol/concepts-baker.html
 * - https://github.com/Concordium/concordium-node/blob/main/docs/prometheus-exporter.md
 * - https://proposals.concordium.com/updates/P6.html
 */

export interface PulseStatus {
  label: 'NOMINAL' | 'ELEVATED' | 'DEGRADED' | 'CRITICAL';
  color: 'cyan' | 'amber' | 'magenta' | 'red';
}

export interface PulseInput {
  finalizationTime: number;  // seconds
  latency: number;           // milliseconds
  consensusRunning: number;  // count of nodes with consensus running
  totalNodes: number;        // total node count
}

/** Concordium protocol constants */
export const THRESHOLDS = {
  /** Minimum finalization time - blocks final at minimum 2s after creation */
  FINALIZATION_OPTIMAL: 2,
  /** Timeout threshold - validators sign timeout message after 10s */
  FINALIZATION_TIMEOUT: 10,
  /** Excellent latency threshold (ms) - based on Prometheus bucket config */
  LATENCY_OPTIMAL: 100,
  /** Poor latency threshold (ms) - upper Prometheus bucket */
  LATENCY_POOR: 1000,
  /** Consensus quorum - 2/3 stake required for finalization */
  CONSENSUS_QUORUM: 67,
} as const;

/**
 * Calculate finalization health (0-100)
 * Based on ConcordiumBFT: 2s minimum finalization, 10s timeout
 * 100% if < 2s (excellent), degrades linearly to 0% at 10s (timeout)
 */
export function calculateFinalizationHealth(finalizationTime: number): number {
  if (finalizationTime < THRESHOLDS.FINALIZATION_OPTIMAL) return 100;
  if (finalizationTime >= THRESHOLDS.FINALIZATION_TIMEOUT) return 0;
  // Linear degradation: 100 at 2s, 0 at 10s
  const range = THRESHOLDS.FINALIZATION_TIMEOUT - THRESHOLDS.FINALIZATION_OPTIMAL;
  return Math.round(100 - ((finalizationTime - THRESHOLDS.FINALIZATION_OPTIMAL) / range) * 100);
}

/**
 * Calculate latency health (0-100)
 * Based on Concordium Prometheus gRPC buckets: 50ms, 100ms, 200ms, 500ms, 1000ms
 * 100% if < 100ms (excellent), degrades linearly to 0% at 1000ms
 */
export function calculateLatencyHealth(latency: number): number {
  if (latency < THRESHOLDS.LATENCY_OPTIMAL) return 100;
  if (latency >= THRESHOLDS.LATENCY_POOR) return 0;
  // Linear degradation: 100 at 100ms, 0 at 1000ms
  const range = THRESHOLDS.LATENCY_POOR - THRESHOLDS.LATENCY_OPTIMAL;
  return Math.round(100 - ((latency - THRESHOLDS.LATENCY_OPTIMAL) / range) * 100);
}

/**
 * Calculate consensus health (0-100)
 * Percentage of nodes with consensus running
 * Critical threshold: < 67% means network cannot achieve finalization quorum
 */
export function calculateConsensusHealth(consensusRunning: number, totalNodes: number): number {
  if (totalNodes === 0) return 0;
  return Math.round((consensusRunning / totalNodes) * 100);
}

/**
 * Calculate composite network pulse score (0-100)
 * Weighted: 40% finalization, 30% latency, 30% consensus
 *
 * Note: If consensus < 67%, network cannot finalize (quorum not met)
 */
export function calculateNetworkPulse(input: PulseInput): number {
  const finalizationHealth = calculateFinalizationHealth(input.finalizationTime);
  const latencyHealth = calculateLatencyHealth(input.latency);
  const consensusHealth = calculateConsensusHealth(input.consensusRunning, input.totalNodes);

  const weighted =
    finalizationHealth * 0.4 +
    latencyHealth * 0.3 +
    consensusHealth * 0.3;

  return Math.round(weighted);
}

/**
 * Get status label and color based on pulse score
 *
 * Thresholds based on protocol requirements:
 * - NOMINAL (90-100): Network operating optimally
 * - ELEVATED (75-89): Some degradation, monitor closely
 * - DEGRADED (67-74): At or near consensus quorum threshold
 * - CRITICAL (<67): Below consensus quorum - network cannot finalize
 */
export function getPulseStatus(pulse: number): PulseStatus {
  if (pulse >= 90) return { label: 'NOMINAL', color: 'cyan' };
  if (pulse >= 75) return { label: 'ELEVATED', color: 'amber' };
  if (pulse >= THRESHOLDS.CONSENSUS_QUORUM) return { label: 'DEGRADED', color: 'magenta' };
  return { label: 'CRITICAL', color: 'red' };
}
