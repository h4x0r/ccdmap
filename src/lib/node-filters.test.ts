import { describe, it, expect } from 'vitest';
import {
  filterNodes,
  type NodeFilterCriteria,
  type FilterableNode,
} from './node-filters';

describe('Node Filters', () => {
  const sampleNodes: FilterableNode[] = [
    { id: 'n1', tier: 'baker', health: 'healthy' },
    { id: 'n2', tier: 'hub', health: 'healthy' },
    { id: 'n3', tier: 'standard', health: 'lagging' },
    { id: 'n4', tier: 'edge', health: 'issue' },
    { id: 'n5', tier: 'baker', health: 'lagging' },
    { id: 'n6', tier: 'standard', health: 'healthy' },
  ];

  describe('filterNodes', () => {
    it('returns all nodes when no filters are applied', () => {
      const criteria: NodeFilterCriteria = {
        tiers: [],
        health: [],
      };

      const result = filterNodes(sampleNodes, criteria);

      expect(result).toHaveLength(6);
    });

    it('filters by single tier', () => {
      const criteria: NodeFilterCriteria = {
        tiers: ['baker'],
        health: [],
      };

      const result = filterNodes(sampleNodes, criteria);

      expect(result).toHaveLength(2);
      expect(result.every((n) => n.tier === 'baker')).toBe(true);
    });

    it('filters by multiple tiers', () => {
      const criteria: NodeFilterCriteria = {
        tiers: ['baker', 'hub'],
        health: [],
      };

      const result = filterNodes(sampleNodes, criteria);

      expect(result).toHaveLength(3);
      expect(result.every((n) => ['baker', 'hub'].includes(n.tier))).toBe(true);
    });

    it('filters by single health status', () => {
      const criteria: NodeFilterCriteria = {
        tiers: [],
        health: ['healthy'],
      };

      const result = filterNodes(sampleNodes, criteria);

      expect(result).toHaveLength(3);
      expect(result.every((n) => n.health === 'healthy')).toBe(true);
    });

    it('filters by multiple health statuses', () => {
      const criteria: NodeFilterCriteria = {
        tiers: [],
        health: ['lagging', 'issue'],
      };

      const result = filterNodes(sampleNodes, criteria);

      expect(result).toHaveLength(3);
      expect(result.every((n) => ['lagging', 'issue'].includes(n.health))).toBe(true);
    });

    it('combines tier and health filters (AND logic)', () => {
      const criteria: NodeFilterCriteria = {
        tiers: ['baker'],
        health: ['healthy'],
      };

      const result = filterNodes(sampleNodes, criteria);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('n1');
    });

    it('returns empty array when no nodes match', () => {
      const criteria: NodeFilterCriteria = {
        tiers: ['edge'],
        health: ['healthy'],
      };

      const result = filterNodes(sampleNodes, criteria);

      expect(result).toHaveLength(0);
    });

    it('handles empty node array', () => {
      const criteria: NodeFilterCriteria = {
        tiers: ['baker'],
        health: ['healthy'],
      };

      const result = filterNodes([], criteria);

      expect(result).toHaveLength(0);
    });

    it('preserves node order after filtering', () => {
      const criteria: NodeFilterCriteria = {
        tiers: ['standard'],
        health: [],
      };

      const result = filterNodes(sampleNodes, criteria);

      expect(result.map((n) => n.id)).toEqual(['n3', 'n6']);
    });
  });
});
