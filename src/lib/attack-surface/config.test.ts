/**
 * Config Tests
 *
 * Tests for attack surface configuration constants and utility functions.
 */

import { describe, it, expect } from 'vitest';
import {
  RISK_THRESHOLDS,
  RISK_LEVELS,
  PORT_CATEGORIES,
  RISK_FILTER_TOOLTIPS,
  getKnownPorts,
  getOtherGrpcPorts,
} from './config';

describe('RISK_THRESHOLDS', () => {
  it('has HIGH_VULN_COUNT threshold', () => {
    expect(RISK_THRESHOLDS.HIGH_VULN_COUNT).toBe(5);
  });

  it('has HIGH_PORT_COUNT threshold', () => {
    expect(RISK_THRESHOLDS.HIGH_PORT_COUNT).toBe(5);
  });
});

describe('RISK_LEVELS', () => {
  it('has all five risk levels', () => {
    expect(Object.keys(RISK_LEVELS)).toEqual(['critical', 'high', 'medium', 'low', 'unknown']);
  });

  it('has descending values from critical to unknown', () => {
    expect(RISK_LEVELS.critical.value).toBe(4);
    expect(RISK_LEVELS.high.value).toBe(3);
    expect(RISK_LEVELS.medium.value).toBe(2);
    expect(RISK_LEVELS.low.value).toBe(1);
    expect(RISK_LEVELS.unknown.value).toBe(0);
  });

  it('has emoji for each level', () => {
    expect(RISK_LEVELS.critical.emoji).toBe('🔴');
    expect(RISK_LEVELS.high.emoji).toBe('🟠');
    expect(RISK_LEVELS.medium.emoji).toBe('🟡');
    expect(RISK_LEVELS.low.emoji).toBe('🟢');
    expect(RISK_LEVELS.unknown.emoji).toBe('⚪');
  });

  it('has uppercase label for each level', () => {
    expect(RISK_LEVELS.critical.label).toBe('CRITICAL');
    expect(RISK_LEVELS.high.label).toBe('HIGH');
    expect(RISK_LEVELS.medium.label).toBe('MEDIUM');
    expect(RISK_LEVELS.low.label).toBe('LOW');
    expect(RISK_LEVELS.unknown.label).toBe('UNKNOWN');
  });
});

describe('PORT_CATEGORIES', () => {
  it('defines peering port as 8888', () => {
    expect(PORT_CATEGORIES.PEERING.port).toBe(8888);
    expect(PORT_CATEGORIES.PEERING.description).toBe('Peering');
    expect(PORT_CATEGORIES.PEERING.category).toBe('concordium');
  });

  it('defines default gRPC port as 20000', () => {
    expect(PORT_CATEGORIES.GRPC_DEFAULT.port).toBe(20000);
    expect(PORT_CATEGORIES.GRPC_DEFAULT.description).toBe('Default gRPC');
  });

  it('defines other gRPC ports (Concordium-specific alternatives)', () => {
    const otherPorts = PORT_CATEGORIES.GRPC_OTHER.map((p) => p.port);
    expect(otherPorts).toEqual([10000, 10001, 11000]);
  });
});

describe('RISK_FILTER_TOOLTIPS', () => {
  it('has tooltips for all filter options', () => {
    expect(RISK_FILTER_TOOLTIPS.all).toBeDefined();
    expect(RISK_FILTER_TOOLTIPS.critical).toBeDefined();
    expect(RISK_FILTER_TOOLTIPS.high).toBeDefined();
    expect(RISK_FILTER_TOOLTIPS.medium).toBeDefined();
    expect(RISK_FILTER_TOOLTIPS.low).toBeDefined();
    expect(RISK_FILTER_TOOLTIPS.unknown).toBeDefined();
  });

  it('references thresholds in tooltips', () => {
    expect(RISK_FILTER_TOOLTIPS.critical).toContain('6'); // HIGH_VULN_COUNT + 1
    expect(RISK_FILTER_TOOLTIPS.medium).toContain('6'); // HIGH_PORT_COUNT + 1
  });
});

describe('getKnownPorts', () => {
  it('returns all known Concordium ports', () => {
    const ports = getKnownPorts();
    expect(ports).toContain(8888);  // Peering
    expect(ports).toContain(20000); // Default gRPC
    expect(ports).toContain(10000); // Alt gRPC
    expect(ports).toContain(10001); // Alt gRPC
    expect(ports).toContain(11000); // Alt gRPC
  });

  it('returns exactly 5 ports', () => {
    expect(getKnownPorts().length).toBe(5);
  });

  it('returns ports in expected order (peering, default gRPC, other gRPC)', () => {
    const ports = getKnownPorts();
    expect(ports[0]).toBe(8888);
    expect(ports[1]).toBe(20000);
  });
});

describe('getOtherGrpcPorts', () => {
  it('returns only alternative gRPC ports', () => {
    const ports = getOtherGrpcPorts();
    expect(ports).toEqual([10000, 10001, 11000]);
  });

  it('does not include default gRPC port 20000', () => {
    expect(getOtherGrpcPorts()).not.toContain(20000);
  });

  it('does not include peering port 8888', () => {
    expect(getOtherGrpcPorts()).not.toContain(8888);
  });
});
