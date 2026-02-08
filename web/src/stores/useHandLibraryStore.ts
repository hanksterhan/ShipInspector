import { create } from "zustand";
import { handService } from "@/services";
import type { HandListItem } from "@/services/handService";

export interface HandLibraryFilters {
  minStakes?: number;
  maxStakes?: number;
  startDate?: number;
  endDate?: number;
}

const DEFAULT_PAGE_SIZE = 20;

interface HandLibraryState {
  hands: HandListItem[];
  nextCursor: string | null;
  isLoading: boolean;
  error: string | null;
  filters: HandLibraryFilters;
  selectedHandId: string | null;
}

interface HandLibraryActions {
  setSelectedHandId: (handId: string | null) => void;
  setFilters: (filters: HandLibraryFilters) => void;
  fetchHands: () => Promise<void>;
  loadMore: () => Promise<void>;
  refreshList: () => Promise<void>;
  deleteHand: (handId: string) => Promise<void>;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Request failed";
}

export const useHandLibraryStore = create<
  HandLibraryState & HandLibraryActions
>()((set, get) => ({
  hands: [],
  nextCursor: null,
  isLoading: false,
  error: null,
  filters: {},
  selectedHandId: null,

  setSelectedHandId: (handId) => set({ selectedHandId: handId }),

  setFilters: (filters) => {
    set({ filters: { ...filters } });
    get().fetchHands();
  },

  fetchHands: async () => {
    if (get().isLoading) return;

    set({ isLoading: true, error: null });
    try {
      const response = await handService.listHands({
        limit: DEFAULT_PAGE_SIZE,
        ...get().filters,
      });
      set({
        hands: response.hands,
        nextCursor: response.nextCursor,
        isLoading: false,
      });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  loadMore: async () => {
    const { isLoading, nextCursor } = get();
    if (isLoading || !nextCursor) return;

    set({ isLoading: true, error: null });
    const previousHands = get().hands;
    const previousCursor = nextCursor;

    try {
      const response = await handService.listHands({
        limit: DEFAULT_PAGE_SIZE,
        cursor: nextCursor,
        ...get().filters,
      });
      set({
        hands: [...previousHands, ...response.hands],
        nextCursor: response.nextCursor,
        isLoading: false,
      });
    } catch (error) {
      set({
        hands: previousHands,
        nextCursor: previousCursor,
        error: getErrorMessage(error),
        isLoading: false,
      });
    }
  },

  refreshList: async () => {
    await get().fetchHands();
  },

  deleteHand: async (handId) => {
    const previousHands = get().hands;
    const nextHands = previousHands.filter((hand) => hand.id !== handId);

    if (nextHands.length === previousHands.length) return;

    // Optimistic update
    set({ hands: nextHands, error: null });
    if (get().selectedHandId === handId) {
      set({ selectedHandId: null });
    }

    try {
      await handService.deleteHand(handId);
    } catch (error) {
      // Rollback on failure
      set({ hands: previousHands, error: getErrorMessage(error) });
    }
  },
}));
