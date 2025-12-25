/**
 * Timeline zoom and pan utilities for the deep dive panel
 */

export interface TimeRange {
  start: number; // timestamp in ms
  end: number;   // timestamp in ms
}

export type TimeRangePreset = '1h' | '6h' | '24h' | '7d' | '30d';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const MIN_RANGE = HOUR;      // 1 hour minimum zoom
const MAX_RANGE = 30 * DAY;  // 30 days maximum zoom

/**
 * Zoom the timeline in or out, centered on cursor position
 * @param range Current time range
 * @param cursorRatio Position of cursor as ratio (0-1) from left
 * @param zoomFactor Factor to multiply range by (< 1 zooms in, > 1 zooms out)
 * @returns New time range
 */
export function zoomTimeline(
  range: TimeRange,
  cursorRatio: number,
  zoomFactor: number
): TimeRange {
  const currentDuration = range.end - range.start;
  let newDuration = currentDuration * zoomFactor;

  // Clamp to min/max zoom levels
  newDuration = Math.max(MIN_RANGE, Math.min(MAX_RANGE, newDuration));

  // Calculate cursor timestamp
  const cursorTimestamp = range.start + currentDuration * cursorRatio;

  // Calculate new start/end keeping cursor at same ratio
  const newStart = cursorTimestamp - newDuration * cursorRatio;
  const newEnd = cursorTimestamp + newDuration * (1 - cursorRatio);

  return { start: newStart, end: newEnd };
}

/**
 * Pan the timeline by a time delta
 * @param range Current time range
 * @param delta Time delta in ms (positive = pan right/forward)
 * @returns New time range
 */
export function panTimeline(range: TimeRange, delta: number): TimeRange {
  return {
    start: range.start + delta,
    end: range.end + delta,
  };
}

/**
 * Clamp a time range to valid bounds, preserving duration if possible
 * @param range Range to clamp
 * @param bounds Valid bounds
 * @returns Clamped range
 */
export function clampTimeRange(range: TimeRange, bounds: TimeRange): TimeRange {
  const duration = range.end - range.start;

  // If range is entirely within bounds, return as-is
  if (range.start >= bounds.start && range.end <= bounds.end) {
    return range;
  }

  // If range exceeds bounds on left, shift right
  if (range.start < bounds.start) {
    return {
      start: bounds.start,
      end: Math.min(bounds.end, bounds.start + duration),
    };
  }

  // If range exceeds bounds on right, shift left
  if (range.end > bounds.end) {
    return {
      start: Math.max(bounds.start, bounds.end - duration),
      end: bounds.end,
    };
  }

  return range;
}

/**
 * Get a preset time range ending at the given timestamp
 * @param preset Preset identifier
 * @param endTimestamp End timestamp (typically now)
 * @returns Time range for preset
 */
export function getTimeRangePreset(
  preset: TimeRangePreset,
  endTimestamp: number
): TimeRange {
  const durations: Record<TimeRangePreset, number> = {
    '1h': HOUR,
    '6h': 6 * HOUR,
    '24h': 24 * HOUR,
    '7d': 7 * DAY,
    '30d': 30 * DAY,
  };

  const duration = durations[preset];
  return {
    start: endTimestamp - duration,
    end: endTimestamp,
  };
}

/**
 * Convert timestamp to pixel position within container
 * @param timestamp Timestamp in ms
 * @param range Visible time range
 * @param width Container width in pixels
 * @returns X position in pixels
 */
export function timestampToPosition(
  timestamp: number,
  range: TimeRange,
  width: number
): number {
  const duration = range.end - range.start;
  const ratio = (timestamp - range.start) / duration;
  return ratio * width;
}

/**
 * Convert pixel position to timestamp
 * @param position X position in pixels
 * @param range Visible time range
 * @param width Container width in pixels
 * @returns Timestamp in ms
 */
export function positionToTimestamp(
  position: number,
  range: TimeRange,
  width: number
): number {
  const ratio = position / width;
  const duration = range.end - range.start;
  return range.start + ratio * duration;
}
