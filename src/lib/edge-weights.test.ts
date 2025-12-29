import { describe, it, expect } from 'vitest';
import {
  calculateEdgeWeight,
  getEdgeStrokeWidth,
  type EdgeWeightData,
} from './edge-weights';

describe('Edge Weight Visualization', () => {
  describe('calculateEdgeWeight', () => {
    it('returns average ping when both nodes have ping data', () => {
      const sourceData: EdgeWeightData = { averagePing: 50, bandwidth: 1000 };
      const targetData: EdgeWeightData = { averagePing: 100, bandwidth: 2000 };

      const result = calculateEdgeWeight(sourceData, targetData);

      expect(result.latency).toBe(75); // (50 + 100) / 2
    });

    it('returns source ping when only source has ping data', () => {
      const sourceData: EdgeWeightData = { averagePing: 50, bandwidth: 1000 };
      const targetData: EdgeWeightData = { averagePing: null, bandwidth: 2000 };

      const result = calculateEdgeWeight(sourceData, targetData);

      expect(result.latency).toBe(50);
    });

    it('returns target ping when only target has ping data', () => {
      const sourceData: EdgeWeightData = { averagePing: null, bandwidth: 1000 };
      const targetData: EdgeWeightData = { averagePing: 80, bandwidth: 2000 };

      const result = calculateEdgeWeight(sourceData, targetData);

      expect(result.latency).toBe(80);
    });

    it('returns null latency when neither node has ping data', () => {
      const sourceData: EdgeWeightData = { averagePing: null, bandwidth: 1000 };
      const targetData: EdgeWeightData = { averagePing: null, bandwidth: 2000 };

      const result = calculateEdgeWeight(sourceData, targetData);

      expect(result.latency).toBeNull();
    });

    it('calculates total bandwidth from both nodes', () => {
      const sourceData: EdgeWeightData = { averagePing: 50, bandwidth: 1000 };
      const targetData: EdgeWeightData = { averagePing: 100, bandwidth: 2000 };

      const result = calculateEdgeWeight(sourceData, targetData);

      expect(result.bandwidth).toBe(3000); // 1000 + 2000
    });

    it('handles null bandwidth gracefully', () => {
      const sourceData: EdgeWeightData = { averagePing: 50, bandwidth: null };
      const targetData: EdgeWeightData = { averagePing: 100, bandwidth: 2000 };

      const result = calculateEdgeWeight(sourceData, targetData);

      expect(result.bandwidth).toBe(2000);
    });
  });

  describe('getEdgeStrokeWidth', () => {
    it('returns minimum width for null bandwidth', () => {
      const result = getEdgeStrokeWidth(null);
      expect(result).toBe(1);
    });

    it('returns minimum width for zero bandwidth', () => {
      const result = getEdgeStrokeWidth(0);
      expect(result).toBe(1);
    });

    it('returns scaled width for low bandwidth', () => {
      const result = getEdgeStrokeWidth(1000);
      expect(result).toBeGreaterThan(1);
      expect(result).toBeLessThan(4);
    });

    it('returns higher width for high bandwidth', () => {
      const lowBw = getEdgeStrokeWidth(1000);
      const highBw = getEdgeStrokeWidth(10000);

      expect(highBw).toBeGreaterThan(lowBw);
    });

    it('caps width at maximum value', () => {
      const result = getEdgeStrokeWidth(1000000);
      expect(result).toBeLessThanOrEqual(6);
    });

    it('returns consistent results for same input', () => {
      const result1 = getEdgeStrokeWidth(5000);
      const result2 = getEdgeStrokeWidth(5000);
      expect(result1).toBe(result2);
    });
  });
});
