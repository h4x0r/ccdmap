/**
 * Attack Surface Filters Hook
 *
 * Zustand store for managing filter and sort state in the Attack Surface view.
 * Separates UI state from data fetching concerns.
 */

import { create } from 'zustand';
import type { FilterMode, RiskFilter, SortColumn, SortDirection, NodeSortStage } from '@/lib/attack-surface';
import { getNextNodeSortStage } from '@/lib/attack-surface';

interface AttackSurfaceFiltersState {
  // Filter state
  filterMode: FilterMode;
  riskFilter: RiskFilter;
  searchTerm: string;

  // Sort state
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  nodeSortStage: NodeSortStage;

  // Actions
  setFilterMode: (mode: FilterMode) => void;
  setRiskFilter: (risk: RiskFilter) => void;
  setSearchTerm: (term: string) => void;
  toggleSort: (column: SortColumn) => void;
  resetFilters: () => void;
}

const initialState = {
  filterMode: 'all' as FilterMode,
  riskFilter: 'all' as RiskFilter,
  searchTerm: '',
  sortColumn: 'risk' as SortColumn,
  sortDirection: 'desc' as SortDirection,
  nodeSortStage: 1 as NodeSortStage,
};

export const useAttackSurfaceFilters = create<AttackSurfaceFiltersState>((set) => ({
  ...initialState,

  setFilterMode: (mode) => set({ filterMode: mode }),

  setRiskFilter: (risk) => set({ riskFilter: risk }),

  setSearchTerm: (term) => set({ searchTerm: term }),

  toggleSort: (column) =>
    set((state) => {
      // Special handling for node column: cycle through 4 stages
      if (column === 'node') {
        if (state.sortColumn === 'node') {
          // Already on node column, advance to next stage
          return {
            nodeSortStage: getNextNodeSortStage(state.nodeSortStage),
          };
        }
        // Switching to node column, start at stage 1
        return {
          sortColumn: 'node',
          nodeSortStage: 1 as NodeSortStage,
        };
      }

      // For other columns: normal asc/desc toggle
      if (state.sortColumn === column) {
        return {
          sortDirection: state.sortDirection === 'asc' ? 'desc' : 'asc',
        };
      }
      // New column, start with ascending
      return {
        sortColumn: column,
        sortDirection: 'asc',
      };
    }),

  resetFilters: () => set(initialState),
}));
