# ADR-0001: Visualization Libraries Selection

**Status**: Accepted
**Date**: 2025-12-12
**Deciders**: Development Team
**Technical Area**: Frontend Visualization

## Context

We need to render two distinct visualizations for the Concordium network:

1. **Topology Graph**: Force-directed network graph showing ~80+ nodes and their peer connections
2. **Geographic Map**: World map with node positions for geographic context

The solution must integrate well with our chosen stack (Next.js 14+, React, shadcn/ui, Tailwind CSS).

## Decision Drivers

- React-native integration (hooks, component model)
- Performance with 80+ nodes and 500+ edges
- Customization for shadcn styling consistency
- Bundle size impact
- Community support and documentation
- Learning curve for team

## Options Considered

### Option 1: D3.js + React Wrapper

**Pros**:
- Maximum flexibility and control
- Industry standard for data visualization
- Can handle both graph and map

**Cons**:
- Steep learning curve
- Imperative API conflicts with React's declarative model
- Requires significant wrapper code
- Larger bundle size when including all modules

### Option 2: React Flow (Graph) + React Leaflet (Map)

**Pros**:
- React-native APIs with hooks
- React Flow designed specifically for node graphs
- Leaflet is battle-tested, free, no API keys
- Both have active communities
- Reasonable bundle sizes with tree-shaking
- shadcn-compatible styling approach

**Cons**:
- Two libraries to learn
- Different interaction patterns to unify

### Option 3: Vis.js Network + Mapbox GL

**Pros**:
- Vis.js excellent for large network graphs
- Mapbox has beautiful maps

**Cons**:
- Vis.js less React-idiomatic
- Mapbox requires API key and has usage costs
- Vis.js styling harder to customize

### Option 4: Cytoscape.js + Deck.gl

**Pros**:
- Cytoscape powerful for graph analysis
- Deck.gl handles massive datasets

**Cons**:
- Overkill for 80 nodes
- Steeper learning curves
- Deck.gl requires WebGL expertise

## Decision

**Selected**: Option 2 - React Flow for topology graph + React Leaflet for geographic map

## Rationale

1. **React Flow** is purpose-built for interactive node graphs:
   - Built-in force-directed layout via `dagre` or `elkjs`
   - Custom node components allow shadcn styling
   - Excellent performance for our scale (80-100 nodes)
   - Hooks-based API (`useNodes`, `useEdges`, `useReactFlow`)
   - Active development and comprehensive docs

2. **React Leaflet** provides what we need for geographic view:
   - Free, no API keys required
   - Mature ecosystem with clustering plugins
   - React component API
   - Works with OpenStreetMap tiles
   - Lightweight compared to Mapbox

3. **Combined approach**:
   - Clear separation of concerns
   - Can share selection state via Zustand
   - Independent optimization possible
   - Failure in one doesn't break the other

## Consequences

### Positive

- Fast development with React-native APIs
- Consistent styling possible with both libraries
- Good performance for expected data volume
- No API key management for maps
- Strong community support for both

### Negative

- Two libraries to maintain and update
- Need to unify interaction patterns (selection, hover)
- Dynamic imports required to manage bundle size

### Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| React Flow layout performance | Use `elkjs` layout, memoize positions |
| Leaflet SSR issues | Dynamic import with `next/dynamic` |
| Inconsistent UX between views | Shared state store, consistent color system |

## Implementation Notes

```typescript
// Dynamic imports to reduce initial bundle
const TopologyGraph = dynamic(
  () => import('@/components/map/TopologyGraph'),
  { ssr: false }
);

const GeographicMap = dynamic(
  () => import('@/components/map/GeographicMap'),
  { ssr: false }
);
```

## References

- React Flow: https://reactflow.dev
- React Leaflet: https://react-leaflet.js.org
- Bundle analysis tool: https://bundlephobia.com
