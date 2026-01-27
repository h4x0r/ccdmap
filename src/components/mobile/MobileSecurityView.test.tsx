/**
 * MobileSecurityView Tests
 *
 * TDD tests for mobile Security tab (Attack Surface view)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileSecurityView } from './MobileSecurityView';

// Mock the hooks
vi.mock('@/hooks/useAttackSurface', () => ({
  useAttackSurface: vi.fn(() => ({
    nodes: [
      {
        nodeId: 'node1',
        nodeName: 'ValidatorNode',
        isValidator: true,
        ipAddress: '192.168.1.1',
        port: 8888,
        osintPorts: [8888, 20000],
        osintVulns: ['CVE-2024-001', 'CVE-2024-002'],
        osintTags: [],
        osintReputation: 'clean',
        osintLastScan: null,
        hasPeeringPort: true,
        hasGrpcDefault: true,
        hasGrpcOther: [],
        hasOtherPorts: [],
        riskLevel: 'high',
      },
      {
        nodeId: 'node2',
        nodeName: 'RegularNode',
        isValidator: false,
        ipAddress: '10.0.0.5',
        port: 8888,
        osintPorts: [8888],
        osintVulns: [],
        osintTags: [],
        osintReputation: 'clean',
        osintLastScan: null,
        hasPeeringPort: true,
        hasGrpcDefault: false,
        hasGrpcOther: [],
        hasOtherPorts: [],
        riskLevel: 'low',
      },
      {
        nodeId: 'node3',
        nodeName: 'NoIpNode',
        isValidator: false,
        ipAddress: null,
        port: null,
        osintPorts: [],
        osintVulns: [],
        osintTags: [],
        osintReputation: 'unknown',
        osintLastScan: null,
        hasPeeringPort: false,
        hasGrpcDefault: false,
        hasGrpcOther: [],
        hasOtherPorts: [],
        riskLevel: 'unknown',
      },
    ],
    stats: {
      total: 3,
      withIp: 2,
      withoutIp: 1,
      validators: 1,
      validatorsWithIp: 1,
      riskLevels: { critical: 0, high: 1, medium: 0, low: 1, unknown: 1 },
      portExposure: { peering: 2, grpcDefault: 1, grpcOther: 0 },
    },
    isLoading: false,
    osintError: null,
  })),
}));

vi.mock('@/hooks/useAttackSurfaceFilters', () => ({
  useAttackSurfaceFilters: vi.fn(() => ({
    filterMode: 'all',
    riskFilter: 'all',
    searchTerm: '',
    sortColumn: 'risk',
    sortDirection: 'desc',
    nodeSortStage: 1,
    setFilterMode: vi.fn(),
    setRiskFilter: vi.fn(),
    setSearchTerm: vi.fn(),
    toggleSort: vi.fn(),
    resetFilters: vi.fn(),
  })),
}));

vi.mock('@/hooks/useAppStore', () => ({
  useAppStore: vi.fn(() => ({
    selectNode: vi.fn(),
  })),
}));

describe('MobileSecurityView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders stats bar with risk counts', () => {
      render(<MobileSecurityView />);

      // Should show risk level counts
      expect(screen.getByText(/HIGH/)).toBeInTheDocument();
      expect(screen.getByText(/LOW/)).toBeInTheDocument();
    });

    it('renders filter pills', () => {
      render(<MobileSecurityView />);

      expect(screen.getByRole('button', { name: /ALL/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /VALIDATORS/i })).toBeInTheDocument();
    });

    it('renders search input', () => {
      render(<MobileSecurityView />);

      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    it('renders node list with risk indicators', () => {
      render(<MobileSecurityView />);

      expect(screen.getByText('ValidatorNode')).toBeInTheDocument();
      expect(screen.getByText('RegularNode')).toBeInTheDocument();
      expect(screen.getByText('NoIpNode')).toBeInTheDocument();
    });

    it('shows IP addresses for nodes that have them', () => {
      render(<MobileSecurityView />);

      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
      expect(screen.getByText('10.0.0.5')).toBeInTheDocument();
    });

    it('shows CVE count for nodes with vulnerabilities', () => {
      render(<MobileSecurityView />);

      expect(screen.getByText('2 CVE')).toBeInTheDocument();
    });

    it('shows validator badge for validator nodes', () => {
      render(<MobileSecurityView />);

      // ValidatorNode should have a validator indicator
      const validatorNode = screen.getByText('ValidatorNode').closest('.mobile-security-item');
      expect(validatorNode).toHaveTextContent('✓');
    });
  });

  describe('filtering', () => {
    it('calls setFilterMode when filter pill is clicked', async () => {
      const mockSetFilterMode = vi.fn();
      const { useAttackSurfaceFilters } = await import('@/hooks/useAttackSurfaceFilters');
      vi.mocked(useAttackSurfaceFilters).mockReturnValue({
        filterMode: 'all',
        riskFilter: 'all',
        searchTerm: '',
        sortColumn: 'risk',
        sortDirection: 'desc',
        nodeSortStage: 1,
        setFilterMode: mockSetFilterMode,
        setRiskFilter: vi.fn(),
        setSearchTerm: vi.fn(),
        toggleSort: vi.fn(),
        resetFilters: vi.fn(),
      });

      render(<MobileSecurityView />);

      const validatorsButton = screen.getByRole('button', { name: /VALIDATORS/i });
      fireEvent.click(validatorsButton);

      expect(mockSetFilterMode).toHaveBeenCalledWith('validators');
    });

    it('calls setSearchTerm when typing in search', async () => {
      const mockSetSearchTerm = vi.fn();
      const { useAttackSurfaceFilters } = await import('@/hooks/useAttackSurfaceFilters');
      vi.mocked(useAttackSurfaceFilters).mockReturnValue({
        filterMode: 'all',
        riskFilter: 'all',
        searchTerm: '',
        sortColumn: 'risk',
        sortDirection: 'desc',
        nodeSortStage: 1,
        setFilterMode: vi.fn(),
        setRiskFilter: vi.fn(),
        setSearchTerm: mockSetSearchTerm,
        toggleSort: vi.fn(),
        resetFilters: vi.fn(),
      });

      render(<MobileSecurityView />);

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      expect(mockSetSearchTerm).toHaveBeenCalledWith('test');
    });
  });

  describe('node selection', () => {
    it('calls selectNode when node is tapped', async () => {
      const mockSelectNode = vi.fn();
      const { useAppStore } = await import('@/hooks/useAppStore');
      vi.mocked(useAppStore).mockReturnValue({
        selectNode: mockSelectNode,
      } as ReturnType<typeof useAppStore>);

      render(<MobileSecurityView />);

      const nodeItem = screen.getByText('ValidatorNode').closest('button');
      fireEvent.click(nodeItem!);

      expect(mockSelectNode).toHaveBeenCalledWith('node1');
    });
  });

  describe('loading state', () => {
    it('shows loading indicator when data is loading', async () => {
      const { useAttackSurface } = await import('@/hooks/useAttackSurface');
      vi.mocked(useAttackSurface).mockReturnValue({
        nodes: [],
        stats: {
          total: 0,
          withIp: 0,
          withoutIp: 0,
          validators: 0,
          validatorsWithIp: 0,
          riskLevels: { critical: 0, high: 0, medium: 0, low: 0, unknown: 0 },
          portExposure: { peering: 0, grpcDefault: 0, grpcOther: 0 },
        },
        isLoading: true,
        osintError: null,
      });

      render(<MobileSecurityView />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error banner when osintError is present', async () => {
      const { useAttackSurface } = await import('@/hooks/useAttackSurface');
      vi.mocked(useAttackSurface).mockReturnValue({
        nodes: [],
        stats: {
          total: 0,
          withIp: 0,
          withoutIp: 0,
          validators: 0,
          validatorsWithIp: 0,
          riskLevels: { critical: 0, high: 0, medium: 0, low: 0, unknown: 0 },
          portExposure: { peering: 0, grpcDefault: 0, grpcOther: 0 },
        },
        isLoading: false,
        osintError: 'Failed to fetch OSINT data',
      });

      render(<MobileSecurityView />);

      expect(screen.getByText(/Failed to fetch OSINT data/)).toBeInTheDocument();
    });
  });
});
