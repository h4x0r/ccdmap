import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimelineZoom } from './useTimelineZoom';
import type { TimeRange, TimeRangePreset } from '@/lib/timeline';

describe('useTimelineZoom', () => {
  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;
  const now = Date.now();

  const defaultBounds: TimeRange = {
    start: now - 30 * DAY,
    end: now,
  };

  it('initializes with default 24h range', () => {
    const { result } = renderHook(() => useTimelineZoom(defaultBounds));

    expect(result.current.range.end).toBe(now);
    expect(result.current.range.end - result.current.range.start).toBe(24 * HOUR);
  });

  it('initializes with custom initial range', () => {
    const initialRange: TimeRange = {
      start: now - 7 * DAY,
      end: now,
    };
    const { result } = renderHook(() =>
      useTimelineZoom(defaultBounds, initialRange)
    );

    expect(result.current.range).toEqual(initialRange);
  });

  describe('zoom operations', () => {
    it('zooms in at center', () => {
      const { result } = renderHook(() => useTimelineZoom(defaultBounds));
      const initialDuration = result.current.range.end - result.current.range.start;

      act(() => {
        result.current.zoomIn(0.5); // center
      });

      const newDuration = result.current.range.end - result.current.range.start;
      expect(newDuration).toBeLessThan(initialDuration);
    });

    it('zooms out at center', () => {
      const initialRange: TimeRange = { start: now - 6 * HOUR, end: now };
      const { result } = renderHook(() =>
        useTimelineZoom(defaultBounds, initialRange)
      );
      const initialDuration = result.current.range.end - result.current.range.start;

      act(() => {
        result.current.zoomOut(0.5);
      });

      const newDuration = result.current.range.end - result.current.range.start;
      expect(newDuration).toBeGreaterThan(initialDuration);
    });

    it('respects minimum zoom (1 hour)', () => {
      const initialRange: TimeRange = { start: now - HOUR, end: now };
      const { result } = renderHook(() =>
        useTimelineZoom(defaultBounds, initialRange)
      );

      act(() => {
        result.current.zoomIn(0.5);
        result.current.zoomIn(0.5);
        result.current.zoomIn(0.5);
      });

      const duration = result.current.range.end - result.current.range.start;
      expect(duration).toBeGreaterThanOrEqual(HOUR);
    });

    it('respects maximum zoom (30 days)', () => {
      const initialRange: TimeRange = { start: now - 30 * DAY, end: now };
      const { result } = renderHook(() =>
        useTimelineZoom(defaultBounds, initialRange)
      );

      act(() => {
        result.current.zoomOut(0.5);
        result.current.zoomOut(0.5);
      });

      const duration = result.current.range.end - result.current.range.start;
      expect(duration).toBeLessThanOrEqual(30 * DAY);
    });
  });

  describe('pan operations', () => {
    it('pans forward in time', () => {
      const initialRange: TimeRange = { start: now - 2 * DAY, end: now - DAY };
      const { result } = renderHook(() =>
        useTimelineZoom(defaultBounds, initialRange)
      );

      act(() => {
        result.current.pan(HOUR);
      });

      expect(result.current.range.start).toBe(initialRange.start + HOUR);
      expect(result.current.range.end).toBe(initialRange.end + HOUR);
    });

    it('pans backward in time', () => {
      const initialRange: TimeRange = { start: now - 2 * DAY, end: now - DAY };
      const { result } = renderHook(() =>
        useTimelineZoom(defaultBounds, initialRange)
      );

      act(() => {
        result.current.pan(-HOUR);
      });

      expect(result.current.range.start).toBe(initialRange.start - HOUR);
      expect(result.current.range.end).toBe(initialRange.end - HOUR);
    });

    it('clamps pan to bounds', () => {
      const initialRange: TimeRange = { start: now - DAY, end: now };
      const { result } = renderHook(() =>
        useTimelineZoom(defaultBounds, initialRange)
      );

      act(() => {
        result.current.pan(2 * DAY); // Try to pan past end
      });

      expect(result.current.range.end).toBeLessThanOrEqual(defaultBounds.end);
    });
  });

  describe('preset operations', () => {
    it('applies 1h preset', () => {
      const { result } = renderHook(() => useTimelineZoom(defaultBounds));

      act(() => {
        result.current.setPreset('1h');
      });

      expect(result.current.range.end - result.current.range.start).toBe(HOUR);
    });

    it('applies 7d preset', () => {
      const { result } = renderHook(() => useTimelineZoom(defaultBounds));

      act(() => {
        result.current.setPreset('7d');
      });

      expect(result.current.range.end - result.current.range.start).toBe(7 * DAY);
    });

    it('applies 30d preset', () => {
      const { result } = renderHook(() => useTimelineZoom(defaultBounds));

      act(() => {
        result.current.setPreset('30d');
      });

      expect(result.current.range.end - result.current.range.start).toBe(30 * DAY);
    });
  });

  describe('setRange', () => {
    it('sets custom range directly', () => {
      const { result } = renderHook(() => useTimelineZoom(defaultBounds));
      const customRange: TimeRange = { start: now - 3 * DAY, end: now - DAY };

      act(() => {
        result.current.setRange(customRange);
      });

      expect(result.current.range).toEqual(customRange);
    });

    it('clamps custom range to bounds', () => {
      const { result } = renderHook(() => useTimelineZoom(defaultBounds));
      const outOfBoundsRange: TimeRange = {
        start: now - 40 * DAY,
        end: now + DAY,
      };

      act(() => {
        result.current.setRange(outOfBoundsRange);
      });

      expect(result.current.range.start).toBeGreaterThanOrEqual(defaultBounds.start);
      expect(result.current.range.end).toBeLessThanOrEqual(defaultBounds.end);
    });
  });

  describe('computed properties', () => {
    it('computes duration correctly', () => {
      const initialRange: TimeRange = { start: now - 7 * DAY, end: now };
      const { result } = renderHook(() =>
        useTimelineZoom(defaultBounds, initialRange)
      );

      expect(result.current.duration).toBe(7 * DAY);
    });

    it('computes zoomLevel correctly', () => {
      const { result } = renderHook(() => useTimelineZoom(defaultBounds));

      // 24h default = 24/720 (30 days in hours) = ~3.3% of full range
      // zoomLevel is inverse - higher = more zoomed in
      expect(result.current.zoomLevel).toBeGreaterThan(0);
      expect(result.current.zoomLevel).toBeLessThanOrEqual(1);
    });
  });
});
