# Product Requirements Document: Concordium Network Map

**Document ID**: PRD-2025-001
**Version**: 1.0
**Date**: 2025-12-12
**Status**: Approved
**Author**: Development Team

---

## 1. Executive Summary

### 1.1 Purpose

Build a production-ready network visualization dashboard for the Concordium blockchain that enables operators, validators, and community members to monitor network health, explore node topology, and analyze performance metrics in real-time.

### 1.2 Background

The Concordium blockchain network consists of 80+ nodes distributed globally. The existing dashboard at `dashboard.mainnet.concordium.software` provides raw data via API but lacks intuitive visualization of network topology and relationships. This product addresses that gap.

### 1.3 Data Source

- **API Endpoint**: `https://dashboard.mainnet.concordium.software/nodesSummary`
- **Data Format**: JSON array of node objects
- **Refresh Rate**: Real-time availability

---

## 2. Goals & Success Metrics

### 2.1 Product Goals

| Goal | Description |
|------|-------------|
| G1 | Enable real-time monitoring of Concordium network health |
| G2 | Visualize network topology showing actual peer connections |
| G3 | Provide geographic context for node distribution |
| G4 | Surface actionable health metrics for operators |

### 2.2 Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Page Load Time | < 3 seconds | Lighthouse performance score |
| Data Freshness | < 60 seconds | Auto-refresh interval |
| Node Visibility | 100% of online nodes | Compare API count vs displayed |
| Mobile Usability | Score > 90 | Lighthouse accessibility audit |

### 2.3 Non-Goals

- Historical data storage and trend analysis (future enhancement)
- Node management or control actions
- Authentication or user accounts
- Direct communication with nodes (read-only visualization)

---

## 3. User Personas

### 3.1 Network Operator

**Name**: Alex
**Role**: Infrastructure engineer at a Concordium validator
**Goals**: Monitor node health, identify connectivity issues, verify consensus participation
**Pain Points**: Needs quick visibility into network status without parsing raw JSON

### 3.2 Community Member

**Name**: Sam
**Role**: CCD token holder, blockchain enthusiast
**Goals**: Understand network decentralization, explore validator landscape
**Pain Points**: Technical dashboards are hard to interpret

### 3.3 Developer

**Name**: Jordan
**Role**: Building applications on Concordium
**Goals**: Verify network stability, understand node distribution
**Pain Points**: Needs reliable, up-to-date network information

---

## 4. Functional Requirements

### 4.1 Core Features

#### FR-1: Topology Graph View

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.1 | Display all nodes as interactive graph nodes | P0 |
| FR-1.2 | Draw edges representing peer connections from `peersList` | P0 |
| FR-1.3 | Color-code nodes by health status (healthy/lagging/issue) | P0 |
| FR-1.4 | Scale node size by peer count | P1 |
| FR-1.5 | Display baker badge for validator nodes | P1 |
| FR-1.6 | Support zoom, pan, and minimap navigation | P0 |
| FR-1.7 | Click node to select and show details | P0 |
| FR-1.8 | Hover node to show quick stats tooltip | P1 |

#### FR-2: Geographic Map View

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-2.1 | Display world map with node markers | P0 |
| FR-2.2 | Cluster nodes by inferred geographic region | P0 |
| FR-2.3 | Infer location from node name patterns | P1 |
| FR-2.4 | Show "approximate location" disclaimer | P0 |
| FR-2.5 | Click cluster to expand individual nodes | P1 |
| FR-2.6 | Use consistent color-coding with topology view | P0 |

#### FR-3: Node Detail Panel

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-3.1 | Display panel when node is selected | P0 |
| FR-3.2 | Show node name, status, and client version | P0 |
| FR-3.3 | Display connectivity metrics (peers, ping, bandwidth) | P0 |
| FR-3.4 | Show blockchain state (block height, finalization) | P0 |
| FR-3.5 | Display performance metrics (latency, throughput) | P1 |
| FR-3.6 | Show baker information for validator nodes | P1 |
| FR-3.7 | List connected peers with click-to-select | P1 |
| FR-3.8 | Collapsible/dismissible panel | P0 |

#### FR-4: Metrics Dashboard

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4.1 | Display total online node count | P0 |
| FR-4.2 | Show average peer connections | P0 |
| FR-4.3 | Display maximum finalization lag | P0 |
| FR-4.4 | Show consensus participation percentage | P0 |
| FR-4.5 | Display trend indicators (up/down arrows) | P2 |

#### FR-5: Data Refresh

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-5.1 | Auto-refresh data every 30 seconds | P0 |
| FR-5.2 | Display "last updated" timestamp | P0 |
| FR-5.3 | Provide manual refresh button | P0 |
| FR-5.4 | Show refresh progress indicator | P1 |
| FR-5.5 | Preserve selected node across refreshes | P0 |

### 4.2 View Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-6.1 | Toggle between topology and geographic views | P0 |
| FR-6.2 | Persist view preference across sessions | P2 |
| FR-6.3 | Smooth animated transitions between views | P2 |

---

## 5. Non-Functional Requirements

### 5.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1.1 | Initial page load | < 3 seconds |
| NFR-1.2 | Time to interactive | < 5 seconds |
| NFR-1.3 | Graph render (80+ nodes) | < 1 second |
| NFR-1.4 | View switch latency | < 300ms |

### 5.2 Reliability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-2.1 | Uptime | 99.9% |
| NFR-2.2 | Graceful degradation on API failure | Show cached data |
| NFR-2.3 | Error recovery | Auto-retry 3 times |

### 5.3 Compatibility

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-3.1 | Desktop browsers | Chrome, Firefox, Safari, Edge (latest 2 versions) |
| NFR-3.2 | Mobile browsers | iOS Safari, Chrome Android |
| NFR-3.3 | Minimum viewport | 320px width |

### 5.4 Accessibility

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-4.1 | WCAG compliance | Level AA |
| NFR-4.2 | Keyboard navigation | Full support |
| NFR-4.3 | Screen reader support | ARIA labels on all interactive elements |
| NFR-4.4 | Color contrast | 4.5:1 minimum |

### 5.5 Security

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-5.1 | Data transmission | HTTPS only |
| NFR-5.2 | API proxy | Server-side to prevent CORS exposure |
| NFR-5.3 | Input sanitization | No user input accepted |

---

## 6. User Interface

### 6.1 Layout Specification

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]  Concordium Network Map     [Topology│Geographic]   │
├─────────────────────────────────────────┬───────────────────┤
│                                         │                   │
│                                         │   Node Detail     │
│           Main Visualization            │   Panel           │
│           (70% width)                   │   (30% width)     │
│                                         │                   │
│                                         │   - Overview      │
│                                         │   - Connectivity  │
│                                         │   - Blockchain    │
│                                         │   - Performance   │
│                                         │                   │
├─────────────────────────────────────────┴───────────────────┤
│  [Nodes: 84]  [Avg Peers: 12]  [Lag: 2]  [Consensus: 95%]  │
│                                          Updated 12s ago 🔄 │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Responsive Breakpoints

| Breakpoint | Layout Adaptation |
|------------|-------------------|
| Desktop (≥1024px) | Full layout as shown |
| Tablet (768-1023px) | Side panel becomes bottom sheet |
| Mobile (<768px) | Full-screen map, FAB for metrics, bottom sheet for details |

### 6.3 Color System

| Status | Color | Hex |
|--------|-------|-----|
| Healthy | Green | `#22c55e` |
| Lagging | Yellow | `#eab308` |
| Issue | Red | `#ef4444` |
| Selected | Blue | `#3b82f6` |
| Neutral | Gray | `#6b7280` |

---

## 7. Data Specification

### 7.1 Node Object Structure

```typescript
interface ConcordiumNode {
  // Identity
  nodeName: string;
  nodeId: string;
  peerType: string;
  client: string;

  // Connectivity
  peersCount: number;
  peersList: string[];
  averagePing: number;
  averageBytesPerSecondIn: number;
  averageBytesPerSecondOut: number;

  // Blockchain State
  bestBlock: string;
  bestBlockHeight: number;
  finalizedBlock: string;
  finalizedBlockHeight: number;

  // Consensus
  consensusRunning: boolean;
  bakingCommitteeMember: string;
  finalizationCommitteeMember: boolean;
  consensusBakerId: number | null;

  // Metrics
  uptime: number;
  blockArrivePeriodEMA: number;
  blockReceivePeriodEMA: number;
  transactionsPerBlockEMA: number;
}
```

### 7.2 Health Status Derivation

| Status | Condition |
|--------|-----------|
| Healthy | `finalizedBlockHeight` within 2 blocks of max AND `consensusRunning` = true |
| Lagging | `finalizedBlockHeight` > 2 blocks behind max |
| Issue | `consensusRunning` = false OR missing required fields |

---

## 8. Release Criteria

### 8.1 Definition of Done

- [ ] All P0 requirements implemented and tested
- [ ] All P1 requirements implemented and tested
- [ ] Unit test coverage > 80%
- [ ] E2E tests pass for critical paths
- [ ] Lighthouse performance score > 90
- [ ] Lighthouse accessibility score > 90
- [ ] Code review completed
- [ ] Documentation updated

### 8.2 Launch Checklist

- [ ] Production deployment verified
- [ ] Error monitoring configured
- [ ] Analytics tracking implemented
- [ ] Runbook documented
- [ ] Rollback plan tested

---

## 9. Future Considerations

Items explicitly out of scope for v1.0, potential future enhancements:

1. **Historical Analytics**: Store node data over time, show trends and graphs
2. **Alerting**: Notify users when nodes go offline or lag exceeds threshold
3. **Node Comparison**: Side-by-side comparison of multiple nodes
4. **Custom Dashboards**: User-configurable metric displays
5. **API Access**: Public API for third-party integrations
6. **Geographic Accuracy**: IP-based geolocation for precise positioning

---

## 10. Appendix

### A. References

- Concordium Dashboard API: `https://dashboard.mainnet.concordium.software/nodesSummary`
- React Flow Documentation: `https://reactflow.dev`
- React Leaflet Documentation: `https://react-leaflet.js.org`
- shadcn/ui: `https://ui.shadcn.com`

### B. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-12 | Development Team | Initial release |
