import { action, comparer, makeObservable, observable, reaction } from "mobx";
import {
    ActionTag,
    ActionType,
    Card,
    HandSaveRequest,
    Street,
} from "@common/interfaces";
import { del, get, set } from "idb-keyval";
import { handService } from "../../services";

const DRAFT_KEY = "hand-recorder-draft-v1";
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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

const createDefaultGameSettings = (): GameSettings => ({
    ...defaultGameSettings,
    board: [null, null, null, null, null],
});

const createEmptyPlayer = (seatIndex: number): HandRecorderPlayer => ({
    seatIndex,
    displayName: "",
    stackAtStart: 0,
    isHero: false,
    isActive: false,
    showdownCards: [null, null],
});

export class HandRecorderStore {
    @observable
    gameSettings: GameSettings = createDefaultGameSettings();

    @observable
    players: HandRecorderPlayer[] = [];

    @observable
    actions: HandRecorderAction[] = [];

    @observable
    currentStreet: Street = "preflop";

    @observable
    isDraft = false;

    @observable
    validationErrors: Record<string, string[]> = {};

    private isHydrating = false;
    private draftDisposer: (() => void) | null = null;

    constructor() {
        makeObservable(this);
        this.setupDraftReaction();
        void this.loadDraft();
        this.ensurePlayersForTableSize(this.gameSettings.tableSize);
    }

    private setupDraftReaction() {
        this.draftDisposer = reaction(
            () => this.getDraftSnapshot(),
            (snapshot) => {
                void this.saveDraft(snapshot);
            },
            { equals: comparer.structural, fireImmediately: false }
        );
    }

    @action
    updateGameSettings(updates: Partial<GameSettings>) {
        this.gameSettings = {
            ...this.gameSettings,
            ...updates,
        };
    }

    @action
    setSmallBlind(amount: number) {
        this.updateGameSettings({ smallBlind: amount });
    }

    @action
    setBigBlind(amount: number) {
        this.updateGameSettings({ bigBlind: amount });
    }

    @action
    setAnte(amount: number) {
        this.updateGameSettings({ ante: amount });
    }

    @action
    setButtonSeat(seatIndex: number) {
        this.updateGameSettings({ buttonSeat: seatIndex });
    }

    @action
    setTableSize(tableSize: number) {
        const nextSize = Math.min(9, Math.max(2, tableSize));
        const nextButtonSeat =
            this.gameSettings.buttonSeat >= nextSize
                ? 0
                : this.gameSettings.buttonSeat;
        this.gameSettings = {
            ...this.gameSettings,
            tableSize: nextSize,
            buttonSeat: nextButtonSeat,
        };
        this.ensurePlayersForTableSize(nextSize);
    }

    @action
    updatePlayer(seatIndex: number, updates: Partial<HandRecorderPlayer>) {
        const players = [...this.players];
        const playerIndex = players.findIndex(
            (player) => player.seatIndex === seatIndex
        );
        if (playerIndex === -1) {
            players.push({ ...createEmptyPlayer(seatIndex), ...updates });
        } else {
            players[playerIndex] = { ...players[playerIndex], ...updates };
        }
        this.players = players.sort((a, b) => a.seatIndex - b.seatIndex);
    }

    @action
    setPlayerActive(seatIndex: number, isActive: boolean) {
        const players = [...this.players];
        const playerIndex = players.findIndex(
            (player) => player.seatIndex === seatIndex
        );
        const nextPlayer =
            playerIndex === -1
                ? { ...createEmptyPlayer(seatIndex), isActive }
                : { ...players[playerIndex], isActive };

        if (!isActive) {
            nextPlayer.isHero = false;
            nextPlayer.showdownCards = [null, null];
        }

        if (playerIndex === -1) {
            players.push(nextPlayer);
        } else {
            players[playerIndex] = nextPlayer;
        }

        const hasHero = players.some((player) => player.isHero);
        if (isActive && !hasHero) {
            players.forEach((player) => {
                player.isHero = player.seatIndex === seatIndex;
            });
        }

        if (!isActive && !players.some((player) => player.isHero)) {
            const nextHero = players.find((player) => player.isActive);
            if (nextHero) {
                players.forEach((player) => {
                    player.isHero = player.seatIndex === nextHero.seatIndex;
                });
            }
        }

        this.players = players.sort((a, b) => a.seatIndex - b.seatIndex);
    }

    @action
    addPlayer(seatIndex: number) {
        this.setPlayerActive(seatIndex, true);
    }

    @action
    removePlayer(seatIndex: number) {
        this.setPlayerActive(seatIndex, false);
    }

    @action
    setHero(seatIndex: number) {
        const players = this.players.map((player) => ({
            ...player,
            isHero: player.seatIndex === seatIndex && player.isActive,
        }));
        this.players = players;
    }

    @action
    setPlayerHoleCard(seatIndex: number, cardIndex: 0 | 1, card: Card | null) {
        const players = [...this.players];
        const playerIndex = players.findIndex(
            (player) => player.seatIndex === seatIndex
        );
        if (playerIndex === -1) {
            return;
        }
        const player = players[playerIndex];
        const showdownCards: [Card | null, Card | null] = [
            ...player.showdownCards,
        ];
        showdownCards[cardIndex] = card;
        players[playerIndex] = { ...player, showdownCards };
        this.players = players;
    }

    @action
    addAction(action: HandRecorderAction) {
        this.actions = [...this.actions, action];
    }

    @action
    updateAction(index: number, updates: Partial<HandRecorderAction>) {
        if (index < 0 || index >= this.actions.length) {
            return;
        }
        const nextActions = [...this.actions];
        nextActions[index] = { ...nextActions[index], ...updates };
        this.actions = nextActions;
    }

    @action
    removeAction(index: number) {
        if (index < 0 || index >= this.actions.length) {
            return;
        }
        this.actions = this.actions.filter((_, idx) => idx !== index);
    }

    @action
    setBoardCard(index: number, card: Card | null) {
        if (index < 0 || index >= this.gameSettings.board.length) {
            return;
        }
        const board: BoardCards = [...this.gameSettings.board];
        board[index] = card;
        this.gameSettings = { ...this.gameSettings, board };
    }

    isCardUsed(card: Card): boolean {
        for (const boardCard of this.gameSettings.board) {
            if (
                boardCard &&
                boardCard.rank === card.rank &&
                boardCard.suit === card.suit
            ) {
                return true;
            }
        }
        for (const player of this.players) {
            const [cardOne, cardTwo] = player.showdownCards;
            if (
                (cardOne &&
                    cardOne.rank === card.rank &&
                    cardOne.suit === card.suit) ||
                (cardTwo &&
                    cardTwo.rank === card.rank &&
                    cardTwo.suit === card.suit)
            ) {
                return true;
            }
        }
        return false;
    }

    @action
    setStreet(street: Street) {
        this.currentStreet = street;
    }

    @action
    clearValidationErrors() {
        this.validationErrors = {};
    }

    private getDraftSnapshot(): HandRecorderDraft {
        return {
            gameSettings: this.gameSettings,
            players: this.players,
            actions: this.actions,
            currentStreet: this.currentStreet,
        };
    }

    private hasDraftData(snapshot: HandRecorderDraft): boolean {
        const boardHasCards = snapshot.gameSettings.board.some(
            (card) => card !== null
        );
        const hasSettingsChange =
            snapshot.gameSettings.tableSize !== defaultGameSettings.tableSize ||
            snapshot.gameSettings.buttonSeat !==
                defaultGameSettings.buttonSeat ||
            snapshot.gameSettings.smallBlind !==
                defaultGameSettings.smallBlind ||
            snapshot.gameSettings.bigBlind !== defaultGameSettings.bigBlind ||
            snapshot.gameSettings.ante !== defaultGameSettings.ante ||
            boardHasCards;

        return (
            snapshot.players.length > 0 ||
            snapshot.actions.length > 0 ||
            hasSettingsChange
        );
    }

    @action
    private applyDraft(snapshot: HandRecorderDraft) {
        this.gameSettings = {
            ...snapshot.gameSettings,
            board: [...snapshot.gameSettings.board],
        };
        this.players = [...snapshot.players];
        this.actions = [...snapshot.actions];
        this.currentStreet = snapshot.currentStreet;
        this.isDraft = true;
        this.ensurePlayersForTableSize(this.gameSettings.tableSize);
    }

    async loadDraft() {
        this.isHydrating = true;
        try {
            const envelope = (await get(DRAFT_KEY)) as
                | DraftEnvelope
                | undefined;
            if (!envelope || !envelope.draft || !envelope.savedAt) {
                return;
            }

            const isExpired = Date.now() - envelope.savedAt > DRAFT_TTL_MS;
            if (isExpired) {
                await del(DRAFT_KEY);
                this.logEvent("hand_recorder.draft.purge");
                return;
            }

            this.applyDraft(envelope.draft);
            this.logEvent("hand_recorder.draft.load");
        } finally {
            this.isHydrating = false;
        }
    }

    async saveDraft(snapshot: HandRecorderDraft) {
        if (this.isHydrating) {
            return;
        }

        if (!this.hasDraftData(snapshot)) {
            await this.clearDraftStorage();
            return;
        }

        const envelope: DraftEnvelope = {
            savedAt: Date.now(),
            draft: JSON.parse(JSON.stringify(snapshot)),
        };
        await set(DRAFT_KEY, envelope);
        this.isDraft = true;
    }

    async clearDraftStorage() {
        await del(DRAFT_KEY);
        this.isDraft = false;
    }

    private validateGameSetup(): Record<string, string[]> {
        const errors: Record<string, string[]> = {};
        const { tableSize, buttonSeat, smallBlind, bigBlind, ante } =
            this.gameSettings;

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

        const activePlayers = this.players.filter((player) => player.isActive);
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

    private validate(): Record<string, string[]> {
        const errors = this.validateGameSetup();
        if (this.actions.length === 0) {
            errors.actions = ["at least one action is required"];
        }
        return errors;
    }

    @action
    validateSetup(): boolean {
        const errors = this.validateGameSetup();
        this.validationErrors = errors;
        return Object.keys(errors).length === 0;
    }

    @action
    private ensurePlayersForTableSize(tableSize: number) {
        const playersBySeat = new Map(
            this.players.map((player) => [player.seatIndex, player])
        );
        this.players = Array.from({ length: tableSize }, (_, index) => {
            const existing = playersBySeat.get(index);
            if (!existing) {
                return createEmptyPlayer(index);
            }
            return {
                ...existing,
                showdownCards: [...existing.showdownCards],
            };
        });
    }

    private toCardString(card: Card | null): string | null {
        if (!card) {
            return null;
        }
        return `${card.rank}${card.suit}`;
    }

    private toHandSaveRequest(): HandSaveRequest {
        const board = this.gameSettings.board;

        return {
            hand: {
                table_size: this.gameSettings.tableSize,
                button_seat: this.gameSettings.buttonSeat,
                small_blind: this.gameSettings.smallBlind,
                big_blind: this.gameSettings.bigBlind,
                ante: this.gameSettings.ante,
                board_flop_1: this.toCardString(board[0]),
                board_flop_2: this.toCardString(board[1]),
                board_flop_3: this.toCardString(board[2]),
                board_turn: this.toCardString(board[3]),
                board_river: this.toCardString(board[4]),
            },
            players: this.players
                .filter((player) => player.isActive)
                .map((player) => ({
                    seat_index: player.seatIndex,
                    display_name:
                        player.displayName.trim() ||
                        `Player ${player.seatIndex + 1}`,
                    stack_at_start: player.stackAtStart,
                    is_hero: player.isHero,
                    showdown_card_1: this.toCardString(player.showdownCards[0]),
                    showdown_card_2: this.toCardString(player.showdownCards[1]),
                })),
            actions: this.actions.map((action, index) => ({
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
    }

    @action
    async submitHand(): Promise<string | null> {
        const errors = this.validate();
        if (Object.keys(errors).length > 0) {
            this.validationErrors = errors;
            this.logEvent("hand_recorder.submit.invalid");
            return null;
        }

        this.validationErrors = {};

        const response = await handService.createHand(this.toHandSaveRequest());
        await this.clearDraftStorage();
        this.logEvent("hand_recorder.submit.success");
        return response.hand_id;
    }

    @action
    async saveHand(): Promise<string | null> {
        return this.submitHand();
    }

    private logEvent(event: string) {
        console.info(`[HandRecorderStore] ${event}`);
    }

    dispose() {
        if (this.draftDisposer) {
            this.draftDisposer();
            this.draftDisposer = null;
        }
    }
}
