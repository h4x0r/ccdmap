import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';
import type { Node, Edge } from '@xyflow/react';

interface SimNode extends SimulationNodeDatum {
  id: string;
  width: number;
  height: number;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  source: string | SimNode;
  target: string | SimNode;
}

export interface LayoutOptions {
  width?: number;
  height?: number;
  iterations?: number;
}

/**
 * Apply force-directed layout algorithm to minimize edge crossings
 * Uses d3-force with:
 * - Link force: keeps connected nodes at optimal distance
 * - Many-body force: nodes repel each other
 * - Collision force: prevents node overlap
 * - Center force: keeps graph centered
 */
export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): { nodes: Node[]; edges: Edge[] } {
  const { width = 1200, height = 800, iterations = 300 } = options;

  if (nodes.length === 0) return { nodes, edges };

  // Create simulation nodes
  const simNodes: SimNode[] = nodes.map((node) => ({
    id: node.id,
    x: node.position.x || Math.random() * width,
    y: node.position.y || Math.random() * height,
    width: 50,
    height: 50,
  }));

  // Create simulation links
  const simLinks: SimLink[] = edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
  }));

  // Create force simulation
  const simulation = forceSimulation<SimNode>(simNodes)
    // Link force - connected nodes attract
    .force(
      'link',
      forceLink<SimNode, SimLink>(simLinks)
        .id((d) => d.id)
        .distance(120) // Target distance between linked nodes
        .strength(0.5)
    )
    // Many-body force - all nodes repel
    .force(
      'charge',
      forceManyBody<SimNode>()
        .strength(-800) // Negative = repulsion
        .distanceMax(500)
    )
    // Collision force - prevent overlap
    .force(
      'collide',
      forceCollide<SimNode>()
        .radius(60)
        .strength(0.8)
    )
    // Center force - keep graph centered
    .force('center', forceCenter(width / 2, height / 2))
    .stop();

  // Run simulation synchronously
  for (let i = 0; i < iterations; i++) {
    simulation.tick();
  }

  // Apply positions back to nodes
  const nodeMap = new Map(simNodes.map((n) => [n.id, n]));
  const layoutedNodes = nodes.map((node) => {
    const simNode = nodeMap.get(node.id);
    return {
      ...node,
      position: {
        x: simNode?.x ?? node.position.x,
        y: simNode?.y ?? node.position.y,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
