'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  zoomTimeline,
  panTimeline,
  clampTimeRange,
  getTimeRangePreset,
  type TimeRange,
  type TimeRangePreset,
} from '@/lib/timeline';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const ZOOM_IN_FACTOR = 0.7;  // Reduce range by 30%
const ZOOM_OUT_FACTOR = 1.4; // Increase range by 40%

export interface UseTimelineZoomReturn {
  /** Current visible time range */
  range: TimeRange;
  /** Duration of current range in ms */
  duration: number;
  /** Zoom level as 0-1 (1 = most zoomed in) */
  zoomLevel: number;
  /** Zoom in centered on cursor position (ratio 0-1) */
  zoomIn: (cursorRatio: number) => void;
  /** Zoom out centered on cursor position (ratio 0-1) */
  zoomOut: (cursorRatio: number) => void;
  /** Pan by time delta in ms */
  pan: (delta: number) => void;
  /** Set range to a preset */
  setPreset: (preset: TimeRangePreset) => void;
  /** Set custom range directly */
  setRange: (range: TimeRange) => void;
}

/**
 * Hook for managing timeline zoom and pan state
 * @param bounds The valid bounds for the timeline (e.g., 30 days of data)
 * @param initialRange Optional initial range (defaults to last 24h)
 */
export function useTimelineZoom(
  bounds: TimeRange,
  initialRange?: TimeRange
): UseTimelineZoomReturn {
  const defaultRange = useMemo(
    () =>
      initialRange ?? {
        start: bounds.end - 24 * HOUR,
        end: bounds.end,
      },
    [bounds.end, initialRange]
  );

  const [range, setRangeState] = useState<TimeRange>(defaultRange);

  const setRange = useCallback(
    (newRange: TimeRange) => {
      const clamped = clampTimeRange(newRange, bounds);
      setRangeState(clamped);
    },
    [bounds]
  );

  const zoomIn = useCallback(
    (cursorRatio: number) => {
      setRangeState((current) => {
        const zoomed = zoomTimeline(current, cursorRatio, ZOOM_IN_FACTOR);
        return clampTimeRange(zoomed, bounds);
      });
    },
    [bounds]
  );

  const zoomOut = useCallback(
    (cursorRatio: number) => {
      setRangeState((current) => {
        const zoomed = zoomTimeline(current, cursorRatio, ZOOM_OUT_FACTOR);
        return clampTimeRange(zoomed, bounds);
      });
    },
    [bounds]
  );

  const pan = useCallback(
    (delta: number) => {
      setRangeState((current) => {
        const panned = panTimeline(current, delta);
        return clampTimeRange(panned, bounds);
      });
    },
    [bounds]
  );

  const setPreset = useCallback(
    (preset: TimeRangePreset) => {
      const presetRange = getTimeRangePreset(preset, bounds.end);
      const clamped = clampTimeRange(presetRange, bounds);
      setRangeState(clamped);
    },
    [bounds]
  );

  const duration = range.end - range.start;
  const maxDuration = bounds.end - bounds.start;
  // zoomLevel: 1 = most zoomed in (1 hour), 0 = most zoomed out (30 days)
  const zoomLevel = 1 - (duration - HOUR) / (maxDuration - HOUR);

  return {
    range,
    duration,
    zoomLevel: Math.max(0, Math.min(1, zoomLevel)),
    zoomIn,
    zoomOut,
    pan,
    setPreset,
    setRange,
  };
}
