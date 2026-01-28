/**
 * Integration Tests
 *
 * End-to-end tests for the attack surface data pipeline.
 * Ensures all modules work together correctly.
 */

import { describe, it, expect } from 'vitest';
import { assessRisk, formatRiskTooltip } from './risk-assessment';
import { categorizePorts } from './port-categories';
import { filterAttackSurfaceNodes, sortAttackSurfaceNodes } from './sorting';
import { calculateStats } from './stats';
import type { AttackSurfaceNode } from './types';

/**
 * Helper to create a node from raw data, simulating what useAttackSurface does
 */
function createNodeFromRawData(input: {
  nodeId: string;
  nodeName: string;
  isValidator: boolean;
  ipAddress: string | null;
  port: number | null;
  osintPorts: number[];
  osintVulns: string[];
  osintReputation: 'clean' | 'suspicious' | 'malicious' | 'unknown';
  osintTags: string[];
  osintLastScan: Date | null;
}): AttackSurfaceNode {
  const portCats = categorizePorts(input.osintPorts);
  const riskResult = assessRisk({
    osintPorts: input.osintPorts,
    osintVulns: input.osintVulns,
    osintReputation: input.osintReputation,
    isValidator: input.isValidator,
    ipAddress: input.ipAddress,
  });

  return {
    nodeId: input.nodeId,
    nodeName: input.nodeName,
    isValidator: input.isValidator,
    ipAddress: input.ipAddress,
    port: input.port,
    osintPorts: input.osintPorts,
    osintVulns: input.osintVulns,
    osintTags: input.osintTags,
    osintReputation: input.osintReputation,
    osintLastScan: input.osintLastScan,
    hasPeeringPort: portCats.hasPeering,
    hasGrpcDefault: portCats.hasGrpcDefault,
    hasGrpcOther: portCats.grpcOther,
    hasOtherPorts: portCats.otherPorts,
    riskLevel: riskResult.level,
    riskReasons: riskResult.reasons, // Cache reasons for tooltip display
  };
}

describe('Full Data Pipeline Integration', () => {
  describe('node creation from raw data', () => {
    it('creates complete node with all port categories', () => {
      const node = createNodeFromRawData({
        nodeId: 'node1',
        nodeName: 'Test Validator',
        isValidator: true,
        ipAddress: '192.168.1.1',
        port: 8888,
        osintPorts: [8888, 20000, 10000, 22, 80],
        osintVulns: [],
        osintReputation: 'clean',
        osintTags: [],
        osintLastScan: new Date(),
      });

      expect(node.hasPeeringPort).toBe(true);
      expect(node.hasGrpcDefault).toBe(true);
      expect(node.hasGrpcOther).toEqual([10000]);
      expect(node.hasOtherPorts).toEqual([22, 80]);
      expect(node.riskLevel).toBe('low');
    });

    it('assesses risk correctly for vulnerable validator', () => {
      const node = createNodeFromRawData({
        nodeId: 'vuln-validator',
        nodeName: 'Vulnerable Validator',
        isValidator: true,
        ipAddress: '10.0.0.1',
        port: 8888,
        osintPorts: [8888, 20000],
        osintVulns: ['CVE-2024-0001', 'CVE-2024-0002'],
        osintReputation: 'clean',
        osintTags: [],
        osintLastScan: new Date(),
      });

      // Validator with CVEs = HIGH risk (escalated from medium)
      expect(node.riskLevel).toBe('high');
    });

    it('assesses risk correctly for node with no IP', () => {
      const node = createNodeFromRawData({
        nodeId: 'no-ip',
        nodeName: 'No IP Node',
        isValidator: false,
        ipAddress: null,
        port: null,
        osintPorts: [],
        osintVulns: [],
        osintReputation: 'unknown',
        osintTags: [],
        osintLastScan: null,
      });

      expect(node.riskLevel).toBe('unknown');
    });
  });

  describe('filtering pipeline', () => {
    const testNodes: AttackSurfaceNode[] = [
      createNodeFromRawData({
        nodeId: 'val-high',
        nodeName: 'Validator High Risk',
        isValidator: true,
        ipAddress: '192.168.1.1',
        port: 8888,
        osintPorts: [8888, 20000],
        osintVulns: ['CVE-1', 'CVE-2'],
        osintReputation: 'clean',
        osintTags: [],
        osintLastScan: new Date(),
      }),
      createNodeFromRawData({
        nodeId: 'val-low',
        nodeName: 'Validator Low Risk',
        isValidator: true,
        ipAddress: '192.168.1.2',
        port: 8888,
        osintPorts: [8888],
        osintVulns: [],
        osintReputation: 'clean',
        osintTags: [],
        osintLastScan: new Date(),
      }),
      createNodeFromRawData({
        nodeId: 'node-medium',
        nodeName: 'Node Medium Risk',
        isValidator: false,
        ipAddress: '192.168.1.3',
        port: 8888,
        osintPorts: [8888, 20000],
        osintVulns: ['CVE-1'],
        osintReputation: 'clean',
        osintTags: [],
        osintLastScan: new Date(),
      }),
      createNodeFromRawData({
        nodeId: 'node-unknown',
        nodeName: 'Unknown Node',
        isValidator: false,
        ipAddress: null,
        port: null,
        osintPorts: [],
        osintVulns: [],
        osintReputation: 'unknown',
        osintTags: [],
        osintLastScan: null,
      }),
    ];

    it('filters to validators only', () => {
      const result = filterAttackSurfaceNodes(testNodes, 'validators', 'all', '');
      expect(result.length).toBe(2);
      expect(result.every(n => n.isValidator)).toBe(true);
    });

    it('filters to nodes with IP', () => {
      const result = filterAttackSurfaceNodes(testNodes, 'withIp', 'all', '');
      expect(result.length).toBe(3);
      expect(result.every(n => n.ipAddress !== null)).toBe(true);
    });

    it('filters by high risk only', () => {
      const result = filterAttackSurfaceNodes(testNodes, 'all', 'high', '');
      expect(result.length).toBe(1);
      expect(result[0].riskLevel).toBe('high');
    });

    it('combines filter mode and risk filter', () => {
      const result = filterAttackSurfaceNodes(testNodes, 'validators', 'high', '');
      expect(result.length).toBe(1);
      expect(result[0].isValidator).toBe(true);
      expect(result[0].riskLevel).toBe('high');
    });

    it('filters by search term in node name', () => {
      const result = filterAttackSurfaceNodes(testNodes, 'all', 'all', 'Validator');
      expect(result.length).toBe(2);
    });

    it('filters by search term in IP address', () => {
      const result = filterAttackSurfaceNodes(testNodes, 'all', 'all', '192.168.1.1');
      expect(result.length).toBe(1);
      expect(result[0].ipAddress).toBe('192.168.1.1');
    });
  });

  describe('sorting pipeline', () => {
    const testNodes: AttackSurfaceNode[] = [
      createNodeFromRawData({
        nodeId: '1',
        nodeName: 'Zulu',
        isValidator: false,
        ipAddress: '192.168.1.10',
        port: 8888,
        osintPorts: [8888],
        osintVulns: [],
        osintReputation: 'clean',
        osintTags: [],
        osintLastScan: new Date(),
      }),
      createNodeFromRawData({
        nodeId: '2',
        nodeName: 'Alpha',
        isValidator: true,
        ipAddress: '192.168.1.2',
        port: 8888,
        osintPorts: [8888, 20000, 10000, 22, 80],
        osintVulns: ['CVE-1'],
        osintReputation: 'clean',
        osintTags: [],
        osintLastScan: new Date(),
      }),
      createNodeFromRawData({
        nodeId: '3',
        nodeName: 'Beta',
        isValidator: true,
        ipAddress: '192.168.1.1',
        port: 8888,
        osintPorts: [8888],
        osintVulns: [],
        osintReputation: 'clean',
        osintTags: [],
        osintLastScan: new Date(),
      }),
    ];

    it('sorts by risk descending', () => {
      const sorted = sortAttackSurfaceNodes(testNodes, {
        column: 'risk',
        direction: 'desc',
      });

      // High risk first (Alpha with CVE as validator)
      expect(sorted[0].nodeName).toBe('Alpha');
    });

    it('sorts by IP numerically (fixes localeCompare bug)', () => {
      const sorted = sortAttackSurfaceNodes(testNodes, {
        column: 'ip',
        direction: 'asc',
      });

      // 192.168.1.1 < 192.168.1.2 < 192.168.1.10
      expect(sorted[0].ipAddress).toBe('192.168.1.1');
      expect(sorted[1].ipAddress).toBe('192.168.1.2');
      expect(sorted[2].ipAddress).toBe('192.168.1.10');
    });

    it('sorts by node name with validators first (stage 3)', () => {
      const sorted = sortAttackSurfaceNodes(testNodes, {
        column: 'node',
        direction: 'asc',
        nodeSortStage: 3,
      });

      // Validators first (Alpha, Beta sorted A-Z), then rest (Zulu)
      expect(sorted[0].nodeName).toBe('Alpha');
      expect(sorted[1].nodeName).toBe('Beta');
      expect(sorted[2].nodeName).toBe('Zulu');
    });

    it('sorts by portOther count', () => {
      const sorted = sortAttackSurfaceNodes(testNodes, {
        column: 'portOther',
        direction: 'desc',
      });

      // Alpha has [22, 80] = 2 other ports
      expect(sorted[0].nodeName).toBe('Alpha');
      expect(sorted[0].hasOtherPorts.length).toBe(2);
    });
  });

  describe('combined filter and sort', () => {
    const testNodes: AttackSurfaceNode[] = [
      createNodeFromRawData({
        nodeId: 'v1',
        nodeName: 'Validator One',
        isValidator: true,
        ipAddress: '10.0.0.1',
        port: 8888,
        osintPorts: [8888, 20000],
        osintVulns: ['CVE-1', 'CVE-2'],
        osintReputation: 'clean',
        osintTags: [],
        osintLastScan: new Date(),
      }),
      createNodeFromRawData({
        nodeId: 'v2',
        nodeName: 'Validator Two',
        isValidator: true,
        ipAddress: '10.0.0.2',
        port: 8888,
        osintPorts: [8888],
        osintVulns: [],
        osintReputation: 'clean',
        osintTags: [],
        osintLastScan: new Date(),
      }),
      createNodeFromRawData({
        nodeId: 'n1',
        nodeName: 'Node One',
        isValidator: false,
        ipAddress: '10.0.0.3',
        port: 8888,
        osintPorts: [8888],
        osintVulns: [],
        osintReputation: 'clean',
        osintTags: [],
        osintLastScan: new Date(),
      }),
    ];

    it('filters then sorts correctly', () => {
      // Filter to validators, sort by name A-Z
      const filtered = filterAttackSurfaceNodes(testNodes, 'validators', 'all', '');
      const sorted = sortAttackSurfaceNodes(filtered, {
        column: 'node',
        direction: 'asc',
        nodeSortStage: 1,
      });

      expect(sorted.length).toBe(2);
      expect(sorted[0].nodeName).toBe('Validator One');
      expect(sorted[1].nodeName).toBe('Validator Two');
    });

    it('handles empty result gracefully', () => {
      const filtered = filterAttackSurfaceNodes(testNodes, 'validators', 'critical', '');
      const sorted = sortAttackSurfaceNodes(filtered, {
        column: 'risk',
        direction: 'desc',
      });

      // No critical validators
      expect(sorted.length).toBe(0);
    });
  });

  describe('risk tooltip generation', () => {
    it('generates accurate tooltip for high-risk validator', () => {
      const riskResult = assessRisk({
        osintPorts: [8888, 20000],
        osintVulns: ['CVE-1', 'CVE-2'],
        osintReputation: 'clean',
        isValidator: true,
        ipAddress: '10.0.0.1',
      });

      const tooltip = formatRiskTooltip(riskResult);

      expect(tooltip).toContain('HIGH');
      expect(tooltip).toContain('CVE');
      expect(tooltip).toContain('Validator');
    });

    it('generates accurate tooltip for unknown risk', () => {
      const riskResult = assessRisk({
        osintPorts: [],
        osintVulns: [],
        osintReputation: 'unknown',
        isValidator: false,
        ipAddress: null,
      });

      const tooltip = formatRiskTooltip(riskResult);

      expect(tooltip).toContain('UNKNOWN');
      expect(tooltip).toContain('No IP');
    });

    it('uses cached riskReasons from node instead of recalculating', () => {
      const node = createNodeFromRawData({
        nodeId: 'test',
        nodeName: 'Test Node',
        isValidator: true,
        ipAddress: '10.0.0.1',
        port: 8888,
        osintPorts: [8888],
        osintVulns: ['CVE-1'],
        osintReputation: 'clean',
        osintTags: [],
        osintLastScan: new Date(),
      });

      // Node should have cached reasons
      expect(node.riskReasons).toBeDefined();
      expect(node.riskReasons.length).toBeGreaterThan(0);

      // Can format tooltip from cached reasons without recalculating
      const tooltip = `${node.riskLevel.toUpperCase()}: ${node.riskReasons.join(' • ')}`;
      expect(tooltip).toContain('HIGH');
    });
  });

  describe('single-pass stats calculation', () => {
    it('calculates stats in one pass matching individual filters', () => {
      const testNodes: AttackSurfaceNode[] = [
        createNodeFromRawData({
          nodeId: 'v1',
          nodeName: 'Validator One',
          isValidator: true,
          ipAddress: '10.0.0.1',
          port: 8888,
          osintPorts: [8888, 20000],
          osintVulns: ['CVE-1'],
          osintReputation: 'clean',
          osintTags: [],
          osintLastScan: new Date(),
        }),
        createNodeFromRawData({
          nodeId: 'n1',
          nodeName: 'Node One',
          isValidator: false,
          ipAddress: null,
          port: null,
          osintPorts: [],
          osintVulns: [],
          osintReputation: 'unknown',
          osintTags: [],
          osintLastScan: null,
        }),
      ];

      const stats = calculateStats(testNodes);

      // Verify counts match what individual filters would return
      expect(stats.total).toBe(2);
      expect(stats.withIp).toBe(1);
      expect(stats.withoutIp).toBe(1);
      expect(stats.validators).toBe(1);
      expect(stats.validatorsWithIp).toBe(1);
      expect(stats.riskLevels.high).toBe(1);
      expect(stats.riskLevels.unknown).toBe(1);
      expect(stats.portExposure.peering).toBe(1);
      expect(stats.portExposure.grpcDefault).toBe(1);
    });
  });
});
