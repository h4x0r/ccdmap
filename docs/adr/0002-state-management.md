# ADR-0002: State Management Strategy

**Status**: Accepted
**Date**: 2025-12-12
**Deciders**: Development Team
**Technical Area**: Frontend Architecture

## Context

The application has two distinct state management needs:

1. **Server State**: Node data fetched from the Concordium API (async, cached, refreshed)
2. **Client State**: UI state like selected node, current view, panel visibility

We need a solution that handles both without over-engineering.

## Decision Drivers

- Minimize boilerplate
- Handle caching and background refresh elegantly
- Type-safe
- Good DevTools support
- Works with Next.js App Router
- Bundle size consideration

## Options Considered

### Option 1: Redux Toolkit + RTK Query

**Pros**:
- Industry standard
- RTK Query handles server state well
- Excellent DevTools
- Good TypeScript support

**Cons**:
- Heavy for this application's needs
- Significant boilerplate even with toolkit
- Large bundle addition

### Option 2: TanStack Query + Zustand

**Pros**:
- TanStack Query purpose-built for server state
- Zustand minimal and simple for UI state
- Both have tiny bundle sizes
- Excellent TypeScript support
- TanStack Query has built-in caching, refetching, retry

**Cons**:
- Two libraries (though both are small)
- Less "integrated" feeling

### Option 3: TanStack Query + React Context

**Pros**:
- No additional state library
- TanStack Query for server state
- Context for simple UI state

**Cons**:
- Context can cause unnecessary re-renders
- No DevTools for context state
- Manual optimization needed

### Option 4: Jotai + TanStack Query

**Pros**:
- Atomic state model
- Fine-grained updates

**Cons**:
- Learning curve for atomic model
- May be overkill for our simple UI state

## Decision

**Selected**: Option 2 - TanStack Query for server state + Zustand for client state

## Rationale

### TanStack Query for Server State

The node data from `nodesSummary` is classic server state:
- Needs caching
- Needs background refresh (every 30s)
- Needs retry on failure
- Needs stale-while-revalidate pattern

TanStack Query handles all of this declaratively:

```typescript
export function useNodes() {
  return useQuery({
    queryKey: ['nodes'],
    queryFn: fetchNodes,
    refetchInterval: 30_000,
    staleTime: 10_000,
    retry: 3,
  });
}
```

### Zustand for Client State

Our UI state is simple:
- Selected node ID
- Current view (topology/geographic)
- Panel open/closed

Zustand provides this with minimal API:

```typescript
interface AppState {
  selectedNodeId: string | null;
  currentView: 'topology' | 'geographic';
  selectNode: (id: string | null) => void;
  setView: (view: 'topology' | 'geographic') => void;
}

const useAppStore = create<AppState>((set) => ({
  selectedNodeId: null,
  currentView: 'topology',
  selectNode: (id) => set({ selectedNodeId: id }),
  setView: (view) => set({ currentView: view }),
}));
```

### Why Not Just One Library?

- TanStack Query excels at server state but isn't meant for client state
- Zustand for everything would mean reimplementing caching, retry, etc.
- Combined, they're ~15KB gzipped total - less than Redux alone

## Consequences

### Positive

- Clear separation: server state vs client state
- Minimal boilerplate
- Built-in DevTools for both libraries
- Excellent TypeScript inference
- Background refresh "just works"
- Tiny bundle impact

### Negative

- Two libraries to understand
- Two DevTools extensions
- Need to wire them together for derived state

### Integration Pattern

For combined state (e.g., selected node data):

```typescript
function useSelectedNode() {
  const { data: nodes } = useNodes();
  const selectedId = useAppStore((s) => s.selectedNodeId);

  return useMemo(
    () => nodes?.find((n) => n.nodeId === selectedId) ?? null,
    [nodes, selectedId]
  );
}
```

## References

- TanStack Query: https://tanstack.com/query
- Zustand: https://zustand-demo.pmnd.rs
- Comparison article: https://tkdodo.eu/blog/why-i-use-react-query
