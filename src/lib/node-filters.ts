/**
 * Node filtering utilities for showing/hiding nodes based on tier and health.
 */

import type { NodeTier, NodeHealth } from '@/lib/transforms';

export interface FilterableNode {
  id: string;
  tier: NodeTier;
  health: NodeHealth;
}

export interface NodeFilterCriteria {
  tiers: NodeTier[];
  health: NodeHealth[];
}

/**
 * Filter nodes based on tier and health criteria.
 * Empty arrays mean "show all" for that category.
 * When both tier and health filters are set, they are combined with AND logic.
 */
export function filterNodes(
  nodes: FilterableNode[],
  criteria: NodeFilterCriteria
): FilterableNode[] {
  const { tiers, health } = criteria;

  // Empty arrays mean "show all" for that category
  const filterByTier = tiers.length > 0;
  const filterByHealth = health.length > 0;

  // If no filters, return all nodes
  if (!filterByTier && !filterByHealth) {
    return nodes;
  }

  return nodes.filter((node) => {
    // Check tier filter (if active)
    const tierMatch = !filterByTier || tiers.includes(node.tier);

    // Check health filter (if active)
    const healthMatch = !filterByHealth || health.includes(node.health);

    // Both must match (AND logic)
    return tierMatch && healthMatch;
  });
}
