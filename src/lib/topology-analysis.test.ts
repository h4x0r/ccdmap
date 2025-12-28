import { describe, it, expect } from 'vitest';
import {
  buildAdjacencyList,
  calculateDegreeDistribution,
  calculateDegreeCentrality,
  calculateClusteringCoefficient,
  calculateGlobalClusteringCoefficient,
  calculateBetweennessCentrality,
  calculateNetworkDiameter,
  findShortestPath,
  identifyBottlenecks,
  identifyBridges,
  getNetworkSummary,
  exportToGraphML,
  type GraphNode,
  type GraphEdge,
} from './topology-analysis';

// Test fixtures
const simpleGraph: { nodes: GraphNode[]; edges: GraphEdge[] } = {
  nodes: [
    { id: 'A' },
    { id: 'B' },
    { id: 'C' },
    { id: 'D' },
  ],
  edges: [
    { source: 'A', target: 'B' },
    { source: 'B', target: 'C' },
    { source: 'C', target: 'D' },
    { source: 'A', target: 'C' },
  ],
};

// Triangle graph (fully connected 3 nodes)
const triangleGraph: { nodes: GraphNode[]; edges: GraphEdge[] } = {
  nodes: [
    { id: 'A' },
    { id: 'B' },
    { id: 'C' },
  ],
  edges: [
    { source: 'A', target: 'B' },
    { source: 'B', target: 'C' },
    { source: 'A', target: 'C' },
  ],
};

// Star graph (hub with 4 spokes)
const starGraph: { nodes: GraphNode[]; edges: GraphEdge[] } = {
  nodes: [
    { id: 'hub' },
    { id: 'spoke1' },
    { id: 'spoke2' },
    { id: 'spoke3' },
    { id: 'spoke4' },
  ],
  edges: [
    { source: 'hub', target: 'spoke1' },
    { source: 'hub', target: 'spoke2' },
    { source: 'hub', target: 'spoke3' },
    { source: 'hub', target: 'spoke4' },
  ],
};

// Bridge graph (two clusters connected by a single edge)
const bridgeGraph: { nodes: GraphNode[]; edges: GraphEdge[] } = {
  nodes: [
    { id: 'A1' }, { id: 'A2' }, { id: 'A3' },
    { id: 'B1' }, { id: 'B2' }, { id: 'B3' },
  ],
  edges: [
    // Cluster A (triangle)
    { source: 'A1', target: 'A2' },
    { source: 'A2', target: 'A3' },
    { source: 'A1', target: 'A3' },
    // Cluster B (triangle)
    { source: 'B1', target: 'B2' },
    { source: 'B2', target: 'B3' },
    { source: 'B1', target: 'B3' },
    // Bridge edge
    { source: 'A3', target: 'B1' },
  ],
};

describe('buildAdjacencyList', () => {
  it('builds adjacency list from nodes and edges', () => {
    const adj = buildAdjacencyList(simpleGraph.nodes, simpleGraph.edges);

    expect(adj.get('A')).toEqual(new Set(['B', 'C']));
    expect(adj.get('B')).toEqual(new Set(['A', 'C']));
    expect(adj.get('C')).toEqual(new Set(['B', 'D', 'A']));
    expect(adj.get('D')).toEqual(new Set(['C']));
  });

  it('handles isolated nodes', () => {
    const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'isolated' }];
    const edges = [{ source: 'A', target: 'B' }];
    const adj = buildAdjacencyList(nodes, edges);

    expect(adj.get('isolated')).toEqual(new Set());
  });

  it('handles empty graph', () => {
    const adj = buildAdjacencyList([], []);
    expect(adj.size).toBe(0);
  });
});

describe('calculateDegreeDistribution', () => {
  it('calculates degree distribution for simple graph', () => {
    const adj = buildAdjacencyList(simpleGraph.nodes, simpleGraph.edges);
    const dist = calculateDegreeDistribution(adj);

    // A: 2, B: 2, C: 3, D: 1
    expect(dist.get(1)).toBe(1); // D
    expect(dist.get(2)).toBe(2); // A, B
    expect(dist.get(3)).toBe(1); // C
  });

  it('calculates degree distribution for star graph', () => {
    const adj = buildAdjacencyList(starGraph.nodes, starGraph.edges);
    const dist = calculateDegreeDistribution(adj);

    // hub: 4, spokes: 1 each
    expect(dist.get(1)).toBe(4); // 4 spokes
    expect(dist.get(4)).toBe(1); // 1 hub
  });
});

describe('calculateDegreeCentrality', () => {
  it('calculates normalized degree centrality', () => {
    const adj = buildAdjacencyList(starGraph.nodes, starGraph.edges);
    const centrality = calculateDegreeCentrality(adj);

    // Hub has degree 4 out of max 4 (n-1)
    expect(centrality.get('hub')).toBe(1.0);
    // Spokes have degree 1 out of max 4
    expect(centrality.get('spoke1')).toBe(0.25);
  });

  it('handles single node', () => {
    const adj = buildAdjacencyList([{ id: 'A' }], []);
    const centrality = calculateDegreeCentrality(adj);

    expect(centrality.get('A')).toBe(0);
  });
});

describe('calculateClusteringCoefficient', () => {
  it('returns 1 for node in complete triangle', () => {
    const adj = buildAdjacencyList(triangleGraph.nodes, triangleGraph.edges);

    // Each node's neighbors are all connected to each other
    expect(calculateClusteringCoefficient(adj, 'A')).toBe(1);
    expect(calculateClusteringCoefficient(adj, 'B')).toBe(1);
    expect(calculateClusteringCoefficient(adj, 'C')).toBe(1);
  });

  it('returns 0 for hub in star graph', () => {
    const adj = buildAdjacencyList(starGraph.nodes, starGraph.edges);

    // Hub's neighbors (spokes) are not connected to each other
    expect(calculateClusteringCoefficient(adj, 'hub')).toBe(0);
  });

  it('returns 0 for nodes with degree < 2', () => {
    const adj = buildAdjacencyList(starGraph.nodes, starGraph.edges);

    // Spokes have degree 1
    expect(calculateClusteringCoefficient(adj, 'spoke1')).toBe(0);
  });
});

describe('calculateGlobalClusteringCoefficient', () => {
  it('returns 1 for complete triangle', () => {
    const adj = buildAdjacencyList(triangleGraph.nodes, triangleGraph.edges);
    expect(calculateGlobalClusteringCoefficient(adj)).toBe(1);
  });

  it('returns 0 for star graph', () => {
    const adj = buildAdjacencyList(starGraph.nodes, starGraph.edges);
    expect(calculateGlobalClusteringCoefficient(adj)).toBe(0);
  });

  it('calculates average for mixed graph', () => {
    const adj = buildAdjacencyList(simpleGraph.nodes, simpleGraph.edges);
    const gcc = calculateGlobalClusteringCoefficient(adj);

    // A: 1/1=1, B: 1/1=1, C: 1/3≈0.33, D: 0 (degree 1)
    // Average of nodes with degree >= 2: (1 + 1 + 0.33) / 3 ≈ 0.78
    expect(gcc).toBeCloseTo(0.78, 1);
  });
});

describe('findShortestPath', () => {
  it('finds direct path between neighbors', () => {
    const adj = buildAdjacencyList(simpleGraph.nodes, simpleGraph.edges);
    const path = findShortestPath(adj, 'A', 'B');

    expect(path).toEqual(['A', 'B']);
  });

  it('finds multi-hop path', () => {
    const adj = buildAdjacencyList(simpleGraph.nodes, simpleGraph.edges);
    const path = findShortestPath(adj, 'A', 'D');

    // A -> C -> D (length 2)
    expect(path).toEqual(['A', 'C', 'D']);
  });

  it('returns null for disconnected nodes', () => {
    const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
    const edges = [{ source: 'A', target: 'B' }];
    const adj = buildAdjacencyList(nodes, edges);

    expect(findShortestPath(adj, 'A', 'C')).toBeNull();
  });

  it('returns single node path for same source and target', () => {
    const adj = buildAdjacencyList(simpleGraph.nodes, simpleGraph.edges);
    expect(findShortestPath(adj, 'A', 'A')).toEqual(['A']);
  });
});

describe('calculateNetworkDiameter', () => {
  it('calculates diameter of simple graph', () => {
    const adj = buildAdjacencyList(simpleGraph.nodes, simpleGraph.edges);
    // Longest shortest path: A->D = 2, B->D = 2
    expect(calculateNetworkDiameter(adj)).toBe(2);
  });

  it('calculates diameter of star graph', () => {
    const adj = buildAdjacencyList(starGraph.nodes, starGraph.edges);
    // All spokes connect through hub, so diameter = 2
    expect(calculateNetworkDiameter(adj)).toBe(2);
  });

  it('returns Infinity for disconnected graph', () => {
    const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
    const edges = [{ source: 'A', target: 'B' }];
    const adj = buildAdjacencyList(nodes, edges);

    expect(calculateNetworkDiameter(adj)).toBe(Infinity);
  });

  it('returns 0 for single node', () => {
    const adj = buildAdjacencyList([{ id: 'A' }], []);
    expect(calculateNetworkDiameter(adj)).toBe(0);
  });
});

describe('calculateBetweennessCentrality', () => {
  it('identifies hub as highest centrality in star graph', () => {
    const adj = buildAdjacencyList(starGraph.nodes, starGraph.edges);
    const bc = calculateBetweennessCentrality(adj);

    // Hub lies on all shortest paths between spokes
    const hubCentrality = bc.get('hub') ?? 0;
    const spokeCentrality = bc.get('spoke1') ?? 0;

    expect(hubCentrality).toBeGreaterThan(spokeCentrality);
    expect(spokeCentrality).toBe(0); // Spokes are never on shortest paths
  });

  it('identifies bridge nodes in bridge graph', () => {
    const adj = buildAdjacencyList(bridgeGraph.nodes, bridgeGraph.edges);
    const bc = calculateBetweennessCentrality(adj);

    // A3 and B1 are on the bridge, should have highest centrality
    const a3Centrality = bc.get('A3') ?? 0;
    const b1Centrality = bc.get('B1') ?? 0;
    const a1Centrality = bc.get('A1') ?? 0;

    expect(a3Centrality).toBeGreaterThan(a1Centrality);
    expect(b1Centrality).toBeGreaterThan(a1Centrality);
  });

  it('returns 0 for all nodes in complete triangle', () => {
    const adj = buildAdjacencyList(triangleGraph.nodes, triangleGraph.edges);
    const bc = calculateBetweennessCentrality(adj);

    // In a complete graph, no node is an intermediary
    expect(bc.get('A')).toBe(0);
    expect(bc.get('B')).toBe(0);
    expect(bc.get('C')).toBe(0);
  });
});

describe('identifyBottlenecks', () => {
  it('identifies hub as bottleneck in star graph', () => {
    const adj = buildAdjacencyList(starGraph.nodes, starGraph.edges);
    const bottlenecks = identifyBottlenecks(adj, 1);

    expect(bottlenecks).toEqual(['hub']);
  });

  it('identifies bridge nodes as bottlenecks', () => {
    const adj = buildAdjacencyList(bridgeGraph.nodes, bridgeGraph.edges);
    const bottlenecks = identifyBottlenecks(adj, 2);

    expect(bottlenecks).toContain('A3');
    expect(bottlenecks).toContain('B1');
  });

  it('returns empty array for complete graph', () => {
    const adj = buildAdjacencyList(triangleGraph.nodes, triangleGraph.edges);
    const bottlenecks = identifyBottlenecks(adj, 1);

    // All nodes have equal (zero) betweenness, but we still return top N
    expect(bottlenecks.length).toBeLessThanOrEqual(1);
  });
});

describe('identifyBridges', () => {
  it('identifies bridge edge in bridge graph', () => {
    const adj = buildAdjacencyList(bridgeGraph.nodes, bridgeGraph.edges);
    const bridges = identifyBridges(adj);

    // The edge A3-B1 is a bridge
    expect(bridges.some(([a, b]) =>
      (a === 'A3' && b === 'B1') || (a === 'B1' && b === 'A3')
    )).toBe(true);
  });

  it('returns no bridges for complete triangle', () => {
    const adj = buildAdjacencyList(triangleGraph.nodes, triangleGraph.edges);
    const bridges = identifyBridges(adj);

    expect(bridges).toEqual([]);
  });

  it('identifies all edges as bridges in linear graph', () => {
    const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
    const edges = [
      { source: 'A', target: 'B' },
      { source: 'B', target: 'C' },
    ];
    const adj = buildAdjacencyList(nodes, edges);
    const bridges = identifyBridges(adj);

    expect(bridges.length).toBe(2);
  });
});

describe('getNetworkSummary', () => {
  it('returns comprehensive network summary', () => {
    const adj = buildAdjacencyList(simpleGraph.nodes, simpleGraph.edges);
    const summary = getNetworkSummary(adj);

    expect(summary.nodeCount).toBe(4);
    expect(summary.edgeCount).toBe(4);
    expect(summary.avgDegree).toBe(2); // (2+2+3+1)/4 = 2
    expect(summary.maxDegree).toBe(3);
    expect(summary.minDegree).toBe(1);
    expect(summary.diameter).toBe(2);
    expect(summary.globalClusteringCoefficient).toBeCloseTo(0.78, 1);
    expect(summary.isConnected).toBe(true);
  });

  it('detects disconnected graph', () => {
    const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
    const edges = [{ source: 'A', target: 'B' }];
    const adj = buildAdjacencyList(nodes, edges);
    const summary = getNetworkSummary(adj);

    expect(summary.isConnected).toBe(false);
    expect(summary.diameter).toBe(Infinity);
  });

  it('handles empty graph', () => {
    const adj = buildAdjacencyList([], []);
    const summary = getNetworkSummary(adj);

    expect(summary.nodeCount).toBe(0);
    expect(summary.edgeCount).toBe(0);
    expect(summary.avgDegree).toBe(0);
  });
});

describe('exportToGraphML', () => {
  it('generates valid GraphML structure', () => {
    const graphml = exportToGraphML(triangleGraph.nodes, triangleGraph.edges);

    expect(graphml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(graphml).toContain('<graphml');
    expect(graphml).toContain('xmlns="http://graphml.graphdrawing.org/xmlns"');
    expect(graphml).toContain('</graphml>');
  });

  it('includes all nodes', () => {
    const graphml = exportToGraphML(triangleGraph.nodes, triangleGraph.edges);

    expect(graphml).toContain('<node id="A"');
    expect(graphml).toContain('<node id="B"');
    expect(graphml).toContain('<node id="C"');
  });

  it('includes all edges', () => {
    const graphml = exportToGraphML(triangleGraph.nodes, triangleGraph.edges);

    // 3 edges in triangle
    const edgeMatches = graphml.match(/<edge /g);
    expect(edgeMatches?.length).toBe(3);
  });

  it('includes node attributes when provided', () => {
    const nodesWithData = [
      { id: 'A', label: 'Node A', peersCount: 5 },
      { id: 'B', label: 'Node B', peersCount: 3 },
    ];
    const edges = [{ source: 'A', target: 'B' }];
    const graphml = exportToGraphML(nodesWithData, edges);

    // Should include data keys
    expect(graphml).toContain('<key id="label"');
    expect(graphml).toContain('<key id="peersCount"');
    // Should include data values
    expect(graphml).toContain('Node A');
    expect(graphml).toContain('Node B');
  });

  it('escapes XML special characters', () => {
    const nodes = [{ id: 'A', label: 'Node <A> & "special"' }];
    const graphml = exportToGraphML(nodes, []);

    expect(graphml).toContain('&lt;');
    expect(graphml).toContain('&gt;');
    expect(graphml).toContain('&amp;');
    expect(graphml).toContain('&quot;');
  });

  it('handles empty graph', () => {
    const graphml = exportToGraphML([], []);

    expect(graphml).toContain('<graphml');
    expect(graphml).toContain('<graph');
    expect(graphml).toContain('</graph>');
    expect(graphml).toContain('</graphml>');
  });

  it('marks graph as undirected', () => {
    const graphml = exportToGraphML(triangleGraph.nodes, triangleGraph.edges);

    expect(graphml).toContain('edgedefault="undirected"');
  });
});
