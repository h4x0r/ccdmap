import { describe, it, expect } from 'vitest';
import {
  calculateNetworkPulse,
  calculateFinalizationHealth,
  calculateLatencyHealth,
  calculateConsensusHealth,
  getPulseStatus,
  type PulseStatus,
} from './pulse';

describe('calculateFinalizationHealth', () => {
  it('returns 100 when finalization time is under 3 seconds', () => {
    expect(calculateFinalizationHealth(2.5)).toBe(100);
    expect(calculateFinalizationHealth(1.0)).toBe(100);
    expect(calculateFinalizationHealth(0)).toBe(100);
  });

  it('returns 0 when finalization time is 10 seconds or more', () => {
    expect(calculateFinalizationHealth(10)).toBe(0);
    expect(calculateFinalizationHealth(15)).toBe(0);
  });

  it('degrades linearly between 3s and 10s', () => {
    // At 6.5s (midpoint), should be ~50%
    const midpoint = calculateFinalizationHealth(6.5);
    expect(midpoint).toBeGreaterThan(40);
    expect(midpoint).toBeLessThan(60);
  });
});

describe('calculateLatencyHealth', () => {
  it('returns 100 when latency is under 50ms', () => {
    expect(calculateLatencyHealth(30)).toBe(100);
    expect(calculateLatencyHealth(0)).toBe(100);
  });

  it('returns 0 when latency is 500ms or more', () => {
    expect(calculateLatencyHealth(500)).toBe(0);
    expect(calculateLatencyHealth(1000)).toBe(0);
  });

  it('degrades linearly between 50ms and 500ms', () => {
    // At 275ms (midpoint), should be ~50%
    const midpoint = calculateLatencyHealth(275);
    expect(midpoint).toBeGreaterThan(40);
    expect(midpoint).toBeLessThan(60);
  });
});

describe('calculateConsensusHealth', () => {
  it('returns the percentage of nodes with consensus running', () => {
    expect(calculateConsensusHealth(100, 100)).toBe(100);
    expect(calculateConsensusHealth(50, 100)).toBe(50);
    expect(calculateConsensusHealth(0, 100)).toBe(0);
  });

  it('handles zero total nodes gracefully', () => {
    expect(calculateConsensusHealth(0, 0)).toBe(0);
  });
});

describe('calculateNetworkPulse', () => {
  it('returns weighted average of health scores', () => {
    // Perfect health: all 100
    const perfect = calculateNetworkPulse({
      finalizationTime: 2.0,  // 100% health
      latency: 30,            // 100% health
      consensusRunning: 100,
      totalNodes: 100,        // 100% health
    });
    expect(perfect).toBe(100);
  });

  it('weights finalization at 40%, latency at 30%, consensus at 30%', () => {
    // Only finalization healthy (100), others at 0
    const finalizationOnly = calculateNetworkPulse({
      finalizationTime: 2.0,   // 100%
      latency: 500,            // 0%
      consensusRunning: 0,
      totalNodes: 100,         // 0%
    });
    expect(finalizationOnly).toBe(40); // 40% weight

    // Only latency healthy
    const latencyOnly = calculateNetworkPulse({
      finalizationTime: 10,    // 0%
      latency: 30,             // 100%
      consensusRunning: 0,
      totalNodes: 100,         // 0%
    });
    expect(latencyOnly).toBe(30); // 30% weight

    // Only consensus healthy
    const consensusOnly = calculateNetworkPulse({
      finalizationTime: 10,    // 0%
      latency: 500,            // 0%
      consensusRunning: 100,
      totalNodes: 100,         // 100%
    });
    expect(consensusOnly).toBe(30); // 30% weight
  });

  it('rounds to nearest integer', () => {
    const result = calculateNetworkPulse({
      finalizationTime: 5.0,
      latency: 200,
      consensusRunning: 80,
      totalNodes: 100,
    });
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe('getPulseStatus', () => {
  it('returns NOMINAL for 95-100%', () => {
    expect(getPulseStatus(100)).toEqual<PulseStatus>({ label: 'NOMINAL', color: 'cyan' });
    expect(getPulseStatus(95)).toEqual<PulseStatus>({ label: 'NOMINAL', color: 'cyan' });
  });

  it('returns ELEVATED for 80-94%', () => {
    expect(getPulseStatus(94)).toEqual<PulseStatus>({ label: 'ELEVATED', color: 'amber' });
    expect(getPulseStatus(80)).toEqual<PulseStatus>({ label: 'ELEVATED', color: 'amber' });
  });

  it('returns DEGRADED for 60-79%', () => {
    expect(getPulseStatus(79)).toEqual<PulseStatus>({ label: 'DEGRADED', color: 'magenta' });
    expect(getPulseStatus(60)).toEqual<PulseStatus>({ label: 'DEGRADED', color: 'magenta' });
  });

  it('returns CRITICAL for below 60%', () => {
    expect(getPulseStatus(59)).toEqual<PulseStatus>({ label: 'CRITICAL', color: 'red' });
    expect(getPulseStatus(0)).toEqual<PulseStatus>({ label: 'CRITICAL', color: 'red' });
  });
});
