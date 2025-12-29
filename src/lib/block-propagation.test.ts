import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculatePropagationWaves,
  getPropagationDelay,
  getWaveColor,
  type PropagationNode,
  type PropagationWave,
} from './block-propagation';

describe('Block Propagation Animation', () => {
  describe('calculatePropagationWaves', () => {
    it('returns single wave with origin node at wave 0', () => {
      const nodes: PropagationNode[] = [
        { id: 'node1', blockHeight: 100 },
        { id: 'node2', blockHeight: 99 },
        { id: 'node3', blockHeight: 99 },
      ];
      const edges = [
        { source: 'node1', target: 'node2' },
        { source: 'node1', target: 'node3' },
      ];

      const result = calculatePropagationWaves(nodes, edges, 'node1');

      expect(result.waves.length).toBeGreaterThanOrEqual(1);
      expect(result.waves[0].nodeIds).toContain('node1');
      expect(result.waves[0].waveNumber).toBe(0);
    });

    it('places directly connected nodes in wave 1', () => {
      const nodes: PropagationNode[] = [
        { id: 'origin', blockHeight: 100 },
        { id: 'neighbor1', blockHeight: 99 },
        { id: 'neighbor2', blockHeight: 99 },
      ];
      const edges = [
        { source: 'origin', target: 'neighbor1' },
        { source: 'origin', target: 'neighbor2' },
      ];

      const result = calculatePropagationWaves(nodes, edges, 'origin');

      const wave1 = result.waves.find((w) => w.waveNumber === 1);
      expect(wave1).toBeDefined();
      expect(wave1!.nodeIds).toContain('neighbor1');
      expect(wave1!.nodeIds).toContain('neighbor2');
    });

    it('places nodes at correct distance in subsequent waves', () => {
      const nodes: PropagationNode[] = [
        { id: 'origin', blockHeight: 100 },
        { id: 'hop1', blockHeight: 99 },
        { id: 'hop2', blockHeight: 99 },
      ];
      const edges = [
        { source: 'origin', target: 'hop1' },
        { source: 'hop1', target: 'hop2' },
      ];

      const result = calculatePropagationWaves(nodes, edges, 'origin');

      const wave2 = result.waves.find((w) => w.waveNumber === 2);
      expect(wave2).toBeDefined();
      expect(wave2!.nodeIds).toContain('hop2');
    });

    it('returns empty waves array when origin not found', () => {
      const nodes: PropagationNode[] = [{ id: 'node1', blockHeight: 100 }];
      const edges: { source: string; target: string }[] = [];

      const result = calculatePropagationWaves(nodes, edges, 'nonexistent');

      expect(result.waves).toHaveLength(0);
    });

    it('handles disconnected graph components', () => {
      const nodes: PropagationNode[] = [
        { id: 'origin', blockHeight: 100 },
        { id: 'connected', blockHeight: 99 },
        { id: 'disconnected', blockHeight: 98 },
      ];
      const edges = [{ source: 'origin', target: 'connected' }];

      const result = calculatePropagationWaves(nodes, edges, 'origin');

      // disconnected node should not be in any wave
      const allNodeIds = result.waves.flatMap((w) => w.nodeIds);
      expect(allNodeIds).not.toContain('disconnected');
    });
  });

  describe('getPropagationDelay', () => {
    it('returns 0ms for wave 0 (origin)', () => {
      const result = getPropagationDelay(0);
      expect(result).toBe(0);
    });

    it('returns base delay for wave 1', () => {
      const result = getPropagationDelay(1);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(200);
    });

    it('returns increasing delays for higher waves', () => {
      const delay1 = getPropagationDelay(1);
      const delay2 = getPropagationDelay(2);
      const delay3 = getPropagationDelay(3);

      expect(delay2).toBeGreaterThan(delay1);
      expect(delay3).toBeGreaterThan(delay2);
    });

    it('caps delay at maximum value', () => {
      const result = getPropagationDelay(100);
      expect(result).toBeLessThanOrEqual(2000);
    });
  });

  describe('getWaveColor', () => {
    it('returns bright color for wave 0 (origin)', () => {
      const result = getWaveColor(0);
      expect(result).toMatch(/^#|^rgb|^hsl/);
    });

    it('returns different colors for different waves', () => {
      const color0 = getWaveColor(0);
      const color1 = getWaveColor(1);
      const color2 = getWaveColor(2);

      // Not all colors should be the same
      const unique = new Set([color0, color1, color2]);
      expect(unique.size).toBeGreaterThanOrEqual(2);
    });

    it('returns valid color for high wave numbers', () => {
      const result = getWaveColor(10);
      expect(result).toMatch(/^#|^rgb|^hsl/);
    });
  });
});
