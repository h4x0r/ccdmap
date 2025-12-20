/**
 * Network Pulse calculation logic
 * Computes composite health score from finalization, latency, and consensus metrics
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

/**
 * Calculate finalization health (0-100)
 * 100% if < 3s, degrades linearly to 0% at 10s
 */
export function calculateFinalizationHealth(finalizationTime: number): number {
  if (finalizationTime < 3) return 100;
  if (finalizationTime >= 10) return 0;
  // Linear degradation: 100 at 3s, 0 at 10s
  return Math.round(100 - ((finalizationTime - 3) / 7) * 100);
}

/**
 * Calculate latency health (0-100)
 * 100% if < 50ms, degrades linearly to 0% at 500ms
 */
export function calculateLatencyHealth(latency: number): number {
  if (latency < 50) return 100;
  if (latency >= 500) return 0;
  // Linear degradation: 100 at 50ms, 0 at 500ms
  return Math.round(100 - ((latency - 50) / 450) * 100);
}

/**
 * Calculate consensus health (0-100)
 * Percentage of nodes with consensus running
 */
export function calculateConsensusHealth(consensusRunning: number, totalNodes: number): number {
  if (totalNodes === 0) return 0;
  return Math.round((consensusRunning / totalNodes) * 100);
}

/**
 * Calculate composite network pulse score (0-100)
 * Weighted: 40% finalization, 30% latency, 30% consensus
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
 */
export function getPulseStatus(pulse: number): PulseStatus {
  if (pulse >= 95) return { label: 'NOMINAL', color: 'cyan' };
  if (pulse >= 80) return { label: 'ELEVATED', color: 'amber' };
  if (pulse >= 60) return { label: 'DEGRADED', color: 'magenta' };
  return { label: 'CRITICAL', color: 'red' };
}
