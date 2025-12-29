import { describe, it, expect } from 'vitest';
import type { Node } from '@xyflow/react';
import {
  getCentralityBucket,
  getCentralityColumn,
  getGridLayoutedElements,
  CENTRALITY_BUCKETS,
} from './layout';
import type { ConcordiumNodeData, ConcordiumNode } from './transforms';

// Helper to create mock node data
function createMockNode(overrides: Partial<{
  id: string;
  peersCount: number;
  isBaker: boolean;
  centrality: number;
}>): Node<ConcordiumNodeData> {
  const id = overrides.id ?? 'test-node';
  const mockConcordiumNode: ConcordiumNode = {
    nodeId: id,
    nodeName: `Node ${id}`,
    peerType: 'Node',
    client: 'concordium-node/6.3.0',
    uptime: 3600000,
    genesisBlock: 'genesis',
    peersCount: overrides.peersCount ?? 5,
    peersList: [],
    averagePing: 50,
    averageBytesPerSecondIn: 1000,
    averageBytesPerSecondOut: 500,
    packetsSent: 1000,
    packetsReceived: 1000,
    bestBlock: 'block',
    bestBlockHeight: 1000000,
    bestBlockBakerId: null,
    bestArrivedTime: null,
    bestBlockTransactionCount: 10,
    bestBlockTransactionsSize: 1000,
    bestBlockTransactionEnergyCost: 100,
    bestBlockExecutionCost: null,
    bestBlockTotalAmount: 1000000,
    bestBlockTotalEncryptedAmount: 0,
    bestBlockCentralBankAmount: 0,
    blockArrivePeriodEMA: null,
    blockArrivePeriodEMSD: null,
    blockArriveLatencyEMA: null,
    blockArriveLatencyEMSD: null,
    blockReceivePeriodEMA: null,
    blockReceivePeriodEMSD: null,
    blockReceiveLatencyEMA: null,
    blockReceiveLatencyEMSD: null,
    blocksReceivedCount: 100,
    blocksVerifiedCount: 100,
    finalizedBlock: 'finalized',
    finalizedBlockHeight: 1000000,
    finalizedBlockParent: 'parent',
    finalizedTime: null,
    finalizationPeriodEMA: null,
    finalizationPeriodEMSD: null,
    finalizationCount: 100,
    consensusRunning: true,
    bakingCommitteeMember: overrides.isBaker ? 'ActiveInCommittee' : 'NotInCommittee',
    finalizationCommitteeMember: false,
    consensusBakerId: overrides.isBaker ? 1 : null,
    transactionsPerBlockEMA: null,
    transactionsPerBlockEMSD: null,
  };

  return {
    id,
    type: 'concordiumNode',
    position: { x: 0, y: 0 },
    data: {
      label: `Node ${id}`,
      peersCount: overrides.peersCount ?? 5,
      health: 'healthy',
      isBaker: overrides.isBaker ?? false,
      node: mockConcordiumNode,
      centrality: overrides.centrality,
    },
  };
}

describe('Centrality Bucket Calculation', () => {
  describe('getCentralityBucket', () => {
    it('returns bucket 0 for centrality 0', () => {
      expect(getCentralityBucket(0)).toBe(0);
    });

    it('returns bucket 0 for very low centrality (0.1)', () => {
      expect(getCentralityBucket(0.1)).toBe(0);
    });

    it('returns bucket 1 for centrality 0.15', () => {
      expect(getCentralityBucket(0.15)).toBe(1);
    });

    it('returns bucket 2 for centrality 0.3', () => {
      expect(getCentralityBucket(0.3)).toBe(2);
    });

    it('returns bucket 3 for centrality 0.5', () => {
      expect(getCentralityBucket(0.5)).toBe(3);
    });

    it('returns bucket 4 for centrality 0.6', () => {
      expect(getCentralityBucket(0.6)).toBe(4);
    });

    it('returns bucket 5 for centrality 0.75', () => {
      expect(getCentralityBucket(0.75)).toBe(5);
    });

    it('returns bucket 6 for centrality 0.9', () => {
      expect(getCentralityBucket(0.9)).toBe(6);
    });

    it('returns bucket 6 for centrality 1.0', () => {
      expect(getCentralityBucket(1.0)).toBe(6);
    });

    it('returns bucket 0 for undefined centrality', () => {
      expect(getCentralityBucket(undefined)).toBe(0);
    });

    it('returns bucket 0 for negative centrality', () => {
      expect(getCentralityBucket(-0.5)).toBe(0);
    });

    it('returns bucket 6 for centrality > 1', () => {
      expect(getCentralityBucket(1.5)).toBe(6);
    });
  });

  describe('getCentralityColumn', () => {
    // Column layout (7 columns, center = highest centrality):
    // [0] [1] [2] [3:center] [4] [5] [6]
    // Bucket 6 (highest) -> column 3 (center)
    // Bucket 5 -> columns 2 and 4
    // Bucket 4 -> columns 2 and 4
    // etc.

    it('places highest centrality (bucket 6) in center column 3', () => {
      expect(getCentralityColumn(6)).toBe(3);
    });

    it('places bucket 5 near center (column 2 or 4)', () => {
      const col = getCentralityColumn(5);
      expect([2, 4]).toContain(col);
    });

    it('places bucket 0 (lowest/isolated) in rightmost column 6', () => {
      expect(getCentralityColumn(0)).toBe(6);
    });

    it('places bucket 1 in column 5', () => {
      expect(getCentralityColumn(1)).toBe(5);
    });
  });

  describe('CENTRALITY_BUCKETS constant', () => {
    it('has 7 buckets', () => {
      expect(CENTRALITY_BUCKETS).toBe(7);
    });
  });
});

describe('Grid Layout', () => {
  describe('getGridLayoutedElements', () => {
    it('returns empty result for empty input', () => {
      const result = getGridLayoutedElements([], []);
      expect(result.nodes).toHaveLength(0);
      expect(result.edges).toHaveLength(0);
      expect(result.tierLabels).toHaveLength(0);
      expect(result.columnLabels).toHaveLength(0);
    });

    it('assigns tier based on node properties', () => {
      const nodes = [
        createMockNode({ id: 'baker1', isBaker: true, peersCount: 10 }),
        createMockNode({ id: 'hub1', peersCount: 20 }),
        createMockNode({ id: 'standard1', peersCount: 8 }),
        createMockNode({ id: 'edge1', peersCount: 2 }),
      ];

      const result = getGridLayoutedElements(nodes, []);

      const tierMap = new Map(result.nodes.map((n) => [n.id, n.data.tier]));
      expect(tierMap.get('baker1')).toBe('baker');
      expect(tierMap.get('hub1')).toBe('hub');
      expect(tierMap.get('standard1')).toBe('standard');
      expect(tierMap.get('edge1')).toBe('edge');
    });

    it('positions baker tier at top (lowest Y)', () => {
      const nodes = [
        createMockNode({ id: 'baker1', isBaker: true }),
        createMockNode({ id: 'edge1', peersCount: 2 }),
      ];

      const result = getGridLayoutedElements(nodes, []);

      const bakerNode = result.nodes.find((n) => n.id === 'baker1')!;
      const edgeNode = result.nodes.find((n) => n.id === 'edge1')!;
      expect(bakerNode.position.y).toBeLessThan(edgeNode.position.y);
    });

    it('positions high centrality nodes toward center (column 3)', () => {
      const nodes = [
        createMockNode({ id: 'high', peersCount: 8, centrality: 0.95 }),
        createMockNode({ id: 'low', peersCount: 8, centrality: 0.05 }),
      ];

      const result = getGridLayoutedElements(nodes, [], { width: 1400 });

      const highNode = result.nodes.find((n) => n.id === 'high')!;
      const lowNode = result.nodes.find((n) => n.id === 'low')!;

      // High centrality should be closer to center X
      const centerX = 700;
      const highDistFromCenter = Math.abs(highNode.position.x - centerX);
      const lowDistFromCenter = Math.abs(lowNode.position.x - centerX);
      expect(highDistFromCenter).toBeLessThan(lowDistFromCenter);
    });

    it('positions isolated nodes (no centrality) in rightmost column', () => {
      const nodes = [
        createMockNode({ id: 'isolated', peersCount: 0, centrality: undefined }),
        createMockNode({ id: 'connected', peersCount: 8, centrality: 0.5 }),
      ];

      const result = getGridLayoutedElements(nodes, [], { width: 1400 });

      const isolatedNode = result.nodes.find((n) => n.id === 'isolated')!;
      const connectedNode = result.nodes.find((n) => n.id === 'connected')!;

      // Isolated node should be further right
      expect(isolatedNode.position.x).toBeGreaterThan(connectedNode.position.x);
    });

    it('vertically aligns nodes with same centrality bucket across tiers', () => {
      const nodes = [
        createMockNode({ id: 'baker1', isBaker: true, centrality: 0.9 }),
        createMockNode({ id: 'hub1', peersCount: 20, centrality: 0.9 }),
        createMockNode({ id: 'standard1', peersCount: 8, centrality: 0.9 }),
      ];

      const result = getGridLayoutedElements(nodes, [], { width: 1400 });

      const bakerX = result.nodes.find((n) => n.id === 'baker1')!.position.x;
      const hubX = result.nodes.find((n) => n.id === 'hub1')!.position.x;
      const standardX = result.nodes.find((n) => n.id === 'standard1')!.position.x;

      // All should have same X position (within jitter tolerance of ~20px)
      expect(Math.abs(bakerX - hubX)).toBeLessThan(30);
      expect(Math.abs(hubX - standardX)).toBeLessThan(30);
    });

    it('returns column labels for rendering', () => {
      const nodes = [
        createMockNode({ id: 'node1', peersCount: 8, centrality: 0.5 }),
      ];

      const result = getGridLayoutedElements(nodes, []);

      expect(result.columnLabels).toHaveLength(CENTRALITY_BUCKETS);
      expect(result.columnLabels[3].label).toContain('HIGH');
      expect(result.columnLabels[6].label).toContain('LOW');
    });

    it('preserves edges in output', () => {
      const nodes = [
        createMockNode({ id: 'a', peersCount: 8 }),
        createMockNode({ id: 'b', peersCount: 8 }),
      ];
      const edges = [{ id: 'a-b', source: 'a', target: 'b' }];

      const result = getGridLayoutedElements(nodes, edges);

      expect(result.edges).toHaveLength(1);
      expect(result.edges[0].id).toBe('a-b');
    });

    it('handles single node', () => {
      const nodes = [createMockNode({ id: 'solo', peersCount: 8, centrality: 0.5 })];

      const result = getGridLayoutedElements(nodes, []);

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].position.x).toBeGreaterThan(0);
      expect(result.nodes[0].position.y).toBeGreaterThan(0);
    });
  });
});
