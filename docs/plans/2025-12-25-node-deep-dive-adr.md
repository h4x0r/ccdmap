# ADR: Node Historical Deep Dive & Comparison View

**Date:** 2025-12-25
**Status:** Accepted
**Deciders:** Albert Hui

---

## Context

The Concordium Node Map needs a way for users to investigate historical node performance, identify incidents, and compare nodes against each other. The system already stores 30 days of snapshot data (health, latency, bandwidth, peers) at 5-minute intervals.

Key requirements:
- Deep forensic analysis capability
- Compare up to 3 nodes simultaneously
- Intuitive timeline navigation (Premiere Pro-style)
- Consistent with existing Bloomberg Terminal aesthetic

---

## Decisions

### ADR-1: Slide-out Panel vs. Dedicated Page

**Decision:** Slide-out panel that expands from existing popup

**Considered:**
1. Dedicated page (`/node/:id/history`)
2. Slide-out panel (expands popup)
3. Split view (map + analysis side-by-side)
4. Modal overlay

**Rationale:**
- Keeps map visible for clicking comparison nodes
- Maintains context without full navigation
- Smoother UX flow from popup → deep dive
- Split view wastes space; modal blocks map interaction

---

### ADR-2: Timeline Zoom Interaction Model

**Decision:** Multiple input methods - scroll wheel, pinch, and range handles

**Considered:**
1. Scroll to zoom only
2. Pinch + drag only
3. Zoom slider + drag
4. Range handles only

**Rationale:**
- Scroll wheel: Fast for mouse users, intuitive (like maps)
- Pinch: Essential for trackpad/touch users
- Range handles: Precise control, matches Premiere Pro mental model
- Combined approach serves all input preferences

**Implementation Notes:**
- Scroll zoom centers on cursor position
- All three methods must stay synchronized
- Range handles shown on minimap always displaying full 30-day range

---

### ADR-3: Node Comparison Selection Method

**Decision:** Search dropdown in panel AND click-on-map

**Considered:**
1. Search/dropdown only
2. Click on map only
3. Drag from map
4. Both search and click

**Rationale:**
- Search: Fast for known node names/IDs
- Click on map: Intuitive for nearby/visible nodes
- Drag: Overly complex, no clear benefit
- Combined approach covers both use cases

**Implementation Notes:**
- Map shows "comparison mode" indicator when panel open
- Clicked nodes get colored ring matching their chart color
- Maximum 3 nodes total (1 primary + 2 comparison)

---

### ADR-4: Metric Display Layout

**Decision:** Stacked tracks per metric, nodes overlaid with different colors

**Considered:**
1. All metrics stacked vertically
2. Tabbed metrics (one at a time)
3. Configurable tracks, stacked (chosen)
4. Primary chart + sparklines

**Rationale:**
- Stacking allows correlating events across metrics (latency spike + peer drop)
- Overlaid nodes enable direct comparison at any timestamp
- Configurable tracks let users focus on relevant metrics
- Matches Premiere Pro's multi-track timeline model

**Trade-offs:**
- More vertical space needed than tabs
- Overlaid lines can get cluttered with 3 nodes (mitigated by color + opacity)

---

### ADR-5: Track Configuration Method

**Decision:** Right-click context menu with gear icon fallback

**Considered:**
1. Checkbox list in sidebar
2. Drag to add/remove
3. Track headers with X
4. Right-click context menu

**Rationale:**
- Right-click: Fast for power users who discover it
- Gear icon: Always visible, prevents "all hidden" edge case
- Checkbox list: Too always-visible, clutters UI
- Drag: Overly complex for simple show/hide

**Implementation Notes:**
- Gear icon in panel header opens same menu as right-click
- Menu shows checkboxes for each metric track
- At least one track must remain visible (or show empty state with "Add Tracks" button)

---

### ADR-6: Time Range Selection

**Decision:** Preset buttons + custom date/time picker

**Considered:**
1. Simple presets only (1h, 6h, 24h, 7d, 30d)
2. Presets + custom range (chosen)
3. Presets + relative picker ("Last X hours")
4. Full calendar-based picker only

**Rationale:**
- Presets: Cover 90% of monitoring use cases
- Custom picker: Essential for incident investigation ("last Tuesday 2-4pm")
- Relative picker: Less precise than FROM/TO for forensics
- Calendar-only: Too slow for quick checks

**Implementation Notes:**
- Custom picker has FROM date/time and TO date/time
- Quick shortcuts: "Yesterday", "Last weekend"
- LIVE mode (auto-refresh) vs HISTORICAL mode (frozen view)

---

### ADR-7: Crosshair Behavior

**Decision:** Synced vertical crosshair spanning all tracks with pinnable tooltip

**Considered:**
1. Per-track independent cursors
2. Synced crosshair (chosen)
3. No crosshair (tooltips only)

**Rationale:**
- Synced crosshair enables instant correlation across metrics
- Critical for forensic analysis ("what else happened at this exact moment?")
- Click-to-pin allows examining specific timestamp while moving mouse elsewhere

**Implementation Notes:**
- Crosshair is thin dashed vertical line at 50% opacity
- Tooltip shows all compared nodes' values at cursor timestamp
- Comparison deltas shown inline (▲ higher, ▼ lower than primary)

---

### ADR-8: Data Fetching Strategy

**Decision:** Fetch full range on initial load, virtualize rendering

**Considered:**
1. Fetch visible window only (lazy load on pan/zoom)
2. Fetch full range upfront (chosen)
3. Progressive loading with placeholders

**Rationale:**
- 30 days × 5-min intervals = ~8,640 points per node per metric
- ~100KB JSON per node - acceptable for initial load
- Eliminates loading delays during pan/zoom
- Zoom/pan must feel instant (60fps)

**Trade-offs:**
- Higher initial load time (~500ms target)
- More memory usage
- Worth it for fluid interaction

**Implementation Notes:**
- Consider IndexedDB caching for repeat visits
- Fetch comparison nodes incrementally (don't block UI)
- Virtualize SVG rendering - only draw visible data points

---

## Consequences

### Positive
- Smooth, professional timeline experience
- Flexible node comparison workflow
- Consistent with existing Bloomberg Terminal aesthetic
- Supports all three use cases: forensics, monitoring, benchmarking

### Negative
- Desktop-only (mobile too constrained for this UI)
- Initial implementation complexity (zoomable timeline, synced tracks)
- Memory usage with 3 nodes × 30 days of data

### Risks
- Performance with dense data sets - mitigate with virtualization
- Learning curve for right-click menu - mitigate with gear icon fallback

---

## Related Documents

- [PRD: Node Historical Deep Dive](./2025-12-25-node-deep-dive-prd.md)
