import { create } from "zustand";
import type { Card, HandForPlayback, Street } from "@common/interfaces";
import { parseCard } from "@common/interfaces";
import { handService } from "@/services";

const DEFAULT_PLAYBACK_SPEED_MS = 800;

export interface VisibleCardsState {
  board: Card[];
  holeCardsBySeat: Map<number, [Card | null, Card | null]>;
}

interface HandReplayState {
  hand: HandForPlayback | null;
  currentActionIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  loadStatus: "idle" | "loading" | "success" | "error";
  loadError: string | null;
}

interface HandReplayActions {
  loadHand: (id: string) => Promise<void>;
  stepForward: () => void;
  stepBack: () => void;
  jumpToStreet: (street: Street) => void;
  setActionIndex: (index: number) => void;
  play: () => void;
  pause: () => void;
  reset: () => void;
  setPlaybackSpeed: (ms: number) => void;
  dispose: () => void;
}

// Selectors (replace MobX @computed)
export function selectPlayerStateBySeat(state: HandReplayState) {
  const result = new Map<
    number,
    { stack: number; streetBet: number; isAllIn: boolean }
  >();
  if (!state.hand) return result;

  const stackBySeat = new Map<number, number>();
  const streetBetBySeat = new Map<number, number>();
  for (const p of state.hand.players) {
    stackBySeat.set(p.seat_index, p.stack_at_start);
    streetBetBySeat.set(p.seat_index, 0);
  }

  const contributionActions = new Set([
    "POST_SB",
    "POST_BB",
    "POST_ANTE",
    "STRADDLE",
    "CALL",
    "BET",
    "RAISE",
    "ALL_IN",
  ]);

  let currentStreet: Street | null = null;
  const actionsToApply = state.hand.actions.slice(
    0,
    state.currentActionIndex + 1,
  );

  for (const action of actionsToApply) {
    if (currentStreet !== action.street) {
      currentStreet = action.street;
      streetBetBySeat.clear();
      for (const p of state.hand.players) {
        streetBetBySeat.set(p.seat_index, 0);
      }
    }

    if (action.actor_seat == null) continue;
    const seat = action.actor_seat;

    if (action.action_type === "COLLECT") {
      if (action.amount != null) {
        const existingStack = stackBySeat.get(seat) ?? 0;
        stackBySeat.set(seat, existingStack + action.amount);
      }
      continue;
    }

    if (!contributionActions.has(action.action_type)) continue;

    const currentStreetBet = streetBetBySeat.get(seat) ?? 0;
    let delta = 0;
    if (action.amount != null) {
      delta = action.amount;
    } else if (action.raise_to != null) {
      delta = Math.max(0, action.raise_to - currentStreetBet);
    }

    if (delta > 0) {
      const existingStack = stackBySeat.get(seat) ?? 0;
      stackBySeat.set(seat, Math.max(0, existingStack - delta));
      streetBetBySeat.set(seat, currentStreetBet + delta);
    }
  }

  for (const p of state.hand.players) {
    const stack = stackBySeat.get(p.seat_index) ?? p.stack_at_start;
    const streetBet = streetBetBySeat.get(p.seat_index) ?? 0;
    result.set(p.seat_index, {
      stack,
      streetBet,
      isAllIn: stack <= 0,
    });
  }

  return result;
}

export function selectCurrentStreet(state: HandReplayState): Street {
  if (!state.hand || state.hand.actions.length === 0) return "preflop";
  const idx = Math.min(
    state.currentActionIndex,
    state.hand.actions.length - 1,
  );
  if (idx < 0) return "preflop";
  return state.hand.actions[idx].street;
}

export function selectVisibleCards(state: HandReplayState): VisibleCardsState {
  const board: Card[] = [];
  const holeCardsBySeat = new Map<number, [Card | null, Card | null]>();

  if (!state.hand) return { board, holeCardsBySeat };

  const { hand: handRecord, players, actions } = state.hand;
  const actionsToApply = actions.slice(0, state.currentActionIndex + 1);
  const revealedSeats = new Set<number>();

  let flopDealt = false;
  let turnDealt = false;
  let riverDealt = false;

  for (const a of actionsToApply) {
    if (a.action_type === "DEAL_FLOP") flopDealt = true;
    if (a.action_type === "DEAL_TURN") turnDealt = true;
    if (a.action_type === "DEAL_RIVER") riverDealt = true;
    if (a.action_type === "REVEAL" && a.actor_seat != null) {
      revealedSeats.add(a.actor_seat);
    }
  }

  if (
    flopDealt &&
    handRecord.board_flop_1 &&
    handRecord.board_flop_2 &&
    handRecord.board_flop_3
  ) {
    board.push(
      parseCard(handRecord.board_flop_1),
      parseCard(handRecord.board_flop_2),
      parseCard(handRecord.board_flop_3),
    );
  }
  if (turnDealt && handRecord.board_turn) {
    board.push(parseCard(handRecord.board_turn));
  }
  if (riverDealt && handRecord.board_river) {
    board.push(parseCard(handRecord.board_river));
  }

  const isComplete = selectIsComplete(state);
  for (const p of players) {
    const seat = p.seat_index;
    if (
      (isComplete || revealedSeats.has(seat)) &&
      p.showdown_card_1 != null &&
      p.showdown_card_2 != null
    ) {
      holeCardsBySeat.set(seat, [
        parseCard(p.showdown_card_1),
        parseCard(p.showdown_card_2),
      ]);
    } else {
      holeCardsBySeat.set(seat, [null, null]);
    }
  }

  return { board, holeCardsBySeat };
}

export function selectCurrentPot(state: HandReplayState): number {
  if (!state.hand) return 0;
  let pot = 0;
  const contributionActions = new Set([
    "POST_SB",
    "POST_BB",
    "POST_ANTE",
    "STRADDLE",
    "CALL",
    "BET",
    "RAISE",
    "ALL_IN",
  ]);
  const actionsToApply = state.hand.actions.slice(
    0,
    state.currentActionIndex + 1,
  );
  const streetBetBySeat = new Map<number, number>();
  let currentStreet: Street | null = null;

  for (const p of state.hand.players) {
    streetBetBySeat.set(p.seat_index, 0);
  }

  for (const a of actionsToApply) {
    if (currentStreet !== a.street) {
      currentStreet = a.street;
      streetBetBySeat.clear();
      for (const p of state.hand.players) {
        streetBetBySeat.set(p.seat_index, 0);
      }
    }

    if (!contributionActions.has(a.action_type)) continue;
    if (a.actor_seat == null) continue;

    const seat = a.actor_seat;
    const currentStreetBet = streetBetBySeat.get(seat) ?? 0;
    let delta = 0;
    if (a.amount != null) {
      delta = a.amount;
    } else if (a.raise_to != null) {
      delta = Math.max(0, a.raise_to - currentStreetBet);
    }

    if (delta > 0) {
      pot += delta;
      streetBetBySeat.set(seat, currentStreetBet + delta);
    }
  }

  return pot;
}

export function selectActivePlayers(state: HandReplayState): Set<number> {
  if (!state.hand) return new Set();
  const folded = new Set<number>();
  const actionsToApply = state.hand.actions.slice(
    0,
    state.currentActionIndex + 1,
  );
  for (const a of actionsToApply) {
    if (a.action_type === "FOLD" && a.actor_seat != null) {
      folded.add(a.actor_seat);
    }
  }
  const seats = new Set(state.hand.players.map((p) => p.seat_index));
  for (const seat of folded) {
    seats.delete(seat);
  }
  return seats;
}

export function selectIsComplete(state: HandReplayState): boolean {
  if (!state.hand || state.hand.actions.length === 0) return false;
  return state.currentActionIndex >= state.hand.actions.length - 1;
}

export function selectTotalActions(state: HandReplayState): number {
  return state.hand?.actions.length ?? 0;
}

export function selectCurrentAction(state: HandReplayState) {
  if (!state.hand || state.currentActionIndex < 0) return null;
  return state.hand.actions[state.currentActionIndex] ?? null;
}

export function selectWinnerSeats(state: HandReplayState): Set<number> {
  const winners = new Set<number>();
  if (!state.hand || !selectIsComplete(state)) return winners;

  for (const a of state.hand.actions) {
    if (a.action_type === "COLLECT" && a.actor_seat != null) {
      winners.add(a.actor_seat);
    }
  }

  if (winners.size === 0) {
    const active = selectActivePlayers(state);
    if (active.size === 1) {
      active.forEach((seat) => winners.add(seat));
    }
  }

  return winners;
}

export function selectPlayerInfoBySeat(state: HandReplayState) {
  const map = new Map<
    number,
    { name: string; stack: number; isHero: boolean }
  >();
  if (!state.hand) return map;
  for (const p of state.hand.players) {
    map.set(p.seat_index, {
      name: p.display_name,
      stack: p.stack_at_start,
      isHero: p.is_hero,
    });
  }
  return map;
}

export const useHandReplayStore = create<HandReplayState & HandReplayActions>()(
  (set, get) => {
    let playTimerId: ReturnType<typeof setInterval> | null = null;

    return {
      hand: null,
      currentActionIndex: -1,
      isPlaying: false,
      playbackSpeed: DEFAULT_PLAYBACK_SPEED_MS,
      loadStatus: "idle",
      loadError: null,

      loadHand: async (id) => {
        get().pause();
        set({ loadStatus: "loading", loadError: null });

        try {
          const data = await handService.getHand(id);
          set({
            hand: data,
            currentActionIndex: -1,
            loadStatus: "success",
          });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to load hand";
          set({
            loadError: message,
            loadStatus: "error",
            hand: null,
            currentActionIndex: -1,
          });
        }
      },

      stepForward: () => {
        const { hand } = get();
        if (!hand || hand.actions.length === 0) return;
        set((s) => {
          if (s.currentActionIndex < (s.hand?.actions.length ?? 0) - 1) {
            return { currentActionIndex: s.currentActionIndex + 1 };
          }
          return s;
        });
      },

      stepBack: () => {
        set((s) => {
          if (s.currentActionIndex >= 0) {
            return { currentActionIndex: s.currentActionIndex - 1 };
          }
          return s;
        });
      },

      jumpToStreet: (street) => {
        const { hand } = get();
        if (!hand) return;
        const idx = hand.actions.findIndex((a) => a.street === street);
        set({ currentActionIndex: idx >= 0 ? idx : -1 });
      },

      setActionIndex: (index) => {
        const { hand } = get();
        if (!hand) return;
        const maxIndex = hand.actions.length - 1;
        set({ currentActionIndex: Math.max(-1, Math.min(index, maxIndex)) });
      },

      play: () => {
        const { hand, isPlaying } = get();
        if (!hand || hand.actions.length === 0 || isPlaying) return;
        if (selectIsComplete(get())) return;

        set({ isPlaying: true });
        playTimerId = setInterval(() => {
          const state = get();
          if (!state.hand || selectIsComplete(state)) {
            get().pause();
            return;
          }
          get().stepForward();
        }, get().playbackSpeed);
      },

      pause: () => {
        set({ isPlaying: false });
        if (playTimerId != null) {
          clearInterval(playTimerId);
          playTimerId = null;
        }
      },

      reset: () => {
        get().pause();
        set({ currentActionIndex: -1 });
      },

      setPlaybackSpeed: (ms) => {
        const wasPlaying = get().isPlaying;
        set({ playbackSpeed: Math.max(100, ms) });
        if (wasPlaying) {
          get().pause();
          get().play();
        }
      },

      dispose: () => {
        get().pause();
      },
    };
  },
);
