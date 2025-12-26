# EXT Node Visibility - Design Document

**Date:** 2025-12-26
**Status:** Approved
**Goal:** Improve network visibility by tracking non-reporting (EXT) nodes through gRPC integration and inference

## Problem Statement

Currently, the node map only shows nodes that report to the Concordium dashboard (~159 nodes). However:
- 15 "EXT" peers appear in peer lists but don't report to the dashboard
- We have 0 IP addresses for any nodes (nodesSummary doesn't include IPs)
- Node locations are inferred from names only, not actual geo data

## Solution: Hybrid Approach (gRPC + Inference)

### Data Sources

| Source | Data Provided | Nodes Covered |
|--------|---------------|---------------|
| nodesSummary API | Node metrics, peer IDs | 159 reporting nodes |
| gRPC getPeersInfo | Peer IPs, latency, catchup status | ~25 peers of public node |
| ip-api.com | Geo coords from IP | Any node with known IP |
| Inference engine | Existence, connectivity | All 15 EXT nodes |

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA COLLECTION LAYER                       │
├─────────────────────────────────────────────────────────────────────┤
│   nodesSummary ──────▶ 159 nodes + peer IDs                         │
│   gRPC API ──────────▶ 25 peer IPs + network stats                  │
│   ip-api.com ────────▶ Geo coordinates for IPs                      │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         INFERENCE ENGINE                            │
├─────────────────────────────────────────────────────────────────────┤
│   For EXT peers without direct data:                                │
│   • Track which reporting nodes list them as peers                  │
│   • Calculate visibility score (seen_by_count)                      │
│   • Infer location from connected nodes (centroid)                  │
│   • Identify bootstrappers (high connectivity, stable)              │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         UNIFIED NODE STORE                          │
├─────────────────────────────────────────────────────────────────────┤
│   Node types: REPORTING | GRPC_PEER | INFERRED                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Model

### New Table: `peers`

```sql
CREATE TABLE peers (
  peer_id TEXT PRIMARY KEY,           -- 16-char hex ID

  -- Source tracking
  source TEXT NOT NULL,               -- 'reporting' | 'grpc' | 'inferred'
  first_seen INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,

  -- Identity (for reporting nodes)
  node_name TEXT,
  client_version TEXT,

  -- Network info (from gRPC)
  ip_address TEXT,
  port INTEGER,

  -- Geolocation (from ip-api.com, cached)
  geo_country TEXT,
  geo_city TEXT,
  geo_lat REAL,
  geo_lon REAL,
  geo_isp TEXT,
  geo_updated INTEGER,

  -- Inference data
  seen_by_count INTEGER DEFAULT 0,
  is_bootstrapper INTEGER DEFAULT 0,

  -- gRPC-specific
  catchup_status TEXT,                -- 'UPTODATE' | 'PENDING' | 'CATCHINGUP'
  grpc_latency_ms INTEGER,
  packets_sent INTEGER,
  packets_received INTEGER
);
```

### New Table: `peer_connections`

```sql
CREATE TABLE peer_connections (
  reporter_id TEXT NOT NULL,
  peer_id TEXT NOT NULL,
  last_seen INTEGER NOT NULL,
  PRIMARY KEY (reporter_id, peer_id)
);

CREATE INDEX idx_peer_connections_peer ON peer_connections(peer_id);
```

## Data Collection Flow

Every 5 minutes:

1. **Fetch nodesSummary** (existing)
   - Get 159 reporting nodes
   - Update peers table: source='reporting'
   - Update peer_connections from peersList

2. **Fetch gRPC getPeersInfo** (NEW)
   - Connect to grpc.mainnet.concordium.software
   - Get ~25 peers with IPs, latency, catchup status
   - Queue new IPs for geo lookup

3. **Geo lookup** (NEW)
   - For IPs without geo data (or stale > 7 days)
   - Call ip-api.com/json/{ip}
   - Rate limit: max 30 per poll cycle

4. **Run inference** (NEW)
   - Count connections for each EXT peer
   - Detect bootstrappers: seen_by_count > 10, stable > 7 days
   - Infer location from connected nodes
   - Mark offline: last_seen > 15 min ago

## UI Changes

### Node Visual Types

| Type | Visual | Data Available |
|------|--------|----------------|
| REPORTING | Solid fill | Full metrics |
| GRPC_PEER | Half-fill | IP, latency, catchup |
| INFERRED | Hollow/dashed | Existence, connections |
| BOOTSTRAPPER | Star overlay | Any of above |

### Detail Panel for EXT Nodes

```
┌─────────────────────────────────────────┐
│ Peer: 26bf140b35fbbf77                  │
│ Type: External (not reporting)          │
│ IP: 142.xxx.xxx.xxx (Tokyo, JP)         │
│ Seen by: 8 nodes                        │
│ Connected to: [node1] [node2] [node3]   │
│ First seen: 2024-12-20                  │
│ Status: ● Online (seen 2 min ago)       │
└─────────────────────────────────────────┘
```

## Error Handling

| Scenario | Handling |
|----------|----------|
| gRPC connection fails | Retry 3x with backoff, fall back to nodesSummary-only |
| ip-api.com rate limited | Queue for next cycle, prioritize EXT nodes |
| Private IP range | Skip geo, mark as "Private Network" |
| EXT node disappears | Mark offline after 15min, archive after 7 days |

## Performance Limits

- Max geo lookups per poll: 30
- Geo cache TTL: 7 days
- gRPC timeout: 10 seconds
- EXT offline threshold: 15 minutes
- EXT archive threshold: 7 days
- Max peer_connections rows: 10,000

## Dependencies

- `@concordium/web-sdk` - Official Concordium SDK with gRPC client

## Expected Outcomes

| Metric | Before | After |
|--------|--------|-------|
| Nodes with IP addresses | 0 | ~25 |
| Nodes with real geo coords | 0 | ~25 |
| EXT nodes visible | 0 | 15 |
| EXT nodes with IPs | 0 | 3 |
| Bootstrappers identified | 0 | ~2-3 |

## References

- [Concordium gRPC API](https://docs.concordium.com/concordium-grpc-api/)
- [Concordium JS SDK](https://docs.concordium.com/concordium-node-sdk-js/11.0.0/)
- [ip-api.com documentation](https://ip-api.com/docs)
