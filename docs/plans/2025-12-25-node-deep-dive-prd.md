# PRD: Node Historical Deep Dive & Comparison View

**Author:** Albert Hui
**Date:** 2025-12-25
**Status:** Draft

---

## Overview

A slide-out panel interface for deep-diving into individual node historical data with support for comparing up to 3 nodes simultaneously. Features a Premiere Pro-style zoomable timeline for forensic analysis, performance monitoring, and comparative benchmarking.

## Problem Statement

Users need to:
1. Investigate incidents ("Node X had issues last Tuesday - what happened?")
2. Monitor performance trends over time
3. Compare node performance against other nodes on the network

The current popup provides real-time snapshots but lacks historical depth and comparison capabilities.

## Goals

- Enable forensic investigation with precise time range selection
- Support side-by-side comparison of up to 3 nodes
- Provide intuitive timeline navigation matching professional video editing tools
- Maintain Bloomberg Terminal aesthetic consistency

## Non-Goals

- Real-time alerting (separate feature)
- Node configuration/management
- Data export functionality (future enhancement)

---

## User Stories

### Incident Investigation
> As a node operator, I want to zoom into a specific time window when my node had issues, so I can correlate latency spikes with peer count drops or health status changes.

### Performance Monitoring
> As a network observer, I want to see how a node's metrics have trended over the past week, so I can identify gradual degradation before it becomes critical.

### Comparative Analysis
> As a node operator, I want to compare my node's performance against 2 other well-performing nodes, so I can benchmark and identify areas for improvement.

---

## Functional Requirements

### FR-1: Panel Access & Layout

| ID | Requirement |
|----|-------------|
| FR-1.1 | "Deep Dive" button in existing node popup expands into slide-out panel |
| FR-1.2 | Panel occupies ~60% screen width, map remains visible and interactive |
| FR-1.3 | Panel contains: Header, Comparison Bar, Time Controls, Timeline Ruler, Metric Tracks |
| FR-1.4 | Close button returns to normal popup view |

### FR-2: Timeline Interaction

| ID | Requirement |
|----|-------------|
| FR-2.1 | Mouse wheel zooms in/out centered on cursor position |
| FR-2.2 | Touch pinch-to-zoom and two-finger drag to pan |
| FR-2.3 | Range handles on minimap for precise window selection |
| FR-2.4 | All zoom methods stay synchronized |
| FR-2.5 | Zoom range: 1 hour (max in) to 30 days (max out) |
| FR-2.6 | Keyboard shortcuts: +/- zoom, arrows pan, Home/End jump |

### FR-3: Time Range Selection

| ID | Requirement |
|----|-------------|
| FR-3.1 | Preset buttons: 1h, 6h, 24h, 7d, 30d |
| FR-3.2 | Custom date/time picker with FROM and TO fields |
| FR-3.3 | Quick shortcuts in picker: "Yesterday", "Last weekend" |
| FR-3.4 | LIVE mode auto-refreshes, HISTORICAL mode freezes view |
| FR-3.5 | Default view: Last 24 hours in LIVE mode |

### FR-4: Node Comparison

| ID | Requirement |
|----|-------------|
| FR-4.1 | Compare up to 3 nodes total (1 primary + 2 comparison) |
| FR-4.2 | Add nodes via search dropdown with typeahead |
| FR-4.3 | Add nodes by clicking on map while panel is open |
| FR-4.4 | Comparison bar shows colored pills for each node |
| FR-4.5 | Remove comparison nodes via X button (primary cannot be removed) |
| FR-4.6 | Color assignment: Primary=Cyan, Comp1=Orange, Comp2=Green |

### FR-5: Metric Tracks

| ID | Requirement |
|----|-------------|
| FR-5.1 | Configurable tracks via right-click menu or gear icon |
| FR-5.2 | Tracks: Health, Latency, Bandwidth, Peers |
| FR-5.3 | All tracks share synchronized time axis |
| FR-5.4 | Each track collapsible via toggle |
| FR-5.5 | Track headers show summary stats for visible range |

### FR-6: Track Visualizations

| ID | Requirement |
|----|-------------|
| FR-6.1 | Health: Segmented horizontal bars (green/amber/red) |
| FR-6.2 | Latency: Line chart with fill, overlaid per node |
| FR-6.3 | Bandwidth: Mirrored chart (OUT up, IN down), overlaid per node |
| FR-6.4 | Peers: Step chart, overlaid per node |
| FR-6.5 | Comparison nodes overlaid with distinct colors |

### FR-7: Crosshair & Tooltips

| ID | Requirement |
|----|-------------|
| FR-7.1 | Vertical crosshair spans all tracks on hover |
| FR-7.2 | Tooltip shows all nodes' values at cursor timestamp |
| FR-7.3 | Comparison deltas shown inline (▲ higher, ▼ lower) |
| FR-7.4 | Click to pin crosshair, Esc to unpin |

---

## Data Requirements

### Source Data (from snapshots table)
- `timestamp` - 5-minute intervals
- `health_status` - healthy/lagging/issue
- `avg_ping` - latency in ms
- `bytes_in` / `bytes_out` - bandwidth
- `peers_count` - connected peers
- `finalized_height` / `height_delta` - block sync status

### Retention
- 30-day rolling window
- ~8,640 snapshots per node per month

### API Endpoints Required
- `GET /api/tracking/node-history?nodeId=X&from=T1&to=T2` (exists, may need pagination)
- Support for fetching multiple nodes in single request (optimization)

---

## UI/UX Specifications

### Visual Design
- Bloomberg Terminal aesthetic (dark theme)
- Colors: Amber accents, Cyan/Orange/Green for node comparison
- Typography: JetBrains Mono for data values
- Subtle grid lines, high contrast data visualization

### Responsive Behavior
- Desktop only (panel requires minimum 1200px viewport)
- On mobile: Show "View on desktop for historical analysis" message

### Animations
- Smooth panel expansion (300ms ease-out)
- Zoom transitions (150ms)
- Crosshair follows cursor with no delay
- Track collapse/expand (200ms)

### Accessibility
- Keyboard navigation for all controls
- ARIA labels for interactive elements
- Sufficient color contrast for colorblind users (patterns in addition to colors)

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Time to load 24h of data | < 500ms |
| Time to zoom/pan response | < 16ms (60fps) |
| User can pinpoint incident | < 30 seconds |
| Comparison setup time | < 10 seconds |

---

## Open Questions

1. Should we add data export (CSV/JSON) for the visible range?
2. Should annotations/markers be supported for marking incidents?
3. Should we add anomaly detection highlighting?

---

## Appendix: Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│ BAKERMAN 595CD21960E720F2          [+ Compare] [⚙] [✕]     │
├─────────────────────────────────────────────────────────────┤
│ [● BAKERMAN] [● node-2 ×] [+ Add node]                      │
├─────────────────────────────────────────────────────────────┤
│ [1h][6h][24h][7d][30d] [Custom ▾]          [● LIVE ○ HIST] │
├─────────────────────────────────────────────────────────────┤
│ ├──12:00──┼──12:30──┼──13:00──┼──13:30──┼──14:00──┤        │
│ [◀════════════════════════════════════════════════▶]       │
├─────────────────────────────────────────────────────────────┤
│ [─] HEALTH ─────────────────────────── [98% healthy]       │
│ ████████████████████░░░░░████████████████████████████      │
├─────────────────────────────────────────────────────────────┤
│ [─] LATENCY ────────────────────────── [avg: 234ms]        │
│     ╱╲   ╱╲                    ╱╲                           │
│ ───╱──╲─╱──╲──────────────────╱──╲─────────────────        │
├─────────────────────────────────────────────────────────────┤
│ [─] BANDWIDTH ─────────────────────── [▲18 ▼22 KB/s]       │
│ ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄ OUT                │
│ ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀ IN                 │
├─────────────────────────────────────────────────────────────┤
│ [─] PEERS ──────────────────────────── [current: 7]        │
│ ┌─┐     ┌───┐   ┌─────────────────────┐                    │
│ ┘ └─────┘   └───┘                                          │
└─────────────────────────────────────────────────────────────┘
```
