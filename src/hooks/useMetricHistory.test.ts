import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMetricHistory, type MetricSnapshot, MAX_HISTORY } from './useMetricHistory';

describe('useMetricHistory', () => {
  const createSnapshot = (overrides: Partial<MetricSnapshot> = {}): MetricSnapshot => ({
    timestamp: Date.now(),
    nodes: 157,
    finalizationTime: 2.5,
    latency: 45,
    packets: 1200000,
    consensus: 98,
    pulse: 94,
    ...overrides,
  });

  it('starts with empty history', () => {
    const { result } = renderHook(() => useMetricHistory());
    expect(result.current.history).toEqual([]);
  });

  it('adds snapshots to history', () => {
    const { result } = renderHook(() => useMetricHistory());
    const snapshot = createSnapshot();

    act(() => {
      result.current.addSnapshot(snapshot);
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0]).toEqual(snapshot);
  });

  it('maintains chronological order', () => {
    const { result } = renderHook(() => useMetricHistory());
    const older = createSnapshot({ timestamp: 1000 });
    const newer = createSnapshot({ timestamp: 2000 });

    act(() => {
      result.current.addSnapshot(older);
      result.current.addSnapshot(newer);
    });

    expect(result.current.history[0].timestamp).toBe(1000);
    expect(result.current.history[1].timestamp).toBe(2000);
  });

  it('trims history when exceeding MAX_HISTORY', () => {
    const { result } = renderHook(() => useMetricHistory());

    act(() => {
      // Add MAX_HISTORY + 10 snapshots
      for (let i = 0; i < MAX_HISTORY + 10; i++) {
        result.current.addSnapshot(createSnapshot({ timestamp: i }));
      }
    });

    expect(result.current.history).toHaveLength(MAX_HISTORY);
    // Should have removed oldest entries
    expect(result.current.history[0].timestamp).toBe(10);
  });

  it('provides getSparklineData for specific metric', () => {
    const { result } = renderHook(() => useMetricHistory());

    act(() => {
      result.current.addSnapshot(createSnapshot({ nodes: 100 }));
      result.current.addSnapshot(createSnapshot({ nodes: 150 }));
      result.current.addSnapshot(createSnapshot({ nodes: 200 }));
    });

    const sparklineData = result.current.getSparklineData('nodes');
    expect(sparklineData).toEqual([100, 150, 200]);
  });

  it('provides getSparklineData for all metrics', () => {
    const { result } = renderHook(() => useMetricHistory());

    act(() => {
      result.current.addSnapshot(createSnapshot({
        nodes: 100,
        finalizationTime: 2.0,
        latency: 50,
        packets: 1000,
        consensus: 95,
        pulse: 90,
      }));
    });

    expect(result.current.getSparklineData('nodes')).toEqual([100]);
    expect(result.current.getSparklineData('finalizationTime')).toEqual([2.0]);
    expect(result.current.getSparklineData('latency')).toEqual([50]);
    expect(result.current.getSparklineData('packets')).toEqual([1000]);
    expect(result.current.getSparklineData('consensus')).toEqual([95]);
    expect(result.current.getSparklineData('pulse')).toEqual([90]);
  });

  it('clears history', () => {
    const { result } = renderHook(() => useMetricHistory());

    act(() => {
      result.current.addSnapshot(createSnapshot());
      result.current.addSnapshot(createSnapshot());
    });

    expect(result.current.history).toHaveLength(2);

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.history).toHaveLength(0);
  });

  it('provides latest snapshot', () => {
    const { result } = renderHook(() => useMetricHistory());

    expect(result.current.latest).toBeNull();

    const snapshot = createSnapshot({ nodes: 999 });
    act(() => {
      result.current.addSnapshot(snapshot);
    });

    expect(result.current.latest?.nodes).toBe(999);
  });
});
