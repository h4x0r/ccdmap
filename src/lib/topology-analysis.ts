/**
 * Topology Analysis Module
 *
 * Pure graph algorithms for analyzing network topology.
 * All functions work on adjacency lists for efficiency.
 */

export interface GraphNode {
  id: string;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export type AdjacencyList = Map<string, Set<string>>;

/**
 * Build an adjacency list from nodes and edges.
 * Treats all edges as undirected.
 */
export function buildAdjacencyList(
  nodes: GraphNode[],
  edges: GraphEdge[]
): AdjacencyList {
  const adj: AdjacencyList = new Map();

  // Initialize all nodes with empty neighbor sets
  for (const node of nodes) {
    adj.set(node.id, new Set());
  }

  // Add edges (undirected)
  for (const edge of edges) {
    adj.get(edge.source)?.add(edge.target);
    adj.get(edge.target)?.add(edge.source);
  }

  return adj;
}

/**
 * Calculate degree distribution: Map from degree -> count of nodes with that degree
 */
export function calculateDegreeDistribution(adj: AdjacencyList): Map<number, number> {
  const distribution = new Map<number, number>();

  for (const neighbors of adj.values()) {
    const degree = neighbors.size;
    distribution.set(degree, (distribution.get(degree) ?? 0) + 1);
  }

  return distribution;
}

/**
 * Calculate normalized degree centrality for all nodes.
 * Degree centrality = degree / (n-1) where n is total nodes.
 */
export function calculateDegreeCentrality(adj: AdjacencyList): Map<string, number> {
  const centrality = new Map<string, number>();
  const n = adj.size;
  const maxDegree = n - 1;

  for (const [nodeId, neighbors] of adj) {
    centrality.set(nodeId, maxDegree > 0 ? neighbors.size / maxDegree : 0);
  }

  return centrality;
}

/**
 * Calculate local clustering coefficient for a node.
 * CC = (actual edges between neighbors) / (possible edges between neighbors)
 * Returns 0 for nodes with degree < 2.
 */
export function calculateClusteringCoefficient(
  adj: AdjacencyList,
  nodeId: string
): number {
  const neighbors = adj.get(nodeId);
  if (!neighbors || neighbors.size < 2) return 0;

  const neighborList = Array.from(neighbors);
  const k = neighborList.length;
  const possibleEdges = (k * (k - 1)) / 2;

  let actualEdges = 0;
  for (let i = 0; i < k; i++) {
    for (let j = i + 1; j < k; j++) {
      const neighborsOfI = adj.get(neighborList[i]);
      if (neighborsOfI?.has(neighborList[j])) {
        actualEdges++;
      }
    }
  }

  return actualEdges / possibleEdges;
}

/**
 * Calculate global clustering coefficient (average of all local coefficients).
 * Only considers nodes with degree >= 2.
 */
export function calculateGlobalClusteringCoefficient(adj: AdjacencyList): number {
  let sum = 0;
  let count = 0;

  for (const [nodeId, neighbors] of adj) {
    if (neighbors.size >= 2) {
      sum += calculateClusteringCoefficient(adj, nodeId);
      count++;
    }
  }

  return count > 0 ? sum / count : 0;
}

/**
 * Find shortest path between two nodes using BFS.
 * Returns the path as array of node IDs, or null if no path exists.
 */
export function findShortestPath(
  adj: AdjacencyList,
  source: string,
  target: string
): string[] | null {
  if (source === target) return [source];
  if (!adj.has(source) || !adj.has(target)) return null;

  const visited = new Set<string>([source]);
  const queue: string[][] = [[source]];

  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1];
    const neighbors = adj.get(current);

    if (!neighbors) continue;

    for (const neighbor of neighbors) {
      if (neighbor === target) {
        return [...path, neighbor];
      }
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }

  return null;
}

/**
 * Calculate network diameter (longest shortest path).
 * Returns Infinity if graph is disconnected.
 */
export function calculateNetworkDiameter(adj: AdjacencyList): number {
  const nodes = Array.from(adj.keys());
  if (nodes.length <= 1) return 0;

  let maxDistance = 0;

  for (const source of nodes) {
    // BFS from this node to find all distances
    const distances = bfsDistances(adj, source);

    for (const distance of distances.values()) {
      if (distance === Infinity) return Infinity;
      maxDistance = Math.max(maxDistance, distance);
    }
  }

  return maxDistance;
}

/**
 * BFS to compute distances from source to all other nodes.
 */
function bfsDistances(adj: AdjacencyList, source: string): Map<string, number> {
  const distances = new Map<string, number>();

  for (const nodeId of adj.keys()) {
    distances.set(nodeId, nodeId === source ? 0 : Infinity);
  }

  const queue: string[] = [source];
  const visited = new Set<string>([source]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDist = distances.get(current)!;
    const neighbors = adj.get(current);

    if (!neighbors) continue;

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        distances.set(neighbor, currentDist + 1);
        queue.push(neighbor);
      }
    }
  }

  return distances;
}

/**
 * Calculate betweenness centrality for all nodes.
 * BC(v) = sum of (shortest paths through v / total shortest paths) for all pairs.
 * Uses Brandes' algorithm for efficiency.
 */
export function calculateBetweennessCentrality(adj: AdjacencyList): Map<string, number> {
  const nodes = Array.from(adj.keys());
  const bc = new Map<string, number>();

  // Initialize all to 0
  for (const node of nodes) {
    bc.set(node, 0);
  }

  // Brandes' algorithm
  for (const source of nodes) {
    // Single-source shortest paths
    const stack: string[] = [];
    const predecessors = new Map<string, string[]>();
    const sigma = new Map<string, number>(); // Number of shortest paths
    const dist = new Map<string, number>();

    for (const node of nodes) {
      predecessors.set(node, []);
      sigma.set(node, 0);
      dist.set(node, -1);
    }

    sigma.set(source, 1);
    dist.set(source, 0);

    const queue: string[] = [source];

    while (queue.length > 0) {
      const v = queue.shift()!;
      stack.push(v);
      const neighbors = adj.get(v);

      if (!neighbors) continue;

      for (const w of neighbors) {
        // First time finding w?
        if (dist.get(w)! < 0) {
          queue.push(w);
          dist.set(w, dist.get(v)! + 1);
        }
        // Shortest path to w via v?
        if (dist.get(w) === dist.get(v)! + 1) {
          sigma.set(w, sigma.get(w)! + sigma.get(v)!);
          predecessors.get(w)!.push(v);
        }
      }
    }

    // Accumulation phase
    const delta = new Map<string, number>();
    for (const node of nodes) {
      delta.set(node, 0);
    }

    while (stack.length > 0) {
      const w = stack.pop()!;
      for (const v of predecessors.get(w)!) {
        const contribution = (sigma.get(v)! / sigma.get(w)!) * (1 + delta.get(w)!);
        delta.set(v, delta.get(v)! + contribution);
      }
      if (w !== source) {
        bc.set(w, bc.get(w)! + delta.get(w)!);
      }
    }
  }

  // Normalize (for undirected graphs, divide by 2)
  for (const [node, value] of bc) {
    bc.set(node, value / 2);
  }

  return bc;
}

/**
 * Identify top N bottleneck nodes (highest betweenness centrality).
 */
export function identifyBottlenecks(adj: AdjacencyList, topN: number): string[] {
  const bc = calculateBetweennessCentrality(adj);
  const sorted = Array.from(bc.entries()).sort((a, b) => b[1] - a[1]);
  return sorted.slice(0, topN).map(([nodeId]) => nodeId);
}

/**
 * Identify bridge edges (edges whose removal disconnects the graph).
 * Uses Tarjan's bridge-finding algorithm.
 */
export function identifyBridges(adj: AdjacencyList): [string, string][] {
  const bridges: [string, string][] = [];
  const nodes = Array.from(adj.keys());

  if (nodes.length === 0) return bridges;

  const visited = new Set<string>();
  const disc = new Map<string, number>(); // Discovery time
  const low = new Map<string, number>(); // Lowest discovery time reachable
  let time = 0;

  function dfs(u: string, parent: string | null): void {
    visited.add(u);
    disc.set(u, time);
    low.set(u, time);
    time++;

    const neighbors = adj.get(u);
    if (!neighbors) return;

    for (const v of neighbors) {
      if (!visited.has(v)) {
        dfs(v, u);
        low.set(u, Math.min(low.get(u)!, low.get(v)!));

        // If lowest reachable from v is higher than discovery of u,
        // then u-v is a bridge
        if (low.get(v)! > disc.get(u)!) {
          bridges.push([u, v]);
        }
      } else if (v !== parent) {
        low.set(u, Math.min(low.get(u)!, disc.get(v)!));
      }
    }
  }

  // Start DFS from first node
  dfs(nodes[0], null);

  return bridges;
}

/**
 * Check if graph is connected (all nodes reachable from any node).
 */
function isGraphConnected(adj: AdjacencyList): boolean {
  const nodes = Array.from(adj.keys());
  if (nodes.length === 0) return true;

  const visited = new Set<string>();
  const queue = [nodes[0]];
  visited.add(nodes[0]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = adj.get(current);

    if (neighbors) {
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
  }

  return visited.size === nodes.length;
}

/**
 * Count total edges in the graph.
 */
function countEdges(adj: AdjacencyList): number {
  let total = 0;
  for (const neighbors of adj.values()) {
    total += neighbors.size;
  }
  // Each edge counted twice (undirected)
  return total / 2;
}

export interface NetworkSummary {
  nodeCount: number;
  edgeCount: number;
  avgDegree: number;
  maxDegree: number;
  minDegree: number;
  diameter: number;
  globalClusteringCoefficient: number;
  isConnected: boolean;
}

/**
 * Get comprehensive network summary statistics.
 */
export function getNetworkSummary(adj: AdjacencyList): NetworkSummary {
  const nodeCount = adj.size;
  const edgeCount = countEdges(adj);

  if (nodeCount === 0) {
    return {
      nodeCount: 0,
      edgeCount: 0,
      avgDegree: 0,
      maxDegree: 0,
      minDegree: 0,
      diameter: 0,
      globalClusteringCoefficient: 0,
      isConnected: true,
    };
  }

  let totalDegree = 0;
  let maxDegree = 0;
  let minDegree = Infinity;

  for (const neighbors of adj.values()) {
    const degree = neighbors.size;
    totalDegree += degree;
    maxDegree = Math.max(maxDegree, degree);
    minDegree = Math.min(minDegree, degree);
  }

  const connected = isGraphConnected(adj);

  return {
    nodeCount,
    edgeCount,
    avgDegree: totalDegree / nodeCount,
    maxDegree,
    minDegree: minDegree === Infinity ? 0 : minDegree,
    diameter: calculateNetworkDiameter(adj),
    globalClusteringCoefficient: calculateGlobalClusteringCoefficient(adj),
    isConnected: connected,
  };
}

/**
 * Escape XML special characters.
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Export graph to GraphML format.
 * GraphML is a standard XML format for graph data, supported by tools like
 * Gephi, yEd, NetworkX, and Cytoscape.
 */
export function exportToGraphML(
  nodes: (GraphNode & Record<string, unknown>)[],
  edges: GraphEdge[]
): string {
  const lines: string[] = [];

  // XML declaration and GraphML root
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<graphml xmlns="http://graphml.graphdrawing.org/xmlns"');
  lines.push('  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"');
  lines.push('  xsi:schemaLocation="http://graphml.graphdrawing.org/xmlns');
  lines.push('    http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd">');

  // Collect all unique attribute keys from nodes (excluding 'id')
  const nodeAttrs = new Set<string>();
  for (const node of nodes) {
    for (const key of Object.keys(node)) {
      if (key !== 'id') {
        nodeAttrs.add(key);
      }
    }
  }

  // Declare attribute keys
  for (const attr of nodeAttrs) {
    const attrType = inferGraphMLType(nodes, attr);
    lines.push(`  <key id="${escapeXml(attr)}" for="node" attr.name="${escapeXml(attr)}" attr.type="${attrType}"/>`);
  }

  // Graph element (undirected)
  lines.push('  <graph id="G" edgedefault="undirected">');

  // Nodes
  for (const node of nodes) {
    lines.push(`    <node id="${escapeXml(node.id)}">`);
    for (const attr of nodeAttrs) {
      const value = node[attr];
      if (value !== undefined && value !== null) {
        lines.push(`      <data key="${escapeXml(attr)}">${escapeXml(String(value))}</data>`);
      }
    }
    lines.push('    </node>');
  }

  // Edges
  let edgeId = 0;
  for (const edge of edges) {
    lines.push(`    <edge id="e${edgeId++}" source="${escapeXml(edge.source)}" target="${escapeXml(edge.target)}"/>`);
  }

  lines.push('  </graph>');
  lines.push('</graphml>');

  return lines.join('\n');
}

/**
 * Infer GraphML data type from values.
 */
function inferGraphMLType(nodes: Record<string, unknown>[], attr: string): string {
  for (const node of nodes) {
    const value = node[attr];
    if (value !== undefined && value !== null) {
      if (typeof value === 'number') {
        return Number.isInteger(value) ? 'int' : 'double';
      }
      if (typeof value === 'boolean') {
        return 'boolean';
      }
    }
  }
  return 'string';
}
