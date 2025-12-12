# ADR-0004: Geographic Positioning Strategy

**Status**: Accepted
**Date**: 2025-12-12
**Deciders**: Development Team
**Technical Area**: Data Visualization

## Context

The geographic map view requires positioning nodes on a world map. However, the Concordium API (`nodesSummary`) provides **no geographic data** - no IP addresses, coordinates, or region fields.

Some node names contain location hints:
- "TT-London" → London, UK
- "CCD-NL" → Netherlands
- "BitNordic.com" → Nordic region
- "Luganodes" → Switzerland (known provider)
- "figment-mainnet" → Unknown (infrastructure provider)

We need a strategy to provide geographic context given this limitation.

## Decision Drivers

- No coordinates available from API
- Node names partially hint at location
- Geographic accuracy expectations
- Maintenance burden of mapping
- User trust (don't mislead)

## Options Considered

### Option 1: Skip Geographic View Entirely

**Pros**:
- No accuracy concerns
- Less development effort
- No maintenance burden

**Cons**:
- Loses valuable visualization perspective
- User requested this feature
- Common expectation for network maps

### Option 2: IP Geolocation Service

**Pros**:
- Accurate positioning
- Automatic, no manual mapping

**Cons**:
- API doesn't expose node IPs
- Would require alternative data source
- Privacy considerations
- Service costs

### Option 3: Manual Coordinate Database

**Pros**:
- Accurate for known nodes
- Full control

**Cons**:
- High maintenance as nodes join/leave
- Doesn't scale
- Initial data collection effort

### Option 4: Approximate Clustering with Clear Labeling

**Pros**:
- Provides geographic context
- Low maintenance
- Honest about limitations
- Extensible pattern matching

**Cons**:
- Not precise
- Some nodes will be "unknown"

## Decision

**Selected**: Option 4 - Approximate clustering with clear labeling

## Rationale

### Core Principle

**Be honest about what we know.** The geographic view provides *directional context*, not precision. Users want to see "roughly where nodes are distributed" not GPS coordinates.

### Implementation Approach

#### 1. Region Definition

Define ~10 geographic regions with representative coordinates:

```typescript
const REGIONS = {
  'north-america': { lat: 40.0, lng: -100.0, label: 'North America' },
  'europe-west': { lat: 48.0, lng: 2.0, label: 'Western Europe' },
  'europe-north': { lat: 60.0, lng: 10.0, label: 'Nordic' },
  'europe-east': { lat: 50.0, lng: 20.0, label: 'Eastern Europe' },
  'asia-east': { lat: 35.0, lng: 120.0, label: 'East Asia' },
  'asia-south': { lat: 20.0, lng: 78.0, label: 'South Asia' },
  'oceania': { lat: -25.0, lng: 135.0, label: 'Oceania' },
  'south-america': { lat: -15.0, lng: -60.0, label: 'South America' },
  'africa': { lat: 0.0, lng: 20.0, label: 'Africa' },
  'unknown': { lat: 0.0, lng: 0.0, label: 'Unknown Location' },
};
```

#### 2. Name Pattern Matching

```typescript
const LOCATION_PATTERNS: [RegExp, string][] = [
  // Cities/Countries
  [/london/i, 'europe-west'],
  [/paris/i, 'europe-west'],
  [/amsterdam|nl\b/i, 'europe-west'],
  [/berlin|germany|de\b/i, 'europe-west'],
  [/nordic|sweden|norway|finland|denmark/i, 'europe-north'],
  [/switzerland|swiss|zurich|lugano/i, 'europe-west'],
  [/us\b|usa|america|nyc|chicago|seattle/i, 'north-america'],
  [/canada|toronto|vancouver/i, 'north-america'],
  [/singapore|sg\b/i, 'asia-south'],
  [/japan|tokyo|jp\b/i, 'asia-east'],
  [/korea|seoul|kr\b/i, 'asia-east'],
  [/australia|sydney|melbourne|au\b/i, 'oceania'],

  // Known providers (research their primary locations)
  [/figment/i, 'north-america'],
  [/bitnordic/i, 'europe-north'],
  [/luganodes/i, 'europe-west'],
];

function inferRegion(nodeName: string): string {
  for (const [pattern, region] of LOCATION_PATTERNS) {
    if (pattern.test(nodeName)) return region;
  }
  return 'unknown';
}
```

#### 3. Clustering Within Regions

Multiple nodes in same region are spread in a cluster:
- Deterministic offset based on node ID hash
- Prevents marker overlap
- Visual distinction maintained

#### 4. Clear UI Labeling

**Mandatory disclaimer** visible on geographic view:

> "Node positions are approximate, inferred from node names. For accurate network topology, use the Topology view."

### Unknown Handling

Nodes that can't be mapped:
- Grouped in "Unknown Location" cluster
- Displayed at bottom of map or in dedicated area
- Count shown: "12 nodes with unknown location"
- Click to expand and see list

## Consequences

### Positive

- Provides useful geographic context
- Honest about limitations
- Low maintenance (pattern list is small)
- Extensible - can add patterns over time
- Doesn't block on external data sources

### Negative

- Imprecise by design
- Some users may expect accuracy
- "Unknown" category may be large initially

### Future Enhancements

If geographic accuracy becomes important:
1. Community-contributed location mapping
2. Integration with external node registry if available
3. Optional IP geolocation for nodes that expose it

## Metrics

- Percentage of nodes successfully mapped
- Accuracy feedback from community
- Pattern match hit rate by rule

## References

- Concordium node naming conventions: observed from API data
- Similar approach: Bitcoin node maps use IP geolocation, but we lack IPs
