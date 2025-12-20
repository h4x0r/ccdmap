import { describe, it, expect } from 'vitest';
import {
  calculateNetworkPulse,
  calculateFinalizationHealth,
  calculateLatencyHealth,
  calculateConsensusHealth,
  getPulseStatus,
  THRESHOLDS,
  type PulseStatus,
} from './pulse';

describe('THRESHOLDS', () => {
  it('exports Concordium protocol thresholds', () => {
    expect(THRESHOLDS.FINALIZATION_OPTIMAL).toBe(2);  // 2s minimum finalization
    expect(THRESHOLDS.FINALIZATION_TIMEOUT).toBe(10); // 10s timeout
    expect(THRESHOLDS.LATENCY_OPTIMAL).toBe(100);     // 100ms excellent
    expect(THRESHOLDS.LATENCY_POOR).toBe(1000);       // 1000ms poor
    expect(THRESHOLDS.CONSENSUS_QUORUM).toBe(67);     // 2/3 quorum
  });
});

describe('calculateFinalizationHealth', () => {
  it('returns 100 when finalization time is under 2 seconds (optimal)', () => {
    expect(calculateFinalizationHealth(1.5)).toBe(100);
    expect(calculateFinalizationHealth(1.0)).toBe(100);
    expect(calculateFinalizationHealth(0)).toBe(100);
  });

  it('returns 0 when finalization time is 10 seconds or more (timeout)', () => {
    expect(calculateFinalizationHealth(10)).toBe(0);
    expect(calculateFinalizationHealth(15)).toBe(0);
  });

  it('degrades linearly between 2s and 10s', () => {
    // At 6s (midpoint), should be ~50%
    const midpoint = calculateFinalizationHealth(6);
    expect(midpoint).toBeGreaterThan(40);
    expect(midpoint).toBeLessThan(60);

    // At 2s should be 100
    expect(calculateFinalizationHealth(2)).toBe(100);

    // Just above 2s should be close to 100
    expect(calculateFinalizationHealth(2.1)).toBeGreaterThan(95);
  });
});

describe('calculateLatencyHealth', () => {
  it('returns 100 when latency is under 100ms (optimal)', () => {
    expect(calculateLatencyHealth(50)).toBe(100);
    expect(calculateLatencyHealth(99)).toBe(100);
    expect(calculateLatencyHealth(0)).toBe(100);
  });

  it('returns 0 when latency is 1000ms or more (poor)', () => {
    expect(calculateLatencyHealth(1000)).toBe(0);
    expect(calculateLatencyHealth(2000)).toBe(0);
  });

  it('degrades linearly between 100ms and 1000ms', () => {
    // At 550ms (midpoint), should be ~50%
    const midpoint = calculateLatencyHealth(550);
    expect(midpoint).toBeGreaterThan(40);
    expect(midpoint).toBeLessThan(60);

    // At 100ms should be 100
    expect(calculateLatencyHealth(100)).toBe(100);
  });
});

describe('calculateConsensusHealth', () => {
  it('returns the percentage of nodes with consensus running', () => {
    expect(calculateConsensusHealth(100, 100)).toBe(100);
    expect(calculateConsensusHealth(67, 100)).toBe(67);  // quorum threshold
    expect(calculateConsensusHealth(50, 100)).toBe(50);
    expect(calculateConsensusHealth(0, 100)).toBe(0);
  });

  it('handles zero total nodes gracefully', () => {
    expect(calculateConsensusHealth(0, 0)).toBe(0);
  });
});

describe('calculateNetworkPulse', () => {
  it('returns 100 for perfect health', () => {
    const perfect = calculateNetworkPulse({
      finalizationTime: 1.5,  // 100% health (< 2s)
      latency: 50,            // 100% health (< 100ms)
      consensusRunning: 100,
      totalNodes: 100,        // 100% health
    });
    expect(perfect).toBe(100);
  });

  it('weights finalization at 40%, latency at 30%, consensus at 30%', () => {
    // Only finalization healthy (100), others at 0
    const finalizationOnly = calculateNetworkPulse({
      finalizationTime: 1.5,   // 100%
      latency: 1000,           // 0%
      consensusRunning: 0,
      totalNodes: 100,         // 0%
    });
    expect(finalizationOnly).toBe(40); // 40% weight

    // Only latency healthy
    const latencyOnly = calculateNetworkPulse({
      finalizationTime: 10,    // 0%
      latency: 50,             // 100%
      consensusRunning: 0,
      totalNodes: 100,         // 0%
    });
    expect(latencyOnly).toBe(30); // 30% weight

    // Only consensus healthy
    const consensusOnly = calculateNetworkPulse({
      finalizationTime: 10,    // 0%
      latency: 1000,           // 0%
      consensusRunning: 100,
      totalNodes: 100,         // 100%
    });
    expect(consensusOnly).toBe(30); // 30% weight
  });

  it('rounds to nearest integer', () => {
    const result = calculateNetworkPulse({
      finalizationTime: 5.0,
      latency: 400,
      consensusRunning: 80,
      totalNodes: 100,
    });
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe('getPulseStatus', () => {
  it('returns NOMINAL for 90-100% (optimal operation)', () => {
    expect(getPulseStatus(100)).toEqual<PulseStatus>({ label: 'NOMINAL', color: 'cyan' });
    expect(getPulseStatus(90)).toEqual<PulseStatus>({ label: 'NOMINAL', color: 'cyan' });
  });

  it('returns ELEVATED for 75-89% (some degradation)', () => {
    expect(getPulseStatus(89)).toEqual<PulseStatus>({ label: 'ELEVATED', color: 'amber' });
    expect(getPulseStatus(75)).toEqual<PulseStatus>({ label: 'ELEVATED', color: 'amber' });
  });

  it('returns DEGRADED for 67-74% (at consensus quorum threshold)', () => {
    expect(getPulseStatus(74)).toEqual<PulseStatus>({ label: 'DEGRADED', color: 'magenta' });
    expect(getPulseStatus(67)).toEqual<PulseStatus>({ label: 'DEGRADED', color: 'magenta' });
  });

  it('returns CRITICAL for below 67% (cannot achieve consensus quorum)', () => {
    expect(getPulseStatus(66)).toEqual<PulseStatus>({ label: 'CRITICAL', color: 'red' });
    expect(getPulseStatus(0)).toEqual<PulseStatus>({ label: 'CRITICAL', color: 'red' });
  });
});
