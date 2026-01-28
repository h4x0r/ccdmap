/**
 * Stats Calculation Tests
 *
 * Tests for single-pass statistics calculation.
 */

import { describe, it, expect } from 'vitest';
import { calculateStats, emptyStats } from './stats';
import type { AttackSurfaceNode } from './types';

const createNode = (overrides: Partial<AttackSurfaceNode>): AttackSurfaceNode => ({
  nodeId: 'node1',
  nodeName: 'Test Node',
  isValidator: false,
  ipAddress: '192.168.1.1',
  port: 8888,
  osintPorts: [],
  osintVulns: [],
  osintTags: [],
  osintReputation: 'clean',
  osintLastScan: null,
  hasPeeringPort: false,
  hasGrpcDefault: false,
  hasGrpcOther: [],
  hasOtherPorts: [],
  riskLevel: 'low',
  riskReasons: ['Clean reputation, few exposed ports'],
  ...overrides,
});

describe('calculateStats', () => {
  describe('total counts', () => {
    it('counts total nodes', () => {
      const nodes = [
        createNode({ nodeId: '1' }),
        createNode({ nodeId: '2' }),
        createNode({ nodeId: '3' }),
      ];

      const stats = calculateStats(nodes);
      expect(stats.total).toBe(3);
    });

    it('returns 0 for empty array', () => {
      const stats = calculateStats([]);
      expect(stats.total).toBe(0);
    });
  });

  describe('IP tracking', () => {
    it('counts nodes with IP', () => {
      const nodes = [
        createNode({ nodeId: '1', ipAddress: '10.0.0.1' }),
        createNode({ nodeId: '2', ipAddress: null }),
        createNode({ nodeId: '3', ipAddress: '10.0.0.3' }),
      ];

      const stats = calculateStats(nodes);
      expect(stats.withIp).toBe(2);
      expect(stats.withoutIp).toBe(1);
    });

    it('counts validators with IP', () => {
      const nodes = [
        createNode({ nodeId: '1', isValidator: true, ipAddress: '10.0.0.1' }),
        createNode({ nodeId: '2', isValidator: true, ipAddress: null }),
        createNode({ nodeId: '3', isValidator: false, ipAddress: '10.0.0.3' }),
      ];

      const stats = calculateStats(nodes);
      expect(stats.validators).toBe(2);
      expect(stats.validatorsWithIp).toBe(1);
    });
  });

  describe('risk level tracking', () => {
    it('counts each risk level', () => {
      const nodes = [
        createNode({ nodeId: '1', riskLevel: 'critical' }),
        createNode({ nodeId: '2', riskLevel: 'high' }),
        createNode({ nodeId: '3', riskLevel: 'high' }),
        createNode({ nodeId: '4', riskLevel: 'medium' }),
        createNode({ nodeId: '5', riskLevel: 'low' }),
        createNode({ nodeId: '6', riskLevel: 'low' }),
        createNode({ nodeId: '7', riskLevel: 'low' }),
        createNode({ nodeId: '8', riskLevel: 'unknown' }),
      ];

      const stats = calculateStats(nodes);
      expect(stats.riskLevels.critical).toBe(1);
      expect(stats.riskLevels.high).toBe(2);
      expect(stats.riskLevels.medium).toBe(1);
      expect(stats.riskLevels.low).toBe(3);
      expect(stats.riskLevels.unknown).toBe(1);
    });
  });

  describe('port exposure tracking', () => {
    it('counts port exposure', () => {
      const nodes = [
        createNode({ nodeId: '1', hasPeeringPort: true, hasGrpcDefault: true }),
        createNode({ nodeId: '2', hasPeeringPort: true, hasGrpcDefault: false }),
        createNode({ nodeId: '3', hasPeeringPort: false, hasGrpcDefault: true, hasGrpcOther: [10000] }),
        createNode({ nodeId: '4', hasPeeringPort: false, hasGrpcDefault: false }),
      ];

      const stats = calculateStats(nodes);
      expect(stats.portExposure.peering).toBe(2);
      expect(stats.portExposure.grpcDefault).toBe(2);
      expect(stats.portExposure.grpcOther).toBe(1);
    });
  });

  describe('single-pass efficiency', () => {
    it('calculates all stats in one pass', () => {
      // Create a large dataset to verify single-pass efficiency
      const nodes = Array.from({ length: 1000 }, (_, i) =>
        createNode({
          nodeId: `node${i}`,
          isValidator: i % 3 === 0,
          ipAddress: i % 4 === 0 ? null : `10.0.${Math.floor(i / 256)}.${i % 256}`,
          riskLevel: ['low', 'medium', 'high', 'critical', 'unknown'][i % 5] as any,
          hasPeeringPort: i % 2 === 0,
          hasGrpcDefault: i % 3 === 0,
          hasGrpcOther: i % 5 === 0 ? [10000] : [],
        })
      );

      const stats = calculateStats(nodes);

      expect(stats.total).toBe(1000);
      expect(stats.validators).toBe(334); // Every 3rd node
      expect(stats.withIp).toBe(750); // 3/4 have IP
      expect(stats.withoutIp).toBe(250);
    });
  });
});

describe('emptyStats', () => {
  it('returns all zeros', () => {
    const stats = emptyStats();

    expect(stats.total).toBe(0);
    expect(stats.withIp).toBe(0);
    expect(stats.withoutIp).toBe(0);
    expect(stats.validators).toBe(0);
    expect(stats.validatorsWithIp).toBe(0);
    expect(stats.riskLevels.critical).toBe(0);
    expect(stats.riskLevels.high).toBe(0);
    expect(stats.riskLevels.medium).toBe(0);
    expect(stats.riskLevels.low).toBe(0);
    expect(stats.riskLevels.unknown).toBe(0);
    expect(stats.portExposure.peering).toBe(0);
    expect(stats.portExposure.grpcDefault).toBe(0);
    expect(stats.portExposure.grpcOther).toBe(0);
  });
});
