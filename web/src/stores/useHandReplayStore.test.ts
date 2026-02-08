import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  useHandReplayStore,
  selectPlayerStateBySeat,
  selectCurrentStreet,
  selectVisibleCards,
  selectCurrentPot,
  selectActivePlayers,
  selectIsComplete,
  selectTotalActions,
  selectCurrentAction,
  selectWinnerSeats,
  selectPlayerInfoBySeat,
} from "./useHandReplayStore";
import type { HandForPlayback } from "@common/interfaces";

vi.mock("@/services", () => ({
  handService: {
    getHand: vi.fn(),
  },
}));

import { handService } from "@/services";

const mockHand: HandForPlayback = {
  hand: {
    id: "hand-1",
    table_size: 6,
    button_seat: 0,
    small_blind: 50,
    big_blind: 100,
    ante: 0,
    board_flop_1: "14h",
    board_flop_2: "13d",
    board_flop_3: "2c",
    board_turn: "10s",
    board_river: "7h",
    created_at: Date.now(),
  },
  players: [
    {
      seat_index: 0,
      display_name: "Alice",
      stack_at_start: 10000,
      is_hero: true,
      showdown_card_1: "14s",
      showdown_card_2: "13s",
    },
    {
      seat_index: 1,
      display_name: "Bob",
      stack_at_start: 10000,
      is_hero: false,
      showdown_card_1: "12h",
      showdown_card_2: "11h",
    },
  ],
  actions: [
    {
      sequence_index: 0,
      street: "preflop",
      actor_seat: 0,
      action_type: "POST_SB",
      amount: 50,
      raise_to: null,
      tags: [],
    },
    {
      sequence_index: 1,
      street: "preflop",
      actor_seat: 1,
      action_type: "POST_BB",
      amount: 100,
      raise_to: null,
      tags: [],
    },
    {
      sequence_index: 2,
      street: "preflop",
      actor_seat: 0,
      action_type: "RAISE",
      amount: null,
      raise_to: 300,
      tags: [],
    },
    {
      sequence_index: 3,
      street: "preflop",
      actor_seat: 1,
      action_type: "CALL",
      amount: 200,
      raise_to: null,
      tags: [],
    },
    {
      sequence_index: 4,
      street: "flop",
      actor_seat: null,
      action_type: "DEAL_FLOP",
      amount: null,
      raise_to: null,
      tags: [],
    },
    {
      sequence_index: 5,
      street: "flop",
      actor_seat: 0,
      action_type: "BET",
      amount: 400,
      raise_to: null,
      tags: [],
    },
    {
      sequence_index: 6,
      street: "flop",
      actor_seat: 1,
      action_type: "CALL",
      amount: 400,
      raise_to: null,
      tags: [],
    },
    {
      sequence_index: 7,
      street: "turn",
      actor_seat: null,
      action_type: "DEAL_TURN",
      amount: null,
      raise_to: null,
      tags: [],
    },
    {
      sequence_index: 8,
      street: "turn",
      actor_seat: 0,
      action_type: "CHECK",
      amount: null,
      raise_to: null,
      tags: [],
    },
    {
      sequence_index: 9,
      street: "turn",
      actor_seat: 1,
      action_type: "CHECK",
      amount: null,
      raise_to: null,
      tags: [],
    },
    {
      sequence_index: 10,
      street: "river",
      actor_seat: null,
      action_type: "DEAL_RIVER",
      amount: null,
      raise_to: null,
      tags: [],
    },
    {
      sequence_index: 11,
      street: "river",
      actor_seat: 0,
      action_type: "BET",
      amount: 800,
      raise_to: null,
      tags: [],
    },
    {
      sequence_index: 12,
      street: "river",
      actor_seat: 1,
      action_type: "FOLD",
      amount: null,
      raise_to: null,
      tags: [],
    },
    {
      sequence_index: 13,
      street: "river",
      actor_seat: 0,
      action_type: "COLLECT",
      amount: 2200,
      raise_to: null,
      tags: [],
    },
  ],
};

type SelectorState = Parameters<typeof selectCurrentStreet>[0];

function mockState(overrides: Partial<SelectorState>): SelectorState {
  return {
    hand: null,
    currentActionIndex: -1,
    isPlaying: false,
    playbackSpeed: 800,
    loadStatus: "idle",
    loadError: null,
    ...overrides,
  };
}

describe("useHandReplayStore", () => {
  beforeEach(() => {
    useHandReplayStore.setState({
      hand: null,
      currentActionIndex: -1,
      isPlaying: false,
      playbackSpeed: 800,
      loadStatus: "idle",
      loadError: null,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Store Actions", () => {
    it("has correct initial state", () => {
      const state = useHandReplayStore.getState();
      expect(state.hand).toBeNull();
      expect(state.currentActionIndex).toBe(-1);
      expect(state.isPlaying).toBe(false);
      expect(state.playbackSpeed).toBe(800);
      expect(state.loadStatus).toBe("idle");
      expect(state.loadError).toBeNull();
    });

    it("loadHand success: calls handService.getHand and sets hand data", async () => {
      vi.mocked(handService.getHand).mockResolvedValue(mockHand);

      await useHandReplayStore.getState().loadHand("hand-1");

      const state = useHandReplayStore.getState();
      expect(handService.getHand).toHaveBeenCalledWith("hand-1");
      expect(state.hand).toEqual(mockHand);
      expect(state.loadStatus).toBe("success");
      expect(state.currentActionIndex).toBe(-1);
      expect(state.loadError).toBeNull();
    });

    it("loadHand error: sets loadError and loadStatus", async () => {
      vi.mocked(handService.getHand).mockRejectedValue(
        new Error("Network failure"),
      );

      await useHandReplayStore.getState().loadHand("hand-1");

      const state = useHandReplayStore.getState();
      expect(state.loadError).toBe("Network failure");
      expect(state.loadStatus).toBe("error");
      expect(state.hand).toBeNull();
      expect(state.currentActionIndex).toBe(-1);
    });

    it("loadHand pauses current playback before loading", async () => {
      vi.useFakeTimers();
      useHandReplayStore.setState({
        hand: mockHand,
        currentActionIndex: 0,
      });

      useHandReplayStore.getState().play();
      expect(useHandReplayStore.getState().isPlaying).toBe(true);

      vi.mocked(handService.getHand).mockResolvedValue(mockHand);
      await useHandReplayStore.getState().loadHand("hand-2");

      expect(useHandReplayStore.getState().isPlaying).toBe(false);
    });

    it("stepForward: increments currentActionIndex", () => {
      useHandReplayStore.setState({ hand: mockHand, currentActionIndex: 0 });

      useHandReplayStore.getState().stepForward();

      expect(useHandReplayStore.getState().currentActionIndex).toBe(1);
    });

    it("stepForward: stops at last action", () => {
      useHandReplayStore.setState({
        hand: mockHand,
        currentActionIndex: mockHand.actions.length - 1,
      });

      useHandReplayStore.getState().stepForward();

      expect(useHandReplayStore.getState().currentActionIndex).toBe(
        mockHand.actions.length - 1,
      );
    });

    it("stepForward: does nothing if no hand", () => {
      useHandReplayStore.setState({ hand: null, currentActionIndex: -1 });

      useHandReplayStore.getState().stepForward();

      expect(useHandReplayStore.getState().currentActionIndex).toBe(-1);
    });

    it("stepBack: decrements currentActionIndex", () => {
      useHandReplayStore.setState({ hand: mockHand, currentActionIndex: 5 });

      useHandReplayStore.getState().stepBack();

      expect(useHandReplayStore.getState().currentActionIndex).toBe(4);
    });

    it("stepBack: stops at -1", () => {
      useHandReplayStore.setState({ hand: mockHand, currentActionIndex: 0 });

      useHandReplayStore.getState().stepBack();
      useHandReplayStore.getState().stepBack();

      expect(useHandReplayStore.getState().currentActionIndex).toBe(-1);
    });

    it("jumpToStreet: finds first action of target street and sets currentActionIndex", () => {
      useHandReplayStore.setState({ hand: mockHand, currentActionIndex: -1 });

      useHandReplayStore.getState().jumpToStreet("flop");

      expect(useHandReplayStore.getState().currentActionIndex).toBe(4);
    });

    it("jumpToStreet with nonexistent street: sets to -1", () => {
      useHandReplayStore.setState({ hand: mockHand, currentActionIndex: 5 });

      useHandReplayStore.getState().jumpToStreet("showdown");

      expect(useHandReplayStore.getState().currentActionIndex).toBe(-1);
    });

    it("setActionIndex: clamps between -1 and max", () => {
      useHandReplayStore.setState({ hand: mockHand, currentActionIndex: 0 });

      useHandReplayStore.getState().setActionIndex(100);
      expect(useHandReplayStore.getState().currentActionIndex).toBe(
        mockHand.actions.length - 1,
      );

      useHandReplayStore.getState().setActionIndex(-100);
      expect(useHandReplayStore.getState().currentActionIndex).toBe(-1);

      useHandReplayStore.getState().setActionIndex(5);
      expect(useHandReplayStore.getState().currentActionIndex).toBe(5);
    });

    it("play: starts interval-based playback and sets isPlaying true", () => {
      vi.useFakeTimers();
      useHandReplayStore.setState({ hand: mockHand, currentActionIndex: -1 });

      useHandReplayStore.getState().play();

      expect(useHandReplayStore.getState().isPlaying).toBe(true);
      expect(useHandReplayStore.getState().currentActionIndex).toBe(-1);

      vi.advanceTimersByTime(800);
      expect(useHandReplayStore.getState().currentActionIndex).toBe(0);

      vi.advanceTimersByTime(800);
      expect(useHandReplayStore.getState().currentActionIndex).toBe(1);
    });

    it("play: does nothing if already playing", () => {
      vi.useFakeTimers();
      useHandReplayStore.setState({
        hand: mockHand,
        currentActionIndex: -1,
        isPlaying: true,
      });

      useHandReplayStore.getState().play();

      vi.advanceTimersByTime(800);
      expect(useHandReplayStore.getState().currentActionIndex).toBe(-1);
    });

    it("play: does nothing if complete", () => {
      vi.useFakeTimers();
      useHandReplayStore.setState({
        hand: mockHand,
        currentActionIndex: mockHand.actions.length - 1,
      });

      useHandReplayStore.getState().play();

      expect(useHandReplayStore.getState().isPlaying).toBe(false);
    });

    it("play: auto-pauses when reaching last action", () => {
      vi.useFakeTimers();
      useHandReplayStore.setState({
        hand: mockHand,
        currentActionIndex: mockHand.actions.length - 2,
      });

      useHandReplayStore.getState().play();
      expect(useHandReplayStore.getState().isPlaying).toBe(true);

      vi.advanceTimersByTime(800);
      expect(useHandReplayStore.getState().currentActionIndex).toBe(
        mockHand.actions.length - 1,
      );

      vi.advanceTimersByTime(800);
      expect(useHandReplayStore.getState().isPlaying).toBe(false);
    });

    it("pause: clears interval and sets isPlaying false", () => {
      vi.useFakeTimers();
      useHandReplayStore.setState({ hand: mockHand, currentActionIndex: -1 });

      useHandReplayStore.getState().play();
      expect(useHandReplayStore.getState().isPlaying).toBe(true);

      useHandReplayStore.getState().pause();
      expect(useHandReplayStore.getState().isPlaying).toBe(false);

      const indexBeforePause = useHandReplayStore.getState().currentActionIndex;
      vi.advanceTimersByTime(800);
      expect(useHandReplayStore.getState().currentActionIndex).toBe(
        indexBeforePause,
      );
    });

    it("reset: pauses and sets currentActionIndex to -1", () => {
      vi.useFakeTimers();
      useHandReplayStore.setState({
        hand: mockHand,
        currentActionIndex: 5,
      });

      useHandReplayStore.getState().play();
      useHandReplayStore.getState().reset();

      expect(useHandReplayStore.getState().isPlaying).toBe(false);
      expect(useHandReplayStore.getState().currentActionIndex).toBe(-1);
    });

    it("setPlaybackSpeed: updates speed", () => {
      useHandReplayStore.setState({ playbackSpeed: 800 });

      useHandReplayStore.getState().setPlaybackSpeed(500);

      expect(useHandReplayStore.getState().playbackSpeed).toBe(500);
    });

    it("setPlaybackSpeed: restarts playback if was playing", () => {
      vi.useFakeTimers();
      useHandReplayStore.setState({ hand: mockHand, currentActionIndex: -1 });

      useHandReplayStore.getState().play();
      expect(useHandReplayStore.getState().isPlaying).toBe(true);

      useHandReplayStore.getState().setPlaybackSpeed(400);

      expect(useHandReplayStore.getState().isPlaying).toBe(true);
      expect(useHandReplayStore.getState().playbackSpeed).toBe(400);

      vi.advanceTimersByTime(400);
      expect(useHandReplayStore.getState().currentActionIndex).toBe(0);
    });

    it("setPlaybackSpeed: does not start playback if not playing", () => {
      vi.useFakeTimers();
      useHandReplayStore.setState({
        hand: mockHand,
        currentActionIndex: -1,
        isPlaying: false,
      });

      useHandReplayStore.getState().setPlaybackSpeed(400);

      vi.advanceTimersByTime(400);
      expect(useHandReplayStore.getState().currentActionIndex).toBe(-1);
      expect(useHandReplayStore.getState().isPlaying).toBe(false);
    });

    it("setPlaybackSpeed: enforces minimum of 100ms", () => {
      useHandReplayStore.setState({ playbackSpeed: 800 });

      useHandReplayStore.getState().setPlaybackSpeed(50);

      expect(useHandReplayStore.getState().playbackSpeed).toBe(100);
    });

    it("dispose: pauses playback", () => {
      vi.useFakeTimers();
      useHandReplayStore.setState({ hand: mockHand, currentActionIndex: -1 });

      useHandReplayStore.getState().play();
      expect(useHandReplayStore.getState().isPlaying).toBe(true);

      useHandReplayStore.getState().dispose();

      expect(useHandReplayStore.getState().isPlaying).toBe(false);
    });
  });

  describe("Selectors", () => {
    describe("selectCurrentStreet", () => {
      it("returns street of current action", () => {
        const state = mockState({
          hand: mockHand,
          currentActionIndex: 5,
        });

        expect(selectCurrentStreet(state)).toBe("flop");
      });

      it("returns preflop when no hand", () => {
        const state = mockState({
          hand: null,
          currentActionIndex: -1,
        });

        expect(selectCurrentStreet(state)).toBe("preflop");
      });

      it("returns preflop when empty actions", () => {
        const state = mockState({
          hand: { ...mockHand, actions: [] },
          currentActionIndex: -1,
        });

        expect(selectCurrentStreet(state)).toBe("preflop");
      });

      it("returns preflop when currentActionIndex is -1", () => {
        const state = mockState({
          hand: mockHand,
          currentActionIndex: -1,
        });

        expect(selectCurrentStreet(state)).toBe("preflop");
      });
    });

    describe("selectVisibleCards", () => {
      it("shows no board cards before DEAL_FLOP", () => {
        const state = mockState({
          hand: mockHand,
          currentActionIndex: 1,
        });

        const result = selectVisibleCards(state);

        expect(result.board).toHaveLength(0);
      });

      it("shows flop cards after DEAL_FLOP action", () => {
        const state = mockState({
          hand: mockHand,
          currentActionIndex: 4,
        });

        const result = selectVisibleCards(state);

        expect(result.board).toHaveLength(3);
        expect(result.board[0]).toEqual({ rank: 14, suit: "h" });
        expect(result.board[1]).toEqual({ rank: 13, suit: "d" });
        expect(result.board[2]).toEqual({ rank: 2, suit: "c" });
      });

      it("shows turn card after DEAL_TURN", () => {
        const state = mockState({
          hand: mockHand,
          currentActionIndex: 7,
        });

        const result = selectVisibleCards(state);

        expect(result.board).toHaveLength(4);
        expect(result.board[3]).toEqual({ rank: 10, suit: "s" });
      });

      it("shows river after DEAL_RIVER", () => {
        const state = mockState({
          hand: mockHand,
          currentActionIndex: 10,
        });

        const result = selectVisibleCards(state);

        expect(result.board).toHaveLength(5);
        expect(result.board[4]).toEqual({ rank: 7, suit: "h" });
      });

      it("hides hole cards until complete", () => {
        const state = mockState({
          hand: mockHand,
          currentActionIndex: 10,
        });

        const result = selectVisibleCards(state);

        expect(result.holeCardsBySeat.get(0)).toEqual([null, null]);
        expect(result.holeCardsBySeat.get(1)).toEqual([null, null]);
      });

      it("shows hole cards when complete (at last action)", () => {
        const state = mockState({
          hand: mockHand,
          currentActionIndex: mockHand.actions.length - 1,
        });

        const result = selectVisibleCards(state);

        expect(result.holeCardsBySeat.get(0)).toEqual([
          { rank: 14, suit: "s" },
          { rank: 13, suit: "s" },
        ]);
        expect(result.holeCardsBySeat.get(1)).toEqual([
          { rank: 12, suit: "h" },
          { rank: 11, suit: "h" },
        ]);
      });

      it("shows hole cards after REVEAL action", () => {
        const handWithReveal: HandForPlayback = {
          ...mockHand,
          actions: [
            ...mockHand.actions.slice(0, 8),
            {
              sequence_index: 14,
              street: "turn",
              actor_seat: 0,
              action_type: "REVEAL",
              amount: null,
              raise_to: null,
              tags: [],
            },
            ...mockHand.actions.slice(8),
          ],
        };

        const state = mockState({
          hand: handWithReveal,
          currentActionIndex: 8,
        });

        const result = selectVisibleCards(state);

        expect(result.holeCardsBySeat.get(0)).toEqual([
          { rank: 14, suit: "s" },
          { rank: 13, suit: "s" },
        ]);
        expect(result.holeCardsBySeat.get(1)).toEqual([null, null]);
      });
    });

    describe("selectCurrentPot", () => {
      it("calculates pot after SB+BB", () => {
        const state = mockState({
          hand: mockHand,
          currentActionIndex: 1,
        });

        expect(selectCurrentPot(state)).toBe(150);
      });

      it("calculates pot after raise+call", () => {
        const state = mockState({
          hand: mockHand,
          currentActionIndex: 3,
        });

        expect(selectCurrentPot(state)).toBe(600);
      });

      it("calculates pot after flop bets", () => {
        const state = mockState({
          hand: mockHand,
          currentActionIndex: 6,
        });

        expect(selectCurrentPot(state)).toBe(1400);
      });

      it("handles raise_to correctly (delta from current street bet)", () => {
        const state = mockState({
          hand: mockHand,
          currentActionIndex: 2,
        });

        expect(selectCurrentPot(state)).toBe(400);
      });

      it("returns 0 when no hand", () => {
        const state = mockState({
          hand: null,
          currentActionIndex: -1,
        });

        expect(selectCurrentPot(state)).toBe(0);
      });

      it("handles street transitions and resets street bets", () => {
        const state = mockState({
          hand: mockHand,
          currentActionIndex: 5,
        });

        expect(selectCurrentPot(state)).toBe(1000);
      });
    });

    describe("selectActivePlayers", () => {
      it("excludes folded players", () => {
        const state = mockState({
          hand: mockHand,
          currentActionIndex: mockHand.actions.length - 1,
        });

        const active = selectActivePlayers(state);

        expect(active.has(0)).toBe(true);
        expect(active.has(1)).toBe(false);
      });

      it("returns all players when none have folded", () => {
        const state = mockState({
          hand: mockHand,
          currentActionIndex: 10,
        });

        const active = selectActivePlayers(state);

        expect(active.has(0)).toBe(true);
        expect(active.has(1)).toBe(true);
      });

      it("returns empty set when no hand", () => {
        const state = mockState({
          hand: null,
          currentActionIndex: -1,
        });

        const active = selectActivePlayers(state);

        expect(active.size).toBe(0);
      });
    });

    describe("selectIsComplete", () => {
      it("returns true when at last action index", () => {
        const state = mockState({
          hand: mockHand,
          currentActionIndex: mockHand.actions.length - 1,
        });

        expect(selectIsComplete(state)).toBe(true);
      });

      it("returns false when not at last action", () => {
        const state = mockState({
          hand: mockHand,
          currentActionIndex: 5,
        });

        expect(selectIsComplete(state)).toBe(false);
      });

      it("returns false when no hand", () => {
        const state = mockState({
          hand: null,
          currentActionIndex: -1,
        });

        expect(selectIsComplete(state)).toBe(false);
      });
    });

    describe("selectTotalActions", () => {
      it("returns action count", () => {
        const state = mockState({
          hand: mockHand,
          currentActionIndex: 0,
        });

        expect(selectTotalActions(state)).toBe(14);
      });

      it("returns 0 when no hand", () => {
        const state = mockState({
          hand: null,
          currentActionIndex: -1,
        });

        expect(selectTotalActions(state)).toBe(0);
      });
    });

    describe("selectCurrentAction", () => {
      it("returns action at current index", () => {
        const state = mockState({
          hand: mockHand,
          currentActionIndex: 5,
        });

        const action = selectCurrentAction(state);

        expect(action).toEqual(mockHand.actions[5]);
      });

      it("returns null when currentActionIndex is -1", () => {
        const state = mockState({
          hand: mockHand,
          currentActionIndex: -1,
        });

        expect(selectCurrentAction(state)).toBeNull();
      });

      it("returns null when no hand", () => {
        const state = mockState({
          hand: null,
          currentActionIndex: -1,
        });

        expect(selectCurrentAction(state)).toBeNull();
      });
    });

    describe("selectWinnerSeats", () => {
      it("returns seats with COLLECT actions when complete", () => {
        const state = mockState({
          hand: mockHand,
          currentActionIndex: mockHand.actions.length - 1,
        });

        const winners = selectWinnerSeats(state);

        expect(winners.has(0)).toBe(true);
        expect(winners.size).toBe(1);
      });

      it("returns empty set when not complete", () => {
        const state = mockState({
          hand: mockHand,
          currentActionIndex: 10,
        });

        const winners = selectWinnerSeats(state);

        expect(winners.size).toBe(0);
      });

      it("falls back to last active player when no COLLECT actions", () => {
        const handWithoutCollect: HandForPlayback = {
          ...mockHand,
          actions: mockHand.actions.slice(0, -1),
        };

        const state = mockState({
          hand: handWithoutCollect,
          currentActionIndex: handWithoutCollect.actions.length - 1,
        });

        const winners = selectWinnerSeats(state);

        expect(winners.has(0)).toBe(true);
        expect(winners.size).toBe(1);
      });

      it("handles multiple winners with COLLECT actions", () => {
        const handWithMultipleWinners: HandForPlayback = {
          ...mockHand,
          actions: [
            ...mockHand.actions.slice(0, -1),
            {
              sequence_index: 13,
              street: "river",
              actor_seat: 0,
              action_type: "COLLECT",
              amount: 1100,
              raise_to: null,
              tags: [],
            },
            {
              sequence_index: 14,
              street: "river",
              actor_seat: 1,
              action_type: "COLLECT",
              amount: 1100,
              raise_to: null,
              tags: [],
            },
          ],
        };

        const state = mockState({
          hand: handWithMultipleWinners,
          currentActionIndex: handWithMultipleWinners.actions.length - 1,
        });

        const winners = selectWinnerSeats(state);

        expect(winners.has(0)).toBe(true);
        expect(winners.has(1)).toBe(true);
        expect(winners.size).toBe(2);
      });
    });

    describe("selectPlayerStateBySeat", () => {
      it("tracks stack, streetBet, isAllIn per player across actions", () => {
        const state = mockState({
          hand: mockHand,
          currentActionIndex: 6,
        });

        const result = selectPlayerStateBySeat(state);

        const player0 = result.get(0);
        expect(player0?.stack).toBe(9300);
        expect(player0?.streetBet).toBe(400);
        expect(player0?.isAllIn).toBe(false);

        const player1 = result.get(1);
        expect(player1?.stack).toBe(9300);
        expect(player1?.streetBet).toBe(400);
        expect(player1?.isAllIn).toBe(false);
      });

      it("handles COLLECT actions by adding to stack", () => {
        const state = mockState({
          hand: mockHand,
          currentActionIndex: mockHand.actions.length - 1,
        });

        const result = selectPlayerStateBySeat(state);

        const player0 = result.get(0);
        expect(player0?.stack).toBe(10700);
      });

      it("resets street bets when street changes", () => {
        const state = mockState({
          hand: mockHand,
          currentActionIndex: 5,
        });

        const result = selectPlayerStateBySeat(state);

        const player0 = result.get(0);
        expect(player0?.streetBet).toBe(400);
      });

      it("handles raise_to by calculating delta from current street bet", () => {
        const state = mockState({
          hand: mockHand,
          currentActionIndex: 2,
        });

        const result = selectPlayerStateBySeat(state);

        const player0 = result.get(0);
        expect(player0?.stack).toBe(9700);
        expect(player0?.streetBet).toBe(300);
      });

      it("detects all-in when stack reaches 0", () => {
        const handWithAllIn: HandForPlayback = {
          ...mockHand,
          players: [
            { ...mockHand.players[0], stack_at_start: 300 },
            mockHand.players[1],
          ],
          actions: [
            {
              sequence_index: 0,
              street: "preflop",
              actor_seat: 0,
              action_type: "ALL_IN",
              amount: 300,
              raise_to: null,
              tags: [],
            },
          ],
        };

        const state = mockState({
          hand: handWithAllIn,
          currentActionIndex: 0,
        });

        const result = selectPlayerStateBySeat(state);

        const player0 = result.get(0);
        expect(player0?.stack).toBe(0);
        expect(player0?.isAllIn).toBe(true);
      });

      it("returns empty map when no hand", () => {
        const state = mockState({
          hand: null,
          currentActionIndex: -1,
        });

        const result = selectPlayerStateBySeat(state);

        expect(result.size).toBe(0);
      });
    });

    describe("selectPlayerInfoBySeat", () => {
      it("returns name, stack, isHero from players", () => {
        const state = mockState({
          hand: mockHand,
          currentActionIndex: 0,
        });

        const result = selectPlayerInfoBySeat(state);

        const player0 = result.get(0);
        expect(player0?.name).toBe("Alice");
        expect(player0?.stack).toBe(10000);
        expect(player0?.isHero).toBe(true);

        const player1 = result.get(1);
        expect(player1?.name).toBe("Bob");
        expect(player1?.stack).toBe(10000);
        expect(player1?.isHero).toBe(false);
      });

      it("returns empty map when no hand", () => {
        const state = mockState({
          hand: null,
          currentActionIndex: -1,
        });

        const result = selectPlayerInfoBySeat(state);

        expect(result.size).toBe(0);
      });
    });
  });
});
