/**
 * Block propagation animation utilities for visualizing how blocks
 * spread through the network from origin nodes.
 */

export interface PropagationNode {
  id: string;
  blockHeight: number;
}

export interface PropagationWave {
  waveNumber: number;
  nodeIds: string[];
}

export interface PropagationResult {
  waves: PropagationWave[];
  originId: string;
}

/**
 * Calculate propagation waves from an origin node.
 * Uses BFS to determine which nodes are at what distance from the origin.
 */
export function calculatePropagationWaves(
  nodes: PropagationNode[],
  edges: { source: string; target: string }[],
  originId: string
): PropagationResult {
  // Check if origin exists in nodes
  const nodeIds = new Set(nodes.map((n) => n.id));
  if (!nodeIds.has(originId)) {
    return { waves: [], originId };
  }

  // Build adjacency list for BFS
  const adjacency = new Map<string, Set<string>>();
  for (const node of nodes) {
    adjacency.set(node.id, new Set());
  }
  for (const edge of edges) {
    if (adjacency.has(edge.source) && adjacency.has(edge.target)) {
      adjacency.get(edge.source)!.add(edge.target);
      adjacency.get(edge.target)!.add(edge.source);
    }
  }

  // BFS from origin to calculate distances
  const distances = new Map<string, number>();
  const queue: string[] = [originId];
  distances.set(originId, 0);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDist = distances.get(current)!;
    const neighbors = adjacency.get(current) || new Set();

    for (const neighbor of neighbors) {
      if (!distances.has(neighbor)) {
        distances.set(neighbor, currentDist + 1);
        queue.push(neighbor);
      }
    }
  }

  // Group nodes by wave number (distance from origin)
  const waveMap = new Map<number, string[]>();
  for (const [nodeId, distance] of distances) {
    if (!waveMap.has(distance)) {
      waveMap.set(distance, []);
    }
    waveMap.get(distance)!.push(nodeId);
  }

  // Convert to sorted waves array
  const waves: PropagationWave[] = Array.from(waveMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([waveNumber, nodeIds]) => ({ waveNumber, nodeIds }));

  return { waves, originId };
}

/**
 * Get the animation delay in milliseconds for a given wave number.
 * Wave 0 (origin) has no delay, later waves have progressively longer delays.
 */
export function getPropagationDelay(waveNumber: number): number {
  const BASE_DELAY = 150; // ms per wave
  const MAX_DELAY = 2000; // cap at 2 seconds

  if (waveNumber <= 0) {
    return 0;
  }

  // Progressive delay: each wave takes slightly longer
  const delay = waveNumber * BASE_DELAY;
  return Math.min(delay, MAX_DELAY);
}

/**
 * Get the color for a propagation wave.
 * Earlier waves (closer to origin) are brighter, later waves fade.
 */
export function getWaveColor(waveNumber: number): string {
  // Use HSL for easy brightness control
  // Start with bright cyan (180), transition toward blue (220) as waves progress
  const baseHue = 180;
  const hueShift = Math.min(waveNumber * 8, 40); // Shift up to 40 degrees
  const hue = baseHue + hueShift;

  // Saturation stays high but decreases slightly with distance
  const saturation = Math.max(70, 100 - waveNumber * 5);

  // Lightness decreases with distance (origin is brightest)
  const lightness = Math.max(30, 60 - waveNumber * 5);

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
