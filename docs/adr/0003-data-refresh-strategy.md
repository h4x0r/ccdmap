# ADR-0003: Data Refresh Strategy

**Status**: Accepted
**Date**: 2025-12-12
**Deciders**: Development Team
**Technical Area**: Data Management

## Context

The Concordium network map needs to display near-real-time data. The source API at `dashboard.mainnet.concordium.software/nodesSummary` provides current state but requires periodic polling (no WebSocket/SSE available).

We need to balance:
- Data freshness for monitoring use cases
- API server load (be a good citizen)
- User experience (avoid jarring updates)
- Network efficiency

## Decision Drivers

- Monitoring use case requires reasonably fresh data
- No real-time push from API (polling required)
- Respect for upstream API resources
- User should know data age
- Manual override for immediate refresh

## Options Considered

### Option 1: Manual Refresh Only

**Pros**:
- Minimal API load
- User controls when to fetch
- Simple implementation

**Cons**:
- Poor for monitoring use case
- Users may forget to refresh
- Data becomes stale unknowingly

### Option 2: Aggressive Auto-Refresh (5-10 seconds)

**Pros**:
- Near-real-time data
- Good for active monitoring

**Cons**:
- High API load
- Network overhead
- May hit rate limits
- Battery drain on mobile

### Option 3: Hybrid (30s auto + manual)

**Pros**:
- Balanced freshness (30s reasonable for blockchain state)
- Manual override when needed
- Reasonable API load
- Clear data age indicator

**Cons**:
- Slightly more complex UI
- Need to handle concurrent refresh requests

### Option 4: Adaptive Refresh

**Pros**:
- Intelligent based on network activity
- Optimal efficiency

**Cons**:
- Complex implementation
- Hard to explain to users
- May miss important changes

## Decision

**Selected**: Option 3 - Hybrid refresh (30-second auto-refresh with manual override)

## Rationale

### 30-Second Interval Justification

1. **Blockchain context**: Concordium produces blocks every ~10 seconds. A 30-second refresh captures ~3 block cycles, sufficient for monitoring block progression.

2. **API consideration**: With ~100 potential dashboard users, 30-second intervals mean ~200 requests/minute at peak - sustainable load.

3. **User perception**: Research shows users perceive data as "live" when updated within 60 seconds for monitoring dashboards.

### Implementation Details

```typescript
// TanStack Query configuration
const { data, dataUpdatedAt, refetch, isFetching } = useQuery({
  queryKey: ['nodes'],
  queryFn: fetchNodes,
  refetchInterval: 30_000,           // Auto-refresh every 30s
  staleTime: 10_000,                 // Consider fresh for 10s
  refetchOnWindowFocus: true,        // Refresh when tab becomes active
  refetchIntervalInBackground: false, // Pause when tab hidden
  retry: 3,
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
});
```

### User Interface Elements

1. **Data age indicator**: "Updated 12s ago" - updates every second
2. **Refresh button**: Manual trigger, disabled while fetching
3. **Progress indicator**: Subtle bar showing time until next refresh
4. **Loading state**: Skeleton or spinner during fetch (not full screen reload)

### Stale-While-Revalidate Pattern

- Show existing data immediately
- Fetch new data in background
- Update UI seamlessly when new data arrives
- Preserve selected node across updates

## Consequences

### Positive

- Users always see data age
- Monitoring use case satisfied
- Respectful API usage
- Manual override available
- No jarring full-page reloads

### Negative

- 30-second gap may miss rapid network changes
- Additional UI complexity for indicators

### Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| Tab hidden | Pause auto-refresh, resume on focus |
| Network offline | Show cached data, display offline banner |
| API error | Retry 3x with backoff, show error if persistent |
| Manual + auto collision | Deduplicate requests via query key |
| Rapid manual clicks | Debounced, button disabled while fetching |

## Metrics to Monitor

- API response times
- Request failure rate
- Average data age seen by users
- Manual refresh frequency (indicates if auto is sufficient)

## References

- TanStack Query stale-while-revalidate: https://tanstack.com/query/latest/docs/react/guides/important-defaults
- Polling best practices: https://web.dev/patterns/web-vitals-patterns/polling
