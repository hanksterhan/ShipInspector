import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SortField = 'date' | 'stakes' | 'tableSize';
export type SortDirection = 'asc' | 'desc';
export type ViewMode = 'list' | 'grid';

interface HandLibraryFiltersState {
  dateStart: string;
  dateEnd: string;
  stakes: string;
  tableSize: number | null;
  heroCards: string;
  sortField: SortField;
  sortDirection: SortDirection;
  viewMode: ViewMode;
}

interface HandLibraryFiltersActions {
  setDateStart: (date: string) => void;
  setDateEnd: (date: string) => void;
  setStakes: (stakes: string) => void;
  setTableSize: (size: number | null) => void;
  setHeroCards: (cards: string) => void;
  setSortField: (field: SortField) => void;
  setSortDirection: (direction: SortDirection) => void;
  toggleSort: (field: SortField) => void;
  setViewMode: (mode: ViewMode) => void;
  clearFilters: () => void;
  hasActiveFilters: () => boolean;
}

const initialFiltersState: HandLibraryFiltersState = {
  dateStart: '',
  dateEnd: '',
  stakes: '',
  tableSize: null,
  heroCards: '',
  sortField: 'date',
  sortDirection: 'desc',
  viewMode: 'list',
};

export const useHandLibraryFiltersStore = create<
  HandLibraryFiltersState & HandLibraryFiltersActions
>()(
  persist(
    (set, get) => ({
      ...initialFiltersState,

      setDateStart: (date) => set({ dateStart: date }),
      setDateEnd: (date) => set({ dateEnd: date }),
      setStakes: (stakes) => set({ stakes }),
      setTableSize: (size) => set({ tableSize: size }),
      setHeroCards: (cards) => set({ heroCards: cards }),
      setSortField: (field) => set({ sortField: field }),
      setSortDirection: (direction) => set({ sortDirection: direction }),

      toggleSort: (field) => {
        const current = get();
        if (current.sortField === field) {
          set({ sortDirection: current.sortDirection === 'asc' ? 'desc' : 'asc' });
        } else {
          set({ sortField: field, sortDirection: 'desc' });
        }
      },

      setViewMode: (mode) => set({ viewMode: mode }),

      clearFilters: () => {
        const { viewMode } = get();
        set({
          ...initialFiltersState,
          viewMode,
        });
      },

      hasActiveFilters: () => {
        const state = get();
        return Boolean(
          state.dateStart ||
          state.dateEnd ||
          state.stakes ||
          state.tableSize !== null ||
          state.heroCards
        );
      },
    }),
    {
      name: 'hand-library-filters',
      partialize: (state) => ({
        viewMode: state.viewMode,
      }),
    }
  )
);
