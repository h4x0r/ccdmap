import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sparkline, toSparklineString, compressData } from './Sparkline';

describe('toSparklineString', () => {
  it('converts values to block characters', () => {
    // Values from 0 to 100, should map to different blocks
    // 0 = index 0 (▁), 50 = index 4 (▅), 100 = index 7 (█)
    const result = toSparklineString([0, 50, 100], 0, 100);
    expect(result).toBe('▁▅█');
  });

  it('handles single value', () => {
    const result = toSparklineString([50], 0, 100);
    expect(result).toBe('▅'); // 50% = index 4
  });

  it('handles empty array', () => {
    const result = toSparklineString([], 0, 100);
    expect(result).toBe('');
  });

  it('handles all same values', () => {
    const result = toSparklineString([50, 50, 50], 0, 100);
    // All should be same block
    expect(result[0]).toBe(result[1]);
    expect(result[1]).toBe(result[2]);
  });

  it('clamps values outside range', () => {
    const result = toSparklineString([-10, 200], 0, 100);
    expect(result).toBe('▁█');
  });

  it('handles min equals max gracefully', () => {
    const result = toSparklineString([50, 50], 50, 50);
    // Should not crash, return valid blocks
    expect(result.length).toBe(2);
  });
});

describe('compressData', () => {
  it('returns original if under target length', () => {
    const data = [1, 2, 3, 4, 5];
    const result = compressData(data, 10);
    expect(result).toEqual(data);
  });

  it('compresses data to target length', () => {
    const data = Array.from({ length: 180 }, (_, i) => i);
    const result = compressData(data, 30);
    expect(result.length).toBe(30);
  });

  it('takes max value per bucket', () => {
    // 6 values compressed to 2 buckets
    const data = [1, 5, 3, 2, 8, 4];
    const result = compressData(data, 2);
    expect(result).toEqual([5, 8]); // max of each group of 3
  });
});

describe('Sparkline component', () => {
  it('renders sparkline string', () => {
    render(<Sparkline data={[0, 50, 100]} min={0} max={100} />);
    const element = screen.getByTestId('sparkline');
    expect(element.textContent).toBe('▁▅█');
  });

  it('applies custom className', () => {
    render(<Sparkline data={[50]} min={0} max={100} className="custom-class" />);
    const element = screen.getByTestId('sparkline');
    expect(element).toHaveClass('custom-class');
  });

  it('auto-calculates min/max when not provided', () => {
    render(<Sparkline data={[10, 20, 30]} />);
    const element = screen.getByTestId('sparkline');
    // With auto min/max, 10 should be lowest, 30 highest
    expect(element.textContent).toBe('▁▅█');
  });

  it('compresses long data arrays', () => {
    const longData = Array.from({ length: 180 }, (_, i) => i);
    render(<Sparkline data={longData} maxBars={30} />);
    const element = screen.getByTestId('sparkline');
    // Should be compressed to 30 characters
    expect(element.textContent?.length).toBe(30);
  });

  it('renders empty state gracefully', () => {
    render(<Sparkline data={[]} />);
    const element = screen.getByTestId('sparkline');
    expect(element.textContent).toBe('');
  });
});
