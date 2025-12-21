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
 * Calculate estimated node size based on tier and peer count
 * Mirrors the sizing logic in TopologyGraph.tsx
 */
function estimateNodeSize(tier: NodeTier, peersCount: number): number {
  const tierSizes = {
    baker: { base: 40, max: 70 },
    hub: { base: 25, max: 50 },
    standard: { base: 14, max: 30 },
    edge: { base: 8, max: 18 },
  };

  const tierSize = tierSizes[tier];
  const peerScale = Math.min(peersCount / 20, 1);
  return tierSize.base + (tierSize.max - tierSize.base) * peerScale;
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
 * Large tiers automatically use multiple rows to prevent overlap.
 */
export interface TierLabelInfo {
  tier: string;
  y: number;
  endY: number;
}

export interface LayoutResult {
  nodes: Node<ConcordiumNodeData>[];
  edges: Edge[];
  tierLabels: TierLabelInfo[];
  tierSeparators: { y: number }[];
}

export function getLayoutedElements(
  nodes: Node<ConcordiumNodeData>[],
  edges: Edge[],
  options: LayoutOptions = {}
): LayoutResult {
  const { width = 1400, height = 900 } = options;

  if (nodes.length === 0) return { nodes, edges, tierLabels: [], tierSeparators: [] };

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

  // Tier configuration: arc settings and spacing (Y positions calculated dynamically)
  // minSpacing accounts for largest possible node size + padding
  const tierConfig: Record<NodeTier, {
    arcHeight: number;
    rowSpacing: number;
    minSpacing: number;
    tierGap: number; // gap between this tier and the next
    label: string;
  }> = {
    baker: { arcHeight: 25, rowSpacing: 100, minSpacing: 100, tierGap: 60, label: 'BAKERS' },
    hub: { arcHeight: 30, rowSpacing: 80, minSpacing: 70, tierGap: 50, label: 'HUBS' },
    standard: { arcHeight: 40, rowSpacing: 50, minSpacing: 45, tierGap: 40, label: 'STANDARD' },
    edge: { arcHeight: 35, rowSpacing: 35, minSpacing: 30, tierGap: 0, label: 'EDGE' },
  };

  const layoutedNodes: Node<ConcordiumNodeData>[] = [];
  const centerX = width / 2;
  const padding = 120;
  const usableWidth = width - padding * 2;

  // Calculate tier heights first to determine dynamic Y positions
  const tierOrder: NodeTier[] = ['baker', 'hub', 'standard', 'edge'];
  const tierHeights: Record<NodeTier, number> = { baker: 0, hub: 0, standard: 0, edge: 0 };
  const tierRowCounts: Record<NodeTier, number> = { baker: 0, hub: 0, standard: 0, edge: 0 };

  for (const tier of tierOrder) {
    const count = tiers[tier].length;
    const config = tierConfig[tier];
    if (count === 0) {
      tierRowCounts[tier] = 0;
      tierHeights[tier] = 0;
    } else {
      const nodesPerRow = Math.max(1, Math.floor(usableWidth / config.minSpacing));
      const numRows = Math.ceil(count / nodesPerRow);
      tierRowCounts[tier] = numRows;
      // Height = (numRows - 1) * rowSpacing + arcHeight + buffer for node size
      tierHeights[tier] = (numRows - 1) * config.rowSpacing + config.arcHeight + 50;
    }
  }

  // Calculate dynamic Y positions for each tier
  const tierY: Record<NodeTier, number> = { baker: 0, hub: 0, standard: 0, edge: 0 };
  let currentY = 80; // Starting Y position

  for (const tier of tierOrder) {
    tierY[tier] = currentY;
    if (tiers[tier].length > 0) {
      currentY += tierHeights[tier] + tierConfig[tier].tierGap;
    }
  }

  // Position nodes in each tier
  for (const tier of tierOrder) {
    const tierNodes = tiers[tier];
    const config = tierConfig[tier];
    const count = tierNodes.length;

    if (count === 0) continue;

    const nodesPerRow = Math.max(1, Math.floor(usableWidth / config.minSpacing));
    const numRows = tierRowCounts[tier];
    const baseY = tierY[tier];

    tierNodes.forEach((node, index) => {
      // Determine which row this node belongs to
      const row = Math.floor(index / nodesPerRow);
      const indexInRow = index % nodesPerRow;
      const nodesInThisRow = Math.min(nodesPerRow, count - row * nodesPerRow);

      // Calculate horizontal spread for this row
      // Use more spread for rows with fewer nodes
      const rowSpread = Math.min(usableWidth, nodesInThisRow * config.minSpacing);
      const startX = centerX - rowSpread / 2;

      // Horizontal position: evenly distributed across row width
      const progress = nodesInThisRow === 1 ? 0.5 : indexInRow / (nodesInThisRow - 1);
      const x = startX + progress * rowSpread;

      // Vertical position: base Y + row offset + arc curve
      const rowY = baseY + row * config.rowSpacing;

      // Arc curve (parabola centered at middle) - flatter for multi-row layouts
      const arcProgress = (progress - 0.5) * 2; // -1 to 1
      const arcMultiplier = numRows > 1 ? 0.5 : 1; // Reduce arc for multi-row
      const arcOffset = config.arcHeight * arcMultiplier * (1 - arcProgress * arcProgress);
      const y = rowY + arcOffset;

      // Add small random jitter for organic feel (but consistent per node)
      const jitterX = ((hashCode(node.id) % 16) - 8);
      const jitterY = ((hashCode(node.id + 'y') % 8) - 4);

      layoutedNodes.push({
        ...node,
        position: {
          x: x + jitterX,
          y: y + jitterY,
        },
        data: {
          ...node.data,
          tier,
        },
      });
    });
  }

  // Calculate tier label positions and separator lines
  const tierLabels = tierOrder
    .filter(tier => tiers[tier].length > 0)
    .map(tier => ({
      tier: tierConfig[tier].label,
      y: tierY[tier],
      endY: tierY[tier] + tierHeights[tier],
    }));

  // Separator lines between tiers (at midpoint between tier end and next tier start)
  const tierSeparators: { y: number }[] = [];
  for (let i = 0; i < tierOrder.length - 1; i++) {
    const currentTier = tierOrder[i];
    const nextTier = tierOrder[i + 1];
    if (tiers[currentTier].length > 0 && tiers[nextTier].length > 0) {
      const separatorY = tierY[currentTier] + tierHeights[currentTier] + tierConfig[currentTier].tierGap / 2;
      tierSeparators.push({ y: separatorY });
    }
  }

  return { nodes: layoutedNodes, edges, tierLabels, tierSeparators };
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
