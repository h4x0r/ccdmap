/**
 * Edge weight visualization utilities for displaying connection quality
 * between nodes based on latency and bandwidth metrics.
 */

export interface EdgeWeightData {
  averagePing: number | null;
  bandwidth: number | null;
}

export interface EdgeWeight {
  latency: number | null;
  bandwidth: number | null;
}

/**
 * Calculate the combined edge weight from source and target node data.
 * Latency is averaged from both nodes' ping times.
 * Bandwidth is summed from both nodes.
 */
export function calculateEdgeWeight(
  sourceData: EdgeWeightData,
  targetData: EdgeWeightData
): EdgeWeight {
  // Calculate latency as average of available ping values
  let latency: number | null = null;
  if (sourceData.averagePing !== null && targetData.averagePing !== null) {
    latency = (sourceData.averagePing + targetData.averagePing) / 2;
  } else if (sourceData.averagePing !== null) {
    latency = sourceData.averagePing;
  } else if (targetData.averagePing !== null) {
    latency = targetData.averagePing;
  }

  // Calculate bandwidth as sum of both nodes
  const sourceBw = sourceData.bandwidth ?? 0;
  const targetBw = targetData.bandwidth ?? 0;
  const bandwidth = sourceBw + targetBw > 0 ? sourceBw + targetBw : null;

  return { latency, bandwidth };
}

/**
 * Convert bandwidth value to stroke width for edge visualization.
 * Returns a width between 1 (minimum) and 6 (maximum) pixels.
 */
export function getEdgeStrokeWidth(bandwidth: number | null): number {
  const MIN_WIDTH = 1;
  const MAX_WIDTH = 6;

  if (bandwidth === null || bandwidth <= 0) {
    return MIN_WIDTH;
  }

  // Use logarithmic scale for bandwidth mapping
  // log10(1000) ≈ 3, log10(10000) ≈ 4, log10(1000000) ≈ 6
  const logBw = Math.log10(bandwidth);

  // Scale from ~3 (1000 bw) to ~6 (1000000 bw) -> 1 to 6 width
  // Using range of log10(100) to log10(100000) as practical bounds
  const minLog = 2;  // log10(100)
  const maxLog = 5;  // log10(100000)

  const normalized = (logBw - minLog) / (maxLog - minLog);
  const width = MIN_WIDTH + normalized * (MAX_WIDTH - MIN_WIDTH);

  return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width));
}
