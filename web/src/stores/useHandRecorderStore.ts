import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type {
  ActionTag,
  ActionType,
  Card,
  HandSaveRequest,
  Street,
} from "@common/interfaces";
import { del, get as idbGet, set as idbSet } from "idb-keyval";
import { handService } from "@/services";

const DRAFT_KEY = "hand-recorder-draft-v1";
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DRAFT_DEBOUNCE_MS = 500;

type BoardCards = [
  Card | null,
  Card | null,
  Card | null,
  Card | null,
  Card | null,
];

export interface GameSettings {
  tableSize: number;
  buttonSeat: number;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  board: BoardCards;
}

export interface HandRecorderPlayer {
  seatIndex: number;
  displayName: string;
  stackAtStart: number;
  isHero: boolean;
  isActive: boolean;
  showdownCards: [Card | null, Card | null];
}

export interface HandRecorderAction {
  street: Street;
  actionType: ActionType;
  actorSeat: number | null;
  amount: number | null;
  raiseTo: number | null;
  decisionMs: number | null;
  tags: ActionTag[];
}

interface HandRecorderDraft {
  gameSettings: GameSettings;
  players: HandRecorderPlayer[];
  actions: HandRecorderAction[];
  currentStreet: Street;
}

interface DraftEnvelope {
  savedAt: number;
  draft: HandRecorderDraft;
}

const defaultGameSettings: GameSettings = {
  tableSize: 6,
  buttonSeat: 0,
  smallBlind: 50,
  bigBlind: 100,
  ante: 0,
  board: [null, null, null, null, null],
};

function createDefaultGameSettings(): GameSettings {
  return { ...defaultGameSettings, board: [null, null, null, null, null] };
}

function createEmptyPlayer(seatIndex: number): HandRecorderPlayer {
  return {
    seatIndex,
    displayName: "",
    stackAtStart: 0,
    isHero: false,
    isActive: false,
    showdownCards: [null, null],
  };
}

function ensurePlayersForTableSize(
  players: HandRecorderPlayer[],
  tableSize: number,
): HandRecorderPlayer[] {
  const playersBySeat = new Map(
    players.map((player) => [player.seatIndex, player]),
  );
  return Array.from({ length: tableSize }, (_, index) => {
    const existing = playersBySeat.get(index);
    if (!existing) return createEmptyPlayer(index);
    return { ...existing, showdownCards: [...existing.showdownCards] as [Card | null, Card | null] };
  });
}

function hasDraftData(snapshot: HandRecorderDraft): boolean {
  const boardHasCards = snapshot.gameSettings.board.some(
    (card) => card !== null,
  );
  const hasSettingsChange =
    snapshot.gameSettings.tableSize !== defaultGameSettings.tableSize ||
    snapshot.gameSettings.buttonSeat !== defaultGameSettings.buttonSeat ||
    snapshot.gameSettings.smallBlind !== defaultGameSettings.smallBlind ||
    snapshot.gameSettings.bigBlind !== defaultGameSettings.bigBlind ||
    snapshot.gameSettings.ante !== defaultGameSettings.ante ||
    boardHasCards;

  return (
    snapshot.players.some((p) => p.isActive) ||
    snapshot.actions.length > 0 ||
    hasSettingsChange
  );
}

function toCardString(card: Card | null): string | null {
  if (!card) return null;
  return `${card.rank}${card.suit}`;
}

function validateGameSetup(
  gameSettings: GameSettings,
  players: HandRecorderPlayer[],
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  const { tableSize, buttonSeat, smallBlind, bigBlind, ante } = gameSettings;

  if (tableSize < 2 || tableSize > 9) {
    errors["hand.table_size"] = ["must be between 2 and 9"];
  }
  if (buttonSeat < 0 || buttonSeat >= tableSize) {
    errors["hand.button_seat"] = ["must be within table size"];
  }
  if (smallBlind <= 0) {
    errors["hand.small_blind"] = ["must be greater than 0"];
  }
  if (bigBlind <= 0) {
    errors["hand.big_blind"] = ["must be greater than 0"];
  }
  if (bigBlind <= smallBlind) {
    errors["hand.big_blind"] = [
      ...(errors["hand.big_blind"] || []),
      "must be greater than small blind",
    ];
  }
  if (ante < 0) {
    errors["hand.ante"] = ["must be 0 or greater"];
  }

  const activePlayers = players.filter((player) => player.isActive);
  if (activePlayers.length < 2) {
    errors.players = ["at least two players are required"];
  } else {
    const seatIndices = new Set<number>();
    for (const player of activePlayers) {
      if (seatIndices.has(player.seatIndex)) {
        errors.players = [
          ...(errors.players || []),
          `duplicate seat ${player.seatIndex + 1}`,
        ];
      }
      seatIndices.add(player.seatIndex);
      if (!player.displayName.trim()) {
        errors.players = [
          ...(errors.players || []),
          `seat ${player.seatIndex + 1} must have a name`,
        ];
      }
      if (player.stackAtStart <= 0) {
        errors.players = [
          ...(errors.players || []),
          `seat ${player.seatIndex + 1} must have positive stack`,
        ];
      }
    }
  }

  return errors;
}

interface HandRecorderState {
  gameSettings: GameSettings;
  players: HandRecorderPlayer[];
  actions: HandRecorderAction[];
  currentStreet: Street;
  isDraft: boolean;
  validationErrors: Record<string, string[]>;
  _isHydrating: boolean;
}

interface HandRecorderActions {
  updateGameSettings: (updates: Partial<GameSettings>) => void;
  setSmallBlind: (amount: number) => void;
  setBigBlind: (amount: number) => void;
  setAnte: (amount: number) => void;
  setButtonSeat: (seatIndex: number) => void;
  setTableSize: (tableSize: number) => void;
  updatePlayer: (
    seatIndex: number,
    updates: Partial<HandRecorderPlayer>,
  ) => void;
  setPlayerActive: (seatIndex: number, isActive: boolean) => void;
  addPlayer: (seatIndex: number) => void;
  removePlayer: (seatIndex: number) => void;
  setHero: (seatIndex: number) => void;
  setPlayerHoleCard: (
    seatIndex: number,
    cardIndex: 0 | 1,
    card: Card | null,
  ) => void;
  addAction: (action: HandRecorderAction) => void;
  updateAction: (
    index: number,
    updates: Partial<HandRecorderAction>,
  ) => void;
  removeAction: (index: number) => void;
  setBoardCard: (index: number, card: Card | null) => void;
  isCardUsed: (card: Card) => boolean;
  setStreet: (street: Street) => void;
  autoPostBlinds: () => void;
  clearValidationErrors: () => void;
  validateSetup: () => boolean;
  submitHand: () => Promise<string | null>;
  loadDraft: () => Promise<void>;
  clearDraftStorage: () => Promise<void>;
  resetAll: () => void;
}

export const useHandRecorderStore = create<
  HandRecorderState & HandRecorderActions
>()(
  subscribeWithSelector((set, get) => {
    let draftDebounceTimer: ReturnType<typeof setTimeout> | null = null;

    const saveDraftToIdb = async (snapshot: HandRecorderDraft) => {
      if (get()._isHydrating) return;

      if (!hasDraftData(snapshot)) {
        await del(DRAFT_KEY);
        set({ isDraft: false });
        return;
      }

      const envelope: DraftEnvelope = {
        savedAt: Date.now(),
        draft: JSON.parse(JSON.stringify(snapshot)),
      };
      await idbSet(DRAFT_KEY, envelope);
      set({ isDraft: true });
    };

    const scheduleDraftSave = () => {
      if (draftDebounceTimer) clearTimeout(draftDebounceTimer);
      draftDebounceTimer = setTimeout(() => {
        const { gameSettings, players, actions, currentStreet } = get();
        saveDraftToIdb({ gameSettings, players, actions, currentStreet });
      }, DRAFT_DEBOUNCE_MS);
    };

    return {
      gameSettings: createDefaultGameSettings(),
      players: ensurePlayersForTableSize([], 6),
      actions: [],
      currentStreet: "preflop",
      isDraft: false,
      validationErrors: {},
      _isHydrating: false,

      updateGameSettings: (updates) => {
        set((s) => ({
          gameSettings: { ...s.gameSettings, ...updates },
        }));
        scheduleDraftSave();
      },

      setSmallBlind: (amount) => get().updateGameSettings({ smallBlind: amount }),
      setBigBlind: (amount) => get().updateGameSettings({ bigBlind: amount }),
      setAnte: (amount) => get().updateGameSettings({ ante: amount }),
      setButtonSeat: (seatIndex) =>
        get().updateGameSettings({ buttonSeat: seatIndex }),

      setTableSize: (tableSize) => {
        const nextSize = Math.min(9, Math.max(2, tableSize));
        set((s) => {
          const nextButtonSeat =
            s.gameSettings.buttonSeat >= nextSize
              ? 0
              : s.gameSettings.buttonSeat;
          return {
            gameSettings: {
              ...s.gameSettings,
              tableSize: nextSize,
              buttonSeat: nextButtonSeat,
            },
            players: ensurePlayersForTableSize(s.players, nextSize),
          };
        });
        scheduleDraftSave();
      },

      updatePlayer: (seatIndex, updates) => {
        set((s) => {
          const players = [...s.players];
          const idx = players.findIndex((p) => p.seatIndex === seatIndex);
          if (idx === -1) {
            players.push({ ...createEmptyPlayer(seatIndex), ...updates });
          } else {
            players[idx] = { ...players[idx], ...updates };
          }
          return { players: players.sort((a, b) => a.seatIndex - b.seatIndex) };
        });
        scheduleDraftSave();
      },

      setPlayerActive: (seatIndex, isActive) => {
        set((s) => {
          const players = [...s.players];
          const idx = players.findIndex((p) => p.seatIndex === seatIndex);
          const nextPlayer =
            idx === -1
              ? { ...createEmptyPlayer(seatIndex), isActive }
              : { ...players[idx], isActive };

          if (!isActive) {
            nextPlayer.isHero = false;
            nextPlayer.showdownCards = [null, null];
          }

          if (idx === -1) {
            players.push(nextPlayer);
          } else {
            players[idx] = nextPlayer;
          }

          const hasHero = players.some((p) => p.isHero);
          if (isActive && !hasHero) {
            players.forEach((p) => {
              p.isHero = p.seatIndex === seatIndex;
            });
          }
          if (!isActive && !players.some((p) => p.isHero)) {
            const nextHero = players.find((p) => p.isActive);
            if (nextHero) {
              players.forEach((p) => {
                p.isHero = p.seatIndex === nextHero.seatIndex;
              });
            }
          }

          return { players: players.sort((a, b) => a.seatIndex - b.seatIndex) };
        });
        scheduleDraftSave();
      },

      addPlayer: (seatIndex) => get().setPlayerActive(seatIndex, true),
      removePlayer: (seatIndex) => get().setPlayerActive(seatIndex, false),

      setHero: (seatIndex) => {
        set((s) => ({
          players: s.players.map((p) => ({
            ...p,
            isHero: p.seatIndex === seatIndex && p.isActive,
          })),
        }));
        scheduleDraftSave();
      },

      setPlayerHoleCard: (seatIndex, cardIndex, card) => {
        set((s) => {
          const players = [...s.players];
          const idx = players.findIndex((p) => p.seatIndex === seatIndex);
          if (idx === -1) return s;
          const player = players[idx];
          const showdownCards: [Card | null, Card | null] = [
            ...player.showdownCards,
          ];
          showdownCards[cardIndex] = card;
          players[idx] = { ...player, showdownCards };
          return { players };
        });
        scheduleDraftSave();
      },

      addAction: (action) => {
        set((s) => ({ actions: [...s.actions, action] }));
        scheduleDraftSave();
      },

      updateAction: (index, updates) => {
        set((s) => {
          if (index < 0 || index >= s.actions.length) return s;
          const nextActions = [...s.actions];
          nextActions[index] = { ...nextActions[index], ...updates };
          return { actions: nextActions };
        });
        scheduleDraftSave();
      },

      removeAction: (index) => {
        set((s) => {
          if (index < 0 || index >= s.actions.length) return s;
          return { actions: s.actions.filter((_, idx) => idx !== index) };
        });
        scheduleDraftSave();
      },

      setBoardCard: (index, card) => {
        set((s) => {
          if (index < 0 || index >= s.gameSettings.board.length) return s;
          const board: BoardCards = [...s.gameSettings.board];
          board[index] = card;
          return { gameSettings: { ...s.gameSettings, board } };
        });
        scheduleDraftSave();
      },

      isCardUsed: (card) => {
        const { gameSettings, players } = get();
        for (const boardCard of gameSettings.board) {
          if (
            boardCard &&
            boardCard.rank === card.rank &&
            boardCard.suit === card.suit
          ) {
            return true;
          }
        }
        for (const player of players) {
          const [c1, c2] = player.showdownCards;
          if (
            (c1 && c1.rank === card.rank && c1.suit === card.suit) ||
            (c2 && c2.rank === card.rank && c2.suit === card.suit)
          ) {
            return true;
          }
        }
        return false;
      },

      setStreet: (street) => {
        set({ currentStreet: street });
        scheduleDraftSave();
      },

      autoPostBlinds: () => {
        const { gameSettings, actions, players } = get();
        const { buttonSeat, tableSize, smallBlind, bigBlind } = gameSettings;

        const hasBlinds = actions.some(
          (action) =>
            action.actionType === "POST_SB" || action.actionType === "POST_BB",
        );

        if (hasBlinds) return;

        const activePlayers = players.filter((p) => p.isActive);
        if (activePlayers.length < 2) return;

        let sbSeat: number;
        let bbSeat: number;

        if (tableSize === 2) {
          sbSeat = buttonSeat;
          bbSeat = (buttonSeat + 1) % tableSize;
        } else {
          sbSeat = (buttonSeat + 1) % tableSize;
          bbSeat = (buttonSeat + 2) % tableSize;
        }

        const sbPlayer = players.find((p) => p.seatIndex === sbSeat && p.isActive);
        const bbPlayer = players.find((p) => p.seatIndex === bbSeat && p.isActive);

        if (!sbPlayer || !bbPlayer) return;

        const newActions: HandRecorderAction[] = [
          {
            street: "preflop",
            actionType: "POST_SB",
            actorSeat: sbSeat,
            amount: smallBlind,
            raiseTo: null,
            decisionMs: null,
            tags: [],
          },
          {
            street: "preflop",
            actionType: "POST_BB",
            actorSeat: bbSeat,
            amount: bigBlind,
            raiseTo: null,
            decisionMs: null,
            tags: [],
          },
        ];

        set({ actions: newActions });
        scheduleDraftSave();
      },

      clearValidationErrors: () => set({ validationErrors: {} }),

      validateSetup: () => {
        const { gameSettings, players } = get();
        const errors = validateGameSetup(gameSettings, players);
        set({ validationErrors: errors });
        return Object.keys(errors).length === 0;
      },

      submitHand: async () => {
        const { gameSettings, players, actions } = get();
        const errors = validateGameSetup(gameSettings, players);
        if (actions.length === 0) {
          errors.actions = ["at least one action is required"];
        }
        if (Object.keys(errors).length > 0) {
          set({ validationErrors: errors });
          return null;
        }
        set({ validationErrors: {} });

        const board = gameSettings.board;
        const payload: HandSaveRequest = {
          hand: {
            table_size: gameSettings.tableSize,
            button_seat: gameSettings.buttonSeat,
            small_blind: gameSettings.smallBlind,
            big_blind: gameSettings.bigBlind,
            ante: gameSettings.ante,
            board_flop_1: toCardString(board[0]),
            board_flop_2: toCardString(board[1]),
            board_flop_3: toCardString(board[2]),
            board_turn: toCardString(board[3]),
            board_river: toCardString(board[4]),
          },
          players: players
            .filter((p) => p.isActive)
            .map((p) => ({
              seat_index: p.seatIndex,
              display_name: p.displayName.trim() || `Player ${p.seatIndex + 1}`,
              stack_at_start: p.stackAtStart,
              is_hero: p.isHero,
              showdown_card_1: toCardString(p.showdownCards[0]),
              showdown_card_2: toCardString(p.showdownCards[1]),
            })),
          actions: actions.map((action, index) => ({
            sequence_index: index,
            street: action.street,
            actor_seat: action.actorSeat ?? null,
            action_type: action.actionType,
            amount: action.amount ?? null,
            raise_to: action.raiseTo ?? null,
            decision_ms: action.decisionMs ?? null,
            tags: action.tags,
          })),
        };

        const response = await handService.createHand(payload);
        await get().clearDraftStorage();
        return response.hand_id;
      },

      loadDraft: async () => {
        set({ _isHydrating: true });
        try {
          const envelope = (await idbGet(DRAFT_KEY)) as
            | DraftEnvelope
            | undefined;
          if (!envelope || !envelope.draft || !envelope.savedAt) return;

          if (Date.now() - envelope.savedAt > DRAFT_TTL_MS) {
            await del(DRAFT_KEY);
            return;
          }

          const { draft } = envelope;
          set({
            gameSettings: {
              ...draft.gameSettings,
              board: [...draft.gameSettings.board] as BoardCards,
            },
            players: ensurePlayersForTableSize(
              draft.players,
              draft.gameSettings.tableSize,
            ),
            actions: [...draft.actions],
            currentStreet: draft.currentStreet,
            isDraft: true,
          });
        } finally {
          set({ _isHydrating: false });
        }
      },

      clearDraftStorage: async () => {
        await del(DRAFT_KEY);
        set({ isDraft: false });
      },

      resetAll: () => {
        set({
          gameSettings: createDefaultGameSettings(),
          players: ensurePlayersForTableSize([], 6),
          actions: [],
          currentStreet: "preflop",
          isDraft: false,
          validationErrors: {},
        });
        del(DRAFT_KEY);
      },
    };
  }),
);
