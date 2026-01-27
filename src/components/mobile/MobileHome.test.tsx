/**
 * MobileHome Tests
 *
 * Tests for mobile home component including sortable columns
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileHome } from './MobileHome';

// Mock the hooks
vi.mock('@/hooks/useAppStore', () => ({
  useAppStore: vi.fn(() => ({
    selectedNodeId: null,
    selectNode: vi.fn(),
  })),
}));

vi.mock('@/hooks/useNodes', () => ({
  useNetworkMetrics: vi.fn(() => ({
    metrics: {
      totalNodes: 100,
      avgPeers: 15,
      maxFinalizationLag: 2,
      consensusParticipation: 85,
      avgLatency: 50,
    },
    dataUpdatedAt: Date.now(),
  })),
  useNodes: vi.fn(() => ({
    data: [
      {
        nodeId: 'node1',
        nodeName: 'AlphaNode',
        peersCount: 10,
        finalizedBlockHeight: 72723,
        consensusBakerId: 1,
        consensusRunning: true,
        averageLatency: 50,
        clientVersion: '6.3.0',
        uptime: 3600000,
        packetsSent: 1000,
        packetsReceived: 1000,
      },
      {
        nodeId: 'node2',
        nodeName: 'BetaNode',
        peersCount: 25,
        finalizedBlockHeight: 72723,
        consensusBakerId: null,
        consensusRunning: true,
        averageLatency: 30,
        clientVersion: '6.3.0',
        uptime: 7200000,
        packetsSent: 2000,
        packetsReceived: 2000,
      },
      {
        nodeId: 'node3',
        nodeName: 'GammaNode',
        peersCount: 5,
        finalizedBlockHeight: 72720,
        consensusBakerId: 2,
        consensusRunning: true,
        averageLatency: 100,
        clientVersion: '6.3.0',
        uptime: 1800000,
        packetsSent: 500,
        packetsReceived: 500,
      },
    ],
  })),
}));

vi.mock('@/hooks/usePeers', () => ({
  usePeers: vi.fn(() => ({
    peers: [],
  })),
}));

// Mock dynamic imports
vi.mock('next/dynamic', () => ({
  default: () => {
    const Component = () => <div>Mocked Component</div>;
    Component.displayName = 'MockedDynamicComponent';
    return Component;
  },
}));

// Mock MobileSecurityView to avoid QueryClient issues
vi.mock('./MobileSecurityView', () => ({
  MobileSecurityView: () => <div data-testid="mobile-security-view">Security View</div>,
}));

describe('MobileHome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('navigation', () => {
    it('renders three navigation tabs', () => {
      render(<MobileHome />);

      expect(screen.getByRole('button', { name: /list/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /topology/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /security/i })).toBeInTheDocument();
    });

    it('does not render Map tab (replaced by Security)', () => {
      render(<MobileHome />);

      expect(screen.queryByRole('button', { name: /^map$/i })).not.toBeInTheDocument();
    });

    it('switches to Security view when Security tab is clicked', () => {
      render(<MobileHome />);

      const securityTab = screen.getByRole('button', { name: /security/i });
      fireEvent.click(securityTab);

      // Security view should be active
      expect(securityTab).toHaveClass('active');
    });
  });

  describe('sortable columns', () => {
    it('renders sortable column headers', () => {
      render(<MobileHome />);

      // Use exact match to avoid matching "NODES" stat label
      const headers = document.querySelector('.mobile-list-headers');
      expect(headers).toBeInTheDocument();
      expect(headers?.textContent).toContain('NODE');
      expect(headers?.textContent).toContain('PEERS');
    });

    it('shows sort indicator on active column', () => {
      render(<MobileHome />);

      // Default sort should show indicator on PEERS column (within headers)
      const headers = document.querySelector('.mobile-list-headers');
      const peersHeader = headers?.querySelector('button:nth-child(2)');
      expect(peersHeader?.textContent).toMatch(/[▲▼]/);
    });

    it('cycles through 4-stage sort when NODE header is clicked', () => {
      render(<MobileHome />);

      const headers = document.querySelector('.mobile-list-headers');
      const nodeHeader = headers?.querySelector('button:first-child') as HTMLButtonElement;

      // Click 1: Should show ▲ (A-Z)
      fireEvent.click(nodeHeader!);
      expect(nodeHeader?.textContent).toContain('▲');

      // Click 2: Should show ▼ (Z-A)
      fireEvent.click(nodeHeader!);
      expect(nodeHeader?.textContent).toContain('▼');

      // Click 3: Should show ✓▲ (Validators first, A-Z)
      fireEvent.click(nodeHeader!);
      expect(nodeHeader?.textContent).toContain('✓');

      // Click 4: Should show ✓▼ (Validators first, Z-A)
      fireEvent.click(nodeHeader!);
      expect(nodeHeader?.textContent).toContain('✓');
    });

    it('sorts nodes alphabetically when NODE header clicked (stage 1)', () => {
      render(<MobileHome />);

      const headers = document.querySelector('.mobile-list-headers');
      const nodeHeader = headers?.querySelector('button:first-child') as HTMLButtonElement;
      fireEvent.click(nodeHeader!);

      // Get node items in order
      const nodeItems = screen.getAllByTestId('mobile-node-item');
      const nodeNames = nodeItems.map((item) => item.querySelector('.mobile-node-name')?.textContent);

      // Should be sorted A-Z
      expect(nodeNames[0]).toContain('AlphaNode');
      expect(nodeNames[1]).toContain('BetaNode');
      expect(nodeNames[2]).toContain('GammaNode');
    });

    it('puts validators first when NODE header clicked 3 times (stage 3)', () => {
      render(<MobileHome />);

      const headers = document.querySelector('.mobile-list-headers');
      const nodeHeader = headers?.querySelector('button:first-child') as HTMLButtonElement;

      // Click 3 times to get to stage 3 (validators first, A-Z)
      fireEvent.click(nodeHeader!);
      fireEvent.click(nodeHeader!);
      fireEvent.click(nodeHeader!);

      // Get node items in order
      const nodeItems = screen.getAllByTestId('mobile-node-item');
      const nodeNames = nodeItems.map((item) => item.querySelector('.mobile-node-name')?.textContent);

      // Validators (AlphaNode, GammaNode) should be first, sorted A-Z
      // Then non-validators (BetaNode)
      expect(nodeNames[0]).toContain('AlphaNode');
      expect(nodeNames[1]).toContain('GammaNode');
      expect(nodeNames[2]).toContain('BetaNode');
    });

    it('toggles PEERS sort direction when clicked', () => {
      render(<MobileHome />);

      const headers = document.querySelector('.mobile-list-headers');
      const peersHeader = headers?.querySelector('button:nth-child(2)') as HTMLButtonElement;

      // Default is desc, click should change to asc
      fireEvent.click(peersHeader!);

      // Get node items - should be sorted by peers ascending
      const nodeItems = screen.getAllByTestId('mobile-node-item');
      const peerCounts = nodeItems.map((item) => {
        const text = item.querySelector('.mobile-node-peers')?.textContent;
        return parseInt(text?.match(/\d+/)?.[0] ?? '0');
      });

      // Should be sorted ascending: 5, 10, 25
      expect(peerCounts[0]).toBe(5);
      expect(peerCounts[1]).toBe(10);
      expect(peerCounts[2]).toBe(25);
    });
  });

  describe('stats display', () => {
    it('renders network stats', () => {
      render(<MobileHome />);

      expect(screen.getByText('100')).toBeInTheDocument(); // totalNodes
      expect(screen.getByText('15')).toBeInTheDocument(); // avgPeers
      expect(screen.getByText('2')).toBeInTheDocument(); // maxFinalizationLag
      expect(screen.getByText('85%')).toBeInTheDocument(); // consensusParticipation
    });
  });

  describe('search', () => {
    it('filters nodes by search query', () => {
      render(<MobileHome />);

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'Alpha' } });

      // Only AlphaNode should be visible
      expect(screen.getByText('AlphaNode')).toBeInTheDocument();
      expect(screen.queryByText('BetaNode')).not.toBeInTheDocument();
      expect(screen.queryByText('GammaNode')).not.toBeInTheDocument();
    });
  });
});
