import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { Card, HandRank } from "@common/interfaces";
import { pokerService } from "@/services";
import {
  holeToString,
  boardToString,
  formatHandRank,
  findBest5CardHand,
  cardsEqual,
} from "@/lib/poker";
import { parseScenario, type StudyScenario } from "@/lib/poker/scenario";
import { type Scope, nextScope } from "@/lib/poker/scopeNavigation";

export type { Scope } from "@/lib/poker/scopeNavigation";

const NUM_PLAYERS = 8;

export interface EquityState {
  status: "idle" | "loading" | "success" | "error";
  data: {
    win: number[];
    tie: number[];
    samples: number;
  } | null;
  error: string | null;
  playerEquity: Map<number, number>;
  playerTieEquity: Map<number, number>;
}

interface EquityCalculatorState {
  players: Array<[Card | null, Card | null]>;
  activePlayers: Set<number>;
  board: [Card | null, Card | null, Card | null, Card | null, Card | null];
  scope: Scope;
  pickerOpen: boolean;
  equity: EquityState;
  boardCardsUsedInWinningHand: Set<number>;
  winningHandRank: HandRank | null;
}

interface EquityCalculatorActions {
  isCardUsed: (card: Card) => boolean;
  getAllUsedCards: () => Card[];
  setCard: (card: Card) => boolean;
  clearCard: (scope: Scope) => void;
  applyCardToScope: (scope: Scope, card: Card) => boolean;
  setScope: (scope: Scope) => void;
  addPlayer: (playerIndex: number) => void;
  removePlayer: (playerIndex: number) => void;
  isPlayerActive: (playerIndex: number) => boolean;
  getPlayerCards: (playerIndex: number) => [Card | null, Card | null];
  openPicker: () => void;
  closePicker: () => void;
  resetAll: () => void;
  loadScenario: (scenario: StudyScenario) => void;
  checkAndCalculateEquity: () => Promise<void>;
  getPlayerEquity: (playerIndex: number) => number | null;
  getPlayerTieEquity: (playerIndex: number) => number | null;
  isBoardComplete: () => boolean;
  isPlayerWinner: (playerIndex: number) => boolean;
  getWinningPlayers: () => number[];
  getWinningHandName: () => string | null;
  dispose: () => void;
}

function createInitialPlayers(): Array<[Card | null, Card | null]> {
  return Array.from(
    { length: NUM_PLAYERS },
    () => [null, null] as [Card | null, Card | null],
  );
}

const INITIAL_EQUITY: EquityState = {
  status: "idle",
  data: null,
  error: null,
  playerEquity: new Map(),
  playerTieEquity: new Map(),
};

let currentAbortController: AbortController | null = null;

export const useEquityCalculatorStore = create<
  EquityCalculatorState & EquityCalculatorActions
>()(
  subscribeWithSelector((set, get) => ({
    players: createInitialPlayers(),
    activePlayers: new Set([0, 1]),
    board: [null, null, null, null, null],
    scope: { kind: "player", playerIndex: 0, cardIndex: 0 },
    pickerOpen: false,
    equity: { ...INITIAL_EQUITY },
    boardCardsUsedInWinningHand: new Set(),
    winningHandRank: null,

    isCardUsed: (card) => {
      const { players, board } = get();
      for (const player of players) {
        if (
          (player[0] &&
            player[0].rank === card.rank &&
            player[0].suit === card.suit) ||
          (player[1] &&
            player[1].rank === card.rank &&
            player[1].suit === card.suit)
        ) {
          return true;
        }
      }
      for (const boardCard of board) {
        if (
          boardCard &&
          boardCard.rank === card.rank &&
          boardCard.suit === card.suit
        ) {
          return true;
        }
      }
      return false;
    },

    getAllUsedCards: () => {
      const { players, board } = get();
      const used: Card[] = [];
      for (const player of players) {
        if (player[0]) used.push(player[0]);
        if (player[1]) used.push(player[1]);
      }
      for (const boardCard of board) {
        if (boardCard) used.push(boardCard);
      }
      return used;
    },

    applyCardToScope: (scope, card) => {
      if (get().isCardUsed(card)) return false;

      if (scope.kind === "player") {
        set((s) => {
          const newPlayers = s.players.map(
            (p) => [...p] as [Card | null, Card | null],
          );
          newPlayers[scope.playerIndex][scope.cardIndex] = card;
          return { players: newPlayers };
        });
      } else {
        set((s) => {
          const newBoard = [...s.board] as [
            Card | null,
            Card | null,
            Card | null,
            Card | null,
            Card | null,
          ];
          newBoard[scope.boardIndex] = card;
          return { board: newBoard };
        });
      }
      return true;
    },

    setCard: (card) => {
      const state = get();
      if (!state.applyCardToScope(state.scope, card)) return false;

      // Auto-advance
      const next = nextScope(state.scope, {
        numPlayers: NUM_PLAYERS,
        activePlayers: get().activePlayers,
        players: get().players,
        board: get().board,
      });
      set({ scope: next });
      return true;
    },

    clearCard: (scope) => {
      if (scope.kind === "player") {
        set((s) => {
          const newPlayers = s.players.map(
            (p) => [...p] as [Card | null, Card | null],
          );
          newPlayers[scope.playerIndex][scope.cardIndex] = null;
          return { players: newPlayers };
        });
      } else {
        // Clear board from this index onwards (cascading)
        set((s) => {
          const newBoard = [...s.board] as [
            Card | null,
            Card | null,
            Card | null,
            Card | null,
            Card | null,
          ];
          for (let i = scope.boardIndex; i < 5; i++) {
            newBoard[i] = null;
          }
          return { board: newBoard };
        });
      }
    },

    setScope: (scope) => set({ scope }),

    addPlayer: (playerIndex) => {
      if (playerIndex >= 0 && playerIndex < NUM_PLAYERS) {
        set((s) => ({
          activePlayers: new Set([...s.activePlayers, playerIndex]),
        }));
      }
    },

    removePlayer: (playerIndex) => {
      set((s) => {
        const next = new Set(s.activePlayers);
        next.delete(playerIndex);
        // Clear that player's cards
        const newPlayers = s.players.map(
          (p) => [...p] as [Card | null, Card | null],
        );
        newPlayers[playerIndex] = [null, null];
        return { activePlayers: next, players: newPlayers };
      });
    },

    isPlayerActive: (playerIndex) => get().activePlayers.has(playerIndex),

    getPlayerCards: (playerIndex) => get().players[playerIndex] || [null, null],

    openPicker: () => set({ pickerOpen: true }),
    closePicker: () => set({ pickerOpen: false }),

    loadScenario: (input) => {
      const scenario = parseScenario(input);
      get().resetAll();
      const players = createInitialPlayers();
      for (const player of scenario.players)
        players[player.seat] = player.cards;
      set({
        players,
        activePlayers: new Set(scenario.players.map((p) => p.seat)),
        board: scenario.board,
      });
    },

    resetAll: () => {
      if (currentAbortController) {
        currentAbortController.abort();
        currentAbortController = null;
      }
      set({
        players: createInitialPlayers(),
        activePlayers: new Set([0, 1]),
        board: [null, null, null, null, null],
        scope: { kind: "player", playerIndex: 0, cardIndex: 0 },
        pickerOpen: false,
        equity: { ...INITIAL_EQUITY },
        boardCardsUsedInWinningHand: new Set(),
        winningHandRank: null,
      });
    },

    checkAndCalculateEquity: async () => {
      // Invalidate the previous request before validating the new cards.
      if (currentAbortController) currentAbortController.abort();
      currentAbortController = null;
      const state = get();
      set({ boardCardsUsedInWinningHand: new Set(), winningHandRank: null });

      // Only calculate for valid board states (0, 3, 4, or 5 cards)
      const boardCards = state.board.filter(
        (card): card is Card => card !== null,
      );
      const count = boardCards.length;
      const isValidBoardState =
        (count === 0 || count === 3 || count === 4 || count === 5) &&
        state.board.slice(0, count).every(Boolean);

      if (!isValidBoardState) {
        set({
          equity: { ...INITIAL_EQUITY },
          boardCardsUsedInWinningHand: new Set(),
          winningHandRank: null,
        });
        return;
      }

      // Get active players with complete hands
      const playersWithHands: Array<{
        playerIndex: number;
        cards: [Card, Card];
      }> = [];
      for (const playerIndex of state.activePlayers) {
        const player = state.players[playerIndex];
        if (player && player[0] && player[1]) {
          playersWithHands.push({
            playerIndex,
            cards: [player[0], player[1]],
          });
        }
      }

      if (
        playersWithHands.length < 2 ||
        playersWithHands.length !== state.activePlayers.size
      ) {
        set({
          equity: { ...INITIAL_EQUITY },
          boardCardsUsedInWinningHand: new Set(),
          winningHandRank: null,
        });
        return;
      }

      const abortController = new AbortController();
      currentAbortController = abortController;

      set({
        equity: {
          status: "loading",
          data: null,
          error: null,
          playerEquity: new Map(),
          playerTieEquity: new Map(),
        },
      });

      try {
        const playersStrings = playersWithHands.map((p) =>
          holeToString({ cards: p.cards }),
        );
        const boardString = boardToString({ cards: boardCards });

        const result = await pokerService.getHandEquity(
          playersStrings,
          boardString,
          { mode: "rust" },
          [],
          abortController.signal,
        );

        if (abortController.signal.aborted) return;

        const playerEquityMap = new Map<number, number>();
        const playerTieEquityMap = new Map<number, number>();
        playersWithHands.forEach((player, index) => {
          playerEquityMap.set(
            player.playerIndex,
            result.equity.win[index] || 0,
          );
          playerTieEquityMap.set(
            player.playerIndex,
            result.equity.tie[index] || 0,
          );
        });

        set({
          equity: {
            status: "success",
            data: {
              win: result.equity.win,
              tie: result.equity.tie,
              samples: result.equity.samples,
            },
            error: null,
            playerEquity: playerEquityMap,
            playerTieEquity: playerTieEquityMap,
          },
        });

        // Update board cards used in winning hand if board is complete
        if (count === 5) {
          const winningPlayers = get().getWinningPlayers();
          if (winningPlayers.length > 0) {
            const winningPlayerIndex = winningPlayers[0];
            const player = get().players[winningPlayerIndex];
            if (player?.[0] && player?.[1]) {
              try {
                const holeString = holeToString({
                  cards: [player[0], player[1]],
                });
                const evaluateResult = await pokerService.evaluateHand(
                  holeString,
                  boardString,
                );
                if (abortController.signal.aborted) return;
                const bestHandRank = evaluateResult.handRank;
                const all7Cards: Card[] = [player[0], player[1], ...boardCards];
                const best5Cards = findBest5CardHand(all7Cards, bestHandRank);

                const boardIndicesUsed = new Set<number>();
                for (let i = 0; i < boardCards.length; i++) {
                  if (
                    best5Cards.some((card) => cardsEqual(card, boardCards[i]))
                  ) {
                    boardIndicesUsed.add(i);
                  }
                }

                set({
                  boardCardsUsedInWinningHand: boardIndicesUsed,
                  winningHandRank: bestHandRank,
                });
              } catch {
                if (abortController.signal.aborted) return;
                set({
                  boardCardsUsedInWinningHand: new Set(),
                  winningHandRank: null,
                });
              }
            }
          } else {
            set({
              boardCardsUsedInWinningHand: new Set(),
              winningHandRank: null,
            });
          }
        } else {
          set({
            boardCardsUsedInWinningHand: new Set(),
            winningHandRank: null,
          });
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        if (!abortController.signal.aborted) {
          set({
            equity: {
              status: "error",
              data: null,
              error:
                err instanceof Error
                  ? err.message
                  : "Failed to calculate equity",
              playerEquity: new Map(),
              playerTieEquity: new Map(),
            },
          });
        }
      } finally {
        if (currentAbortController === abortController) {
          currentAbortController = null;
        }
      }
    },

    getPlayerEquity: (playerIndex) => {
      const winPct = get().equity.playerEquity.get(playerIndex);
      if (winPct === undefined) return null;
      return winPct * 100;
    },

    getPlayerTieEquity: (playerIndex) => {
      const tiePct = get().equity.playerTieEquity.get(playerIndex);
      if (tiePct === undefined) return null;
      return tiePct * 100;
    },

    isBoardComplete: () => {
      return get().board.filter((card) => card !== null).length === 5;
    },

    isPlayerWinner: (playerIndex) => {
      const { equity } = get();
      if (!get().isBoardComplete() || equity.status !== "success") return false;
      return (
        (equity.playerEquity.get(playerIndex) ?? 0) === 1 ||
        (equity.playerTieEquity.get(playerIndex) ?? 0) > 0
      );
    },

    getWinningPlayers: () => {
      if (!get().isBoardComplete()) return [];
      const winners: number[] = [];
      for (const playerIndex of get().activePlayers) {
        if (get().isPlayerWinner(playerIndex)) {
          winners.push(playerIndex);
        }
      }
      return winners;
    },

    getWinningHandName: () => {
      const { winningHandRank } = get();
      if (!winningHandRank) return null;
      return formatHandRank(winningHandRank);
    },

    dispose: () => {
      if (equityDebounceTimer) clearTimeout(equityDebounceTimer);
      equityDebounceTimer = null;
      if (currentAbortController) {
        currentAbortController.abort();
        currentAbortController = null;
      }
    },
  })),
);

// Auto-equity calculation: subscribe to state changes and recalculate
const EQUITY_DEBOUNCE_MS = 300;
let equityDebounceTimer: ReturnType<typeof setTimeout> | null = null;

function getEquityKey(state: EquityCalculatorState): string {
  const playerKeys = Array.from(state.activePlayers)
    .map((idx) => {
      const p = state.players[idx];
      return `${idx}:${p.map((c) => (c ? `${c.rank}${c.suit}` : "null")).join("-")}`;
    })
    .filter((k) => k !== null)
    .join("|");

  const boardKey = state.board
    .map((c) => (c ? `${c.rank}${c.suit}` : "null"))
    .join(",");

  return `${playerKeys}|${boardKey}`;
}

useEquityCalculatorStore.subscribe(
  (state) => getEquityKey(state),
  () => {
    if (equityDebounceTimer) clearTimeout(equityDebounceTimer);
    if (currentAbortController) currentAbortController.abort();
    currentAbortController = null;
    useEquityCalculatorStore.setState({
      equity: { ...INITIAL_EQUITY },
      boardCardsUsedInWinningHand: new Set(),
      winningHandRank: null,
    });
    equityDebounceTimer = setTimeout(() => {
      useEquityCalculatorStore.getState().checkAndCalculateEquity();
    }, EQUITY_DEBOUNCE_MS);
  },
);
