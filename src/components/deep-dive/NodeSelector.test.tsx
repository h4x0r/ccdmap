import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NodeSelector, type NodeSelectorProps } from './NodeSelector';

describe('NodeSelector', () => {
  const mockNodes = [
    { nodeId: 'node-1', nodeName: 'BAKERMAN' },
    { nodeId: 'node-2', nodeName: 'CONCORDIUM-01' },
    { nodeId: 'node-3', nodeName: 'VALIDATOR-ALPHA' },
    { nodeId: 'node-4', nodeName: 'MAINNET-NODE' },
  ];

  const defaultProps: NodeSelectorProps = {
    isOpen: true,
    nodes: mockNodes,
    excludeNodeIds: [],
    onSelect: vi.fn(),
    onClose: vi.fn(),
  };

  describe('rendering', () => {
    it('renders when open', () => {
      render(<NodeSelector {...defaultProps} />);
      expect(screen.getByTestId('node-selector')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<NodeSelector {...defaultProps} isOpen={false} />);
      expect(screen.queryByTestId('node-selector')).not.toBeInTheDocument();
    });

    it('shows search input', () => {
      render(<NodeSelector {...defaultProps} />);
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    it('shows all nodes initially', () => {
      render(<NodeSelector {...defaultProps} />);
      expect(screen.getByText('BAKERMAN')).toBeInTheDocument();
      expect(screen.getByText('CONCORDIUM-01')).toBeInTheDocument();
      expect(screen.getByText('VALIDATOR-ALPHA')).toBeInTheDocument();
      expect(screen.getByText('MAINNET-NODE')).toBeInTheDocument();
    });

    it('shows close button', () => {
      render(<NodeSelector {...defaultProps} />);
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });
  });

  describe('filtering', () => {
    it('filters nodes as user types', () => {
      render(<NodeSelector {...defaultProps} />);
      const input = screen.getByPlaceholderText(/search/i);

      fireEvent.change(input, { target: { value: 'BAKER' } });

      expect(screen.getByText('BAKERMAN')).toBeInTheDocument();
      expect(screen.queryByText('CONCORDIUM-01')).not.toBeInTheDocument();
      expect(screen.queryByText('VALIDATOR-ALPHA')).not.toBeInTheDocument();
    });

    it('filters by node ID', () => {
      render(<NodeSelector {...defaultProps} />);
      const input = screen.getByPlaceholderText(/search/i);

      fireEvent.change(input, { target: { value: 'node-2' } });

      expect(screen.getByText('CONCORDIUM-01')).toBeInTheDocument();
      expect(screen.queryByText('BAKERMAN')).not.toBeInTheDocument();
    });

    it('is case insensitive', () => {
      render(<NodeSelector {...defaultProps} />);
      const input = screen.getByPlaceholderText(/search/i);

      fireEvent.change(input, { target: { value: 'bakerman' } });

      expect(screen.getByText('BAKERMAN')).toBeInTheDocument();
    });

    it('shows no results message when filter matches nothing', () => {
      render(<NodeSelector {...defaultProps} />);
      const input = screen.getByPlaceholderText(/search/i);

      fireEvent.change(input, { target: { value: 'xyz123notfound' } });

      expect(screen.getByText(/no nodes/i)).toBeInTheDocument();
    });
  });

  describe('exclusion', () => {
    it('excludes specified node IDs from list', () => {
      render(<NodeSelector {...defaultProps} excludeNodeIds={['node-1', 'node-3']} />);

      expect(screen.queryByText('BAKERMAN')).not.toBeInTheDocument();
      expect(screen.getByText('CONCORDIUM-01')).toBeInTheDocument();
      expect(screen.queryByText('VALIDATOR-ALPHA')).not.toBeInTheDocument();
      expect(screen.getByText('MAINNET-NODE')).toBeInTheDocument();
    });
  });

  describe('selection', () => {
    it('calls onSelect when node is clicked', () => {
      const onSelect = vi.fn();
      render(<NodeSelector {...defaultProps} onSelect={onSelect} />);

      fireEvent.click(screen.getByText('BAKERMAN'));

      expect(onSelect).toHaveBeenCalledWith('node-1');
    });

    it('calls onClose after selection', () => {
      const onClose = vi.fn();
      render(<NodeSelector {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByText('BAKERMAN'));

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('close behavior', () => {
    it('calls onClose when close button clicked', () => {
      const onClose = vi.fn();
      render(<NodeSelector {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByRole('button', { name: /close/i }));

      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when backdrop clicked', () => {
      const onClose = vi.fn();
      render(<NodeSelector {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByTestId('node-selector-backdrop'));

      expect(onClose).toHaveBeenCalled();
    });
  });
});
