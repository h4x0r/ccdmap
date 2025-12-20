/**
 * ASCII block sparkline component
 * Converts numeric data to visual sparkline using Unicode block characters
 */

const BLOCKS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

/**
 * Convert an array of values to a sparkline string
 */
export function toSparklineString(values: number[], min: number, max: number): string {
  if (values.length === 0) return '';

  const range = max - min;

  return values
    .map((v) => {
      // Handle case where all values are the same
      if (range === 0) return BLOCKS[4]; // Middle block

      // Normalize to 0-1, then map to block index
      const normalized = Math.max(0, Math.min(1, (v - min) / range));
      const index = Math.min(7, Math.floor(normalized * 8));
      return BLOCKS[index];
    })
    .join('');
}

/**
 * Compress data array to target length by taking max per bucket
 */
export function compressData(data: number[], targetLength: number): number[] {
  if (data.length <= targetLength) return data;

  const bucketSize = Math.ceil(data.length / targetLength);
  const result: number[] = [];

  for (let i = 0; i < data.length; i += bucketSize) {
    const bucket = data.slice(i, i + bucketSize);
    result.push(Math.max(...bucket));
  }

  return result.slice(0, targetLength);
}

export interface SparklineProps {
  data: number[];
  min?: number;
  max?: number;
  maxBars?: number;
  className?: string;
}

/**
 * Sparkline component displaying ASCII block characters
 */
export function Sparkline({
  data,
  min: minProp,
  max: maxProp,
  maxBars = 30,
  className = '',
}: SparklineProps) {
  // Auto-calculate min/max if not provided
  const min = minProp ?? (data.length > 0 ? Math.min(...data) : 0);
  const max = maxProp ?? (data.length > 0 ? Math.max(...data) : 100);

  // Compress data if needed
  const compressedData = compressData(data, maxBars);

  // Convert to sparkline string
  const sparkline = toSparklineString(compressedData, min, max);

  return (
    <span
      data-testid="sparkline"
      className={`font-mono text-sm leading-none ${className}`}
    >
      {sparkline}
    </span>
  );
}
