import { useState, useCallback } from 'react';

/**
 * Rolling buffer size: 180 entries (15min × 12 per minute = 5s intervals)
 */
export const MAX_HISTORY = 180;

export interface MetricSnapshot {
  timestamp: number;
  nodes: number;
  finalizationTime: number;
  latency: number;
  packets: number;
  consensus: number;
  pulse: number;
}

export type MetricKey = keyof Omit<MetricSnapshot, 'timestamp'>;

export interface UseMetricHistoryReturn {
  history: MetricSnapshot[];
  latest: MetricSnapshot | null;
  addSnapshot: (snapshot: MetricSnapshot) => void;
  getSparklineData: (metric: MetricKey) => number[];
  clearHistory: () => void;
}

/**
 * Hook for managing rolling metric history for sparklines
 * Maintains a buffer of the last 15 minutes of metrics (180 snapshots at 5s intervals)
 */
export function useMetricHistory(): UseMetricHistoryReturn {
  const [history, setHistory] = useState<MetricSnapshot[]>([]);

  const addSnapshot = useCallback((snapshot: MetricSnapshot) => {
    setHistory((prev) => {
      const next = [...prev, snapshot];
      // Trim if exceeding max
      if (next.length > MAX_HISTORY) {
        return next.slice(next.length - MAX_HISTORY);
      }
      return next;
    });
  }, []);

  const getSparklineData = useCallback(
    (metric: MetricKey): number[] => {
      return history.map((snapshot) => snapshot[metric]);
    },
    [history]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const latest = history.length > 0 ? history[history.length - 1] : null;

  return {
    history,
    latest,
    addSnapshot,
    getSparklineData,
    clearHistory,
  };
}
