/**
 * useAttackSurfaceFilters Tests
 *
 * Tests for the Zustand store managing Attack Surface filter and sort state.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useAttackSurfaceFilters } from './useAttackSurfaceFilters';

describe('useAttackSurfaceFilters', () => {
  // Reset store to initial state before each test
  beforeEach(() => {
    useAttackSurfaceFilters.getState().resetFilters();
  });

  describe('initial state', () => {
    it('has default filter mode of "all"', () => {
      expect(useAttackSurfaceFilters.getState().filterMode).toBe('all');
    });

    it('has default risk filter of "all"', () => {
      expect(useAttackSurfaceFilters.getState().riskFilter).toBe('all');
    });

    it('has empty search term', () => {
      expect(useAttackSurfaceFilters.getState().searchTerm).toBe('');
    });

    it('has default sort column of "risk"', () => {
      expect(useAttackSurfaceFilters.getState().sortColumn).toBe('risk');
    });

    it('has default sort direction of "desc"', () => {
      expect(useAttackSurfaceFilters.getState().sortDirection).toBe('desc');
    });

    it('has default node sort stage of 1', () => {
      expect(useAttackSurfaceFilters.getState().nodeSortStage).toBe(1);
    });
  });

  describe('setFilterMode', () => {
    it('sets filter mode to validators', () => {
      useAttackSurfaceFilters.getState().setFilterMode('validators');
      expect(useAttackSurfaceFilters.getState().filterMode).toBe('validators');
    });

    it('sets filter mode to withIp', () => {
      useAttackSurfaceFilters.getState().setFilterMode('withIp');
      expect(useAttackSurfaceFilters.getState().filterMode).toBe('withIp');
    });

    it('sets filter mode to withoutIp', () => {
      useAttackSurfaceFilters.getState().setFilterMode('withoutIp');
      expect(useAttackSurfaceFilters.getState().filterMode).toBe('withoutIp');
    });
  });

  describe('setRiskFilter', () => {
    it('sets risk filter to critical', () => {
      useAttackSurfaceFilters.getState().setRiskFilter('critical');
      expect(useAttackSurfaceFilters.getState().riskFilter).toBe('critical');
    });

    it('sets risk filter to high', () => {
      useAttackSurfaceFilters.getState().setRiskFilter('high');
      expect(useAttackSurfaceFilters.getState().riskFilter).toBe('high');
    });

    it('sets risk filter to medium', () => {
      useAttackSurfaceFilters.getState().setRiskFilter('medium');
      expect(useAttackSurfaceFilters.getState().riskFilter).toBe('medium');
    });

    it('sets risk filter to low', () => {
      useAttackSurfaceFilters.getState().setRiskFilter('low');
      expect(useAttackSurfaceFilters.getState().riskFilter).toBe('low');
    });

    it('sets risk filter to unknown', () => {
      useAttackSurfaceFilters.getState().setRiskFilter('unknown');
      expect(useAttackSurfaceFilters.getState().riskFilter).toBe('unknown');
    });
  });

  describe('setSearchTerm', () => {
    it('sets search term', () => {
      useAttackSurfaceFilters.getState().setSearchTerm('test node');
      expect(useAttackSurfaceFilters.getState().searchTerm).toBe('test node');
    });

    it('clears search term', () => {
      useAttackSurfaceFilters.getState().setSearchTerm('test');
      useAttackSurfaceFilters.getState().setSearchTerm('');
      expect(useAttackSurfaceFilters.getState().searchTerm).toBe('');
    });
  });

  describe('toggleSort', () => {
    describe('non-node columns', () => {
      it('switches to new column with ascending direction', () => {
        // Default is risk desc
        useAttackSurfaceFilters.getState().toggleSort('ip');
        expect(useAttackSurfaceFilters.getState().sortColumn).toBe('ip');
        expect(useAttackSurfaceFilters.getState().sortDirection).toBe('asc');
      });

      it('toggles direction when clicking same column', () => {
        useAttackSurfaceFilters.getState().toggleSort('ip');
        expect(useAttackSurfaceFilters.getState().sortDirection).toBe('asc');

        useAttackSurfaceFilters.getState().toggleSort('ip');
        expect(useAttackSurfaceFilters.getState().sortDirection).toBe('desc');

        useAttackSurfaceFilters.getState().toggleSort('ip');
        expect(useAttackSurfaceFilters.getState().sortDirection).toBe('asc');
      });

      it('works for port8888 column', () => {
        useAttackSurfaceFilters.getState().toggleSort('port8888');
        expect(useAttackSurfaceFilters.getState().sortColumn).toBe('port8888');
        expect(useAttackSurfaceFilters.getState().sortDirection).toBe('asc');
      });

      it('works for port20000 column', () => {
        useAttackSurfaceFilters.getState().toggleSort('port20000');
        expect(useAttackSurfaceFilters.getState().sortColumn).toBe('port20000');
      });

      it('works for portGrpcOther column', () => {
        useAttackSurfaceFilters.getState().toggleSort('portGrpcOther');
        expect(useAttackSurfaceFilters.getState().sortColumn).toBe('portGrpcOther');
      });

      it('works for portOther column', () => {
        useAttackSurfaceFilters.getState().toggleSort('portOther');
        expect(useAttackSurfaceFilters.getState().sortColumn).toBe('portOther');
      });

      it('works for vulns column', () => {
        useAttackSurfaceFilters.getState().toggleSort('vulns');
        expect(useAttackSurfaceFilters.getState().sortColumn).toBe('vulns');
      });
    });

    describe('node column (4-stage cycle)', () => {
      it('switches to node column starting at stage 1', () => {
        useAttackSurfaceFilters.getState().toggleSort('node');
        expect(useAttackSurfaceFilters.getState().sortColumn).toBe('node');
        expect(useAttackSurfaceFilters.getState().nodeSortStage).toBe(1);
      });

      it('cycles through stages 1 → 2 → 3 → 4 → 1', () => {
        // First click: switch to node column, stage 1
        useAttackSurfaceFilters.getState().toggleSort('node');
        expect(useAttackSurfaceFilters.getState().nodeSortStage).toBe(1);

        // Second click: stage 2
        useAttackSurfaceFilters.getState().toggleSort('node');
        expect(useAttackSurfaceFilters.getState().nodeSortStage).toBe(2);

        // Third click: stage 3
        useAttackSurfaceFilters.getState().toggleSort('node');
        expect(useAttackSurfaceFilters.getState().nodeSortStage).toBe(3);

        // Fourth click: stage 4
        useAttackSurfaceFilters.getState().toggleSort('node');
        expect(useAttackSurfaceFilters.getState().nodeSortStage).toBe(4);

        // Fifth click: back to stage 1
        useAttackSurfaceFilters.getState().toggleSort('node');
        expect(useAttackSurfaceFilters.getState().nodeSortStage).toBe(1);
      });

      it('resets to stage 1 when switching from another column', () => {
        // Start on node column, advance to stage 3
        useAttackSurfaceFilters.getState().toggleSort('node');
        useAttackSurfaceFilters.getState().toggleSort('node');
        useAttackSurfaceFilters.getState().toggleSort('node');
        expect(useAttackSurfaceFilters.getState().nodeSortStage).toBe(3);

        // Switch to different column
        useAttackSurfaceFilters.getState().toggleSort('ip');
        expect(useAttackSurfaceFilters.getState().sortColumn).toBe('ip');

        // Switch back to node - should reset to stage 1
        useAttackSurfaceFilters.getState().toggleSort('node');
        expect(useAttackSurfaceFilters.getState().sortColumn).toBe('node');
        expect(useAttackSurfaceFilters.getState().nodeSortStage).toBe(1);
      });
    });
  });

  describe('resetFilters', () => {
    it('resets all state to initial values', () => {
      // Modify all state
      useAttackSurfaceFilters.getState().setFilterMode('validators');
      useAttackSurfaceFilters.getState().setRiskFilter('critical');
      useAttackSurfaceFilters.getState().setSearchTerm('test');
      useAttackSurfaceFilters.getState().toggleSort('node');
      useAttackSurfaceFilters.getState().toggleSort('node');
      useAttackSurfaceFilters.getState().toggleSort('node');

      // Verify modified state
      expect(useAttackSurfaceFilters.getState().filterMode).toBe('validators');
      expect(useAttackSurfaceFilters.getState().riskFilter).toBe('critical');
      expect(useAttackSurfaceFilters.getState().searchTerm).toBe('test');
      expect(useAttackSurfaceFilters.getState().sortColumn).toBe('node');
      expect(useAttackSurfaceFilters.getState().nodeSortStage).toBe(3);

      // Reset
      useAttackSurfaceFilters.getState().resetFilters();

      // Verify reset to initial
      expect(useAttackSurfaceFilters.getState().filterMode).toBe('all');
      expect(useAttackSurfaceFilters.getState().riskFilter).toBe('all');
      expect(useAttackSurfaceFilters.getState().searchTerm).toBe('');
      expect(useAttackSurfaceFilters.getState().sortColumn).toBe('risk');
      expect(useAttackSurfaceFilters.getState().sortDirection).toBe('desc');
      expect(useAttackSurfaceFilters.getState().nodeSortStage).toBe(1);
    });
  });

  describe('integration: combined filter and sort workflow', () => {
    it('supports typical user workflow', () => {
      const store = useAttackSurfaceFilters.getState();

      // User filters to validators
      store.setFilterMode('validators');

      // User sorts by risk (already default)
      store.toggleSort('risk');
      expect(useAttackSurfaceFilters.getState().sortDirection).toBe('asc');

      // User filters by high risk
      store.setRiskFilter('high');

      // User searches for specific node
      store.setSearchTerm('validator');

      // Verify all filters active
      expect(useAttackSurfaceFilters.getState().filterMode).toBe('validators');
      expect(useAttackSurfaceFilters.getState().riskFilter).toBe('high');
      expect(useAttackSurfaceFilters.getState().searchTerm).toBe('validator');
      expect(useAttackSurfaceFilters.getState().sortColumn).toBe('risk');

      // User resets all
      store.resetFilters();
      expect(useAttackSurfaceFilters.getState().filterMode).toBe('all');
      expect(useAttackSurfaceFilters.getState().searchTerm).toBe('');
    });
  });
});
