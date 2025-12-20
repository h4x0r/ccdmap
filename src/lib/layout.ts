import type { Node, Edge } from '@xyflow/react';
import type { ConcordiumNodeData } from './transforms';

export interface LayoutOptions {
  width?: number;
  height?: number;
}

/**
 * Node tier classification for hierarchical layout
 */
type NodeTier = 'baker' | 'hub' | 'standard' | 'edge';

function classifyNode(data: ConcordiumNodeData): NodeTier {
  // Bakers are most important - consensus participants
  if (data.isBaker) return 'baker';

  // Hubs have high connectivity (>15 peers)
  if (data.peersCount >= 15) return 'hub';

  // Standard nodes have moderate connectivity (5-15 peers)
  if (data.peersCount >= 5) return 'standard';

  // Edge nodes have low connectivity (<5 peers)
  return 'edge';
}

/**
 * Tiered Arc Layout - "Mission Control" style
 *
 * Organizes nodes into horizontal tiers based on importance:
 * - BAKERS: Top center, largest, most prominent
 * - HUBS: Below bakers, high-connectivity nodes
 * - STANDARD: Middle tier, regular full nodes
 * - EDGE: Bottom, low-connectivity peripheral nodes
 *
 * Within each tier, nodes are distributed in an arc pattern
 * with slight vertical variance for visual interest.
 */
export function getLayoutedElements(
  nodes: Node<ConcordiumNodeData>[],
  edges: Edge[],
  options: LayoutOptions = {}
): { nodes: Node<ConcordiumNodeData>[]; edges: Edge[] } {
  const { width = 1400, height = 900 } = options;

  if (nodes.length === 0) return { nodes, edges };

  // Classify nodes into tiers
  const tiers: Record<NodeTier, Node<ConcordiumNodeData>[]> = {
    baker: [],
    hub: [],
    standard: [],
    edge: [],
  };

  for (const node of nodes) {
    const tier = classifyNode(node.data);
    tiers[tier].push(node);
  }

  // Sort nodes within each tier by peer count (highest first for prominence)
  for (const tier of Object.keys(tiers) as NodeTier[]) {
    tiers[tier].sort((a, b) => b.data.peersCount - a.data.peersCount);
  }

  // Tier configuration: Y position and arc settings
  const tierConfig: Record<NodeTier, { y: number; arcHeight: number; label: string }> = {
    baker: { y: 80, arcHeight: 30, label: 'BAKERS' },
    hub: { y: 250, arcHeight: 40, label: 'HUBS' },
    standard: { y: 480, arcHeight: 60, label: 'STANDARD' },
    edge: { y: 750, arcHeight: 50, label: 'EDGE' },
  };

  const layoutedNodes: Node<ConcordiumNodeData>[] = [];
  const centerX = width / 2;
  const padding = 100;
  const usableWidth = width - padding * 2;

  // Position nodes in each tier
  for (const tier of Object.keys(tiers) as NodeTier[]) {
    const tierNodes = tiers[tier];
    const config = tierConfig[tier];
    const count = tierNodes.length;

    if (count === 0) continue;

    // Calculate spacing - ensure nodes don't overlap
    // For small counts, spread more; for large counts, pack tighter
    const maxSpread = Math.min(usableWidth, count * 80);
    const startX = centerX - maxSpread / 2;

    tierNodes.forEach((node, index) => {
      // Horizontal position: evenly distributed across tier width
      const progress = count === 1 ? 0.5 : index / (count - 1);
      const x = startX + progress * maxSpread;

      // Vertical position: arc curve (parabola centered at middle)
      // Nodes at edges are slightly higher than center
      const arcProgress = (progress - 0.5) * 2; // -1 to 1
      const arcOffset = config.arcHeight * (1 - arcProgress * arcProgress);
      const y = config.y + arcOffset;

      // Add small random jitter for organic feel (but consistent per node)
      const jitterX = ((hashCode(node.id) % 20) - 10);
      const jitterY = ((hashCode(node.id + 'y') % 10) - 5);

      layoutedNodes.push({
        ...node,
        position: {
          x: x + jitterX,
          y: y + jitterY,
        },
        data: {
          ...node.data,
          tier, // Add tier info for styling
        },
      });
    });
  }

  return { nodes: layoutedNodes, edges };
}

/**
 * Simple string hash for consistent jitter
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
