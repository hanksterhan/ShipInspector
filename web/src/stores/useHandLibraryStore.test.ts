import { describe, it, expect, beforeEach, vi } from "vitest";
import { useHandLibraryStore } from "./useHandLibraryStore";

vi.mock("@/services", () => ({
  handService: {
    listHands: vi.fn(),
    deleteHand: vi.fn(),
  },
}));

import { handService } from "@/services";

const mockHands = [
  {
    id: "1",
    table_size: 6,
    button_seat: 0,
    small_blind: 50,
    big_blind: 100,
    ante: 0,
    board_flop_1: null,
    board_flop_2: null,
    board_flop_3: null,
    board_turn: null,
    board_river: null,
    created_at: Date.now(),
  },
  {
    id: "2",
    table_size: 9,
    button_seat: 3,
    small_blind: 100,
    big_blind: 200,
    ante: 25,
    board_flop_1: "14h",
    board_flop_2: "13d",
    board_flop_3: "2c",
    board_turn: null,
    board_river: null,
    created_at: Date.now() - 1000,
  },
];

describe("useHandLibraryStore", () => {
  beforeEach(() => {
    useHandLibraryStore.setState({
      hands: [],
      nextCursor: null,
      isLoading: false,
      error: null,
      filters: {},
      selectedHandId: null,
    });
    vi.clearAllMocks();
  });

  it("fetchHands loads initial page", async () => {
    vi.mocked(handService.listHands).mockResolvedValue({
      hands: mockHands,
      nextCursor: "cursor-1",
    });

    await useHandLibraryStore.getState().fetchHands();

    const state = useHandLibraryStore.getState();
    expect(state.hands).toHaveLength(2);
    expect(state.nextCursor).toBe("cursor-1");
    expect(state.isLoading).toBe(false);
  });

  it("loadMore appends next page", async () => {
    useHandLibraryStore.setState({
      hands: mockHands,
      nextCursor: "cursor-1",
    });

    const moreHands = [
      { ...mockHands[0], id: "3" },
    ];
    vi.mocked(handService.listHands).mockResolvedValue({
      hands: moreHands,
      nextCursor: null,
    });

    await useHandLibraryStore.getState().loadMore();

    const state = useHandLibraryStore.getState();
    expect(state.hands).toHaveLength(3);
    expect(state.nextCursor).toBeNull();
  });

  it("deleteHand optimistically removes then calls API", async () => {
    useHandLibraryStore.setState({ hands: mockHands });
    vi.mocked(handService.deleteHand).mockResolvedValue(undefined);

    await useHandLibraryStore.getState().deleteHand("1");

    expect(useHandLibraryStore.getState().hands).toHaveLength(1);
    expect(useHandLibraryStore.getState().hands[0].id).toBe("2");
    expect(handService.deleteHand).toHaveBeenCalledWith("1");
  });

  it("deleteHand rollback restores hand on API error", async () => {
    useHandLibraryStore.setState({ hands: mockHands });
    vi.mocked(handService.deleteHand).mockRejectedValue(
      new Error("Network error"),
    );

    await useHandLibraryStore.getState().deleteHand("1");

    const state = useHandLibraryStore.getState();
    expect(state.hands).toHaveLength(2);
    expect(state.error).toBe("Network error");
  });

  it("setSelectedHandId updates selection", () => {
    useHandLibraryStore.getState().setSelectedHandId("1");
    expect(useHandLibraryStore.getState().selectedHandId).toBe("1");
  });
});
