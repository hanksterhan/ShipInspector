import { action, makeObservable, observable, computed } from "mobx";
import { Card } from "@common/interfaces";
import {
    HandReplayClient,
    HandSaveRequest,
    handReplayClient,
} from "../../services/handReplayClient";

export type Street = "PREFLOP" | "FLOP" | "TURN" | "RIVER" | "SHOWDOWN";
export type ActionType =
    | "POST_SB"
    | "POST_BB"
    | "POST_ANTE"
    | "STRADDLE"
    | "FOLD"
    | "CHECK"
    | "CALL"
    | "BET"
    | "RAISE"
    | "ALL_IN"
    | "REVEAL"
    | "DEAL_FLOP"
    | "DEAL_TURN"
    | "DEAL_RIVER"
    | "COLLECT"
    | "NOTE";

export type PlayerStatus = "ACTIVE" | "FOLDED" | "ALL_IN" | "OUT";

export interface ActionDraft {
    id: string; // Temporary ID for UI
    action_index: number;
    street: Street;
    type: ActionType;
    actor_seat?: number;
    amount?: number;
    raise_to?: number;
    decision_ms?: number;
    payload?: Record<string, any>;
    tags: string[];
}

export interface PlayerConfig {
    seat: number;
    player_label: string;
    starting_stack: number;
    is_hero: boolean;
    hole_cards: [Card | null, Card | null];
    status: PlayerStatus;
    contributed_this_street: number; // Amount contributed in current street
}

/**
 * HandBuilderStore manages the state for building a poker hand
 */
export class HandBuilderStore {
    // Hand settings
    @observable
    small_blind: number = 25;

    @observable
    big_blind: number = 50;

    @observable
    ante: number = 0;

    @observable
    button_seat: number = 1;

    @observable
    table_size: number = 6;

    @observable
    max_players: number = 6;

    // Players
    @observable
    players: Map<number, PlayerConfig> = new Map();

    // Board cards
    @observable
    board: [Card | null, Card | null, Card | null, Card | null, Card | null] = [
        null,
        null,
        null,
        null,
        null,
    ];

    // Action timeline
    @observable
    actionDrafts: ActionDraft[] = [];

    // Current state
    @observable
    current_street: Street = "PREFLOP";

    @observable
    current_bet: number = 0; // Size-to amount for current street

    @observable
    acting_position: number = 0; // Index into active players array

    // Tray state
    @observable
    handBuilderTrayOpen: boolean = false;

    // Current action being built
    @observable
    currentActionType: ActionType | null = null;

    @observable
    currentActionAmount: number | null = null;

    @observable
    currentActionRaiseTo: number | null = null;

    @observable
    currentActionTags: string[] = [];

    // Save state
    @observable
    isSaving: boolean = false;

    @observable
    saveError: string | null = null;

    @observable
    lastSavedHandId: string | null = null;

    constructor() {
        makeObservable(this);
        this.initializeDefaultPlayers();
    }

    @action
    initializeDefaultPlayers() {
        // Initialize with 2 players by default
        this.players.set(1, {
            seat: 1,
            player_label: "Hero",
            starting_stack: 10000,
            is_hero: true,
            hole_cards: [null, null],
            status: "ACTIVE",
            contributed_this_street: 0,
        });
        this.players.set(2, {
            seat: 2,
            player_label: "Villain",
            starting_stack: 9500,
            is_hero: false,
            hole_cards: [null, null],
            status: "ACTIVE",
            contributed_this_street: 0,
        });
    }

    // Hand settings
    @action
    setSmallBlind(value: number) {
        this.small_blind = value;
    }

    @action
    setBigBlind(value: number) {
        this.big_blind = value;
    }

    @action
    setAnte(value: number) {
        this.ante = value;
    }

    @action
    setButtonSeat(seat: number) {
        this.button_seat = seat;
    }

    @action
    setTableSize(size: number) {
        this.table_size = size;
        this.max_players = size;
    }

    // Player management
    @action
    addPlayer(
        seat: number,
        label: string,
        stack: number,
        isHero: boolean = false
    ) {
        if (this.players.has(seat)) {
            throw new Error(`Player already exists at seat ${seat}`);
        }
        this.players.set(seat, {
            seat,
            player_label: label,
            starting_stack: stack,
            is_hero: isHero,
            hole_cards: [null, null],
            status: "ACTIVE",
            contributed_this_street: 0,
        });
    }

    @action
    removePlayer(seat: number) {
        this.players.delete(seat);
    }

    @action
    updatePlayerLabel(seat: number, label: string) {
        const player = this.players.get(seat);
        if (player) {
            player.player_label = label;
        }
    }

    @action
    updatePlayerStack(seat: number, stack: number) {
        const player = this.players.get(seat);
        if (player) {
            player.starting_stack = stack;
        }
    }

    @action
    setPlayerHoleCard(seat: number, cardIndex: 0 | 1, card: Card | null) {
        const player = this.players.get(seat);
        if (player) {
            player.hole_cards[cardIndex] = card;
        }
    }

    @action
    setPlayerStatus(seat: number, status: PlayerStatus) {
        const player = this.players.get(seat);
        if (player) {
            player.status = status;
        }
    }

    // Board cards
    @action
    setBoardCard(index: number, card: Card | null) {
        if (index >= 0 && index < 5) {
            this.board[index] = card;
        }
    }

    // Action management
    @computed
    get activePlayers(): PlayerConfig[] {
        return Array.from(this.players.values())
            .filter((p) => p.status !== "OUT")
            .sort((a, b) => a.seat - b.seat);
    }

    @computed
    get playersInHand(): PlayerConfig[] {
        return this.activePlayers.filter((p) => p.status !== "FOLDED");
    }

    @action
    addActionDraft(action: Omit<ActionDraft, "id" | "action_index">) {
        const action_index = this.actionDrafts.length;
        const id = `action-${Date.now()}-${Math.random()}`;
        const newAction: ActionDraft = {
            id,
            action_index,
            ...action,
        };
        this.actionDrafts.push(newAction);

        // Update player state based on action
        this.updatePlayerStateFromAction(newAction);

        return id;
    }

    @action
    private updatePlayerStateFromAction(action: ActionDraft) {
        if (action.actor_seat === undefined) {
            // System/dealer action - might advance street
            if (
                action.type === "DEAL_FLOP" ||
                action.type === "DEAL_TURN" ||
                action.type === "DEAL_RIVER"
            ) {
                this.advanceStreet();
            }
            return;
        }

        const player = this.players.get(action.actor_seat);
        if (!player) return;

        switch (action.type) {
            case "FOLD":
                player.status = "FOLDED";
                break;
            case "ALL_IN":
                player.status = "ALL_IN";
                if (action.amount) {
                    player.contributed_this_street += action.amount;
                }
                break;
            case "POST_SB":
            case "POST_BB":
            case "POST_ANTE":
            case "STRADDLE":
            case "CALL":
            case "BET":
                if (action.amount) {
                    player.contributed_this_street += action.amount;
                }
                break;
            case "RAISE":
                if (action.raise_to) {
                    player.contributed_this_street = action.raise_to;
                    if (action.tags?.includes("all_in")) {
                        player.status = "ALL_IN";
                    }
                }
                break;
        }

        // Update current_bet
        if (action.raise_to !== undefined) {
            this.current_bet = action.raise_to;
        } else if (action.type === "BET" && action.amount) {
            this.current_bet = action.amount;
        }
    }

    @action
    removeActionDraft(actionId: string) {
        const index = this.actionDrafts.findIndex((a) => a.id === actionId);
        if (index >= 0) {
            this.actionDrafts.splice(index, 1);
            // Re-index actions
            this.actionDrafts.forEach((a, i) => {
                a.action_index = i;
            });
            // TODO: Recalculate player state from remaining actions
        }
    }

    @action
    updateActionDraft(actionId: string, updates: Partial<ActionDraft>) {
        const action = this.actionDrafts.find((a) => a.id === actionId);
        if (action) {
            Object.assign(action, updates);
        }
    }

    @action
    addTagToAction(actionId: string, tag: string) {
        const action = this.actionDrafts.find((a) => a.id === actionId);
        if (action && !action.tags.includes(tag)) {
            action.tags.push(tag);
        }
    }

    @action
    removeTagFromAction(actionId: string, tag: string) {
        const action = this.actionDrafts.find((a) => a.id === actionId);
        if (action) {
            const index = action.tags.indexOf(tag);
            if (index >= 0) {
                action.tags.splice(index, 1);
            }
        }
    }

    @action
    advanceStreet() {
        const streets: Street[] = [
            "PREFLOP",
            "FLOP",
            "TURN",
            "RIVER",
            "SHOWDOWN",
        ];
        const currentIndex = streets.indexOf(this.current_street);
        if (currentIndex < streets.length - 1) {
            this.current_street = streets[currentIndex + 1];
            this.current_bet = 0;
            // Reset contributions for new street
            this.players.forEach((p) => {
                p.contributed_this_street = 0;
            });
        }
    }

    @action
    insertDealAction() {
        let dealType: ActionType;
        switch (this.current_street) {
            case "FLOP":
                dealType = "DEAL_FLOP";
                break;
            case "TURN":
                dealType = "DEAL_TURN";
                break;
            case "RIVER":
                dealType = "DEAL_RIVER";
                break;
            default:
                return; // No deal action for preflop or showdown
        }

        this.addActionDraft({
            street: this.current_street,
            type: dealType,
            tags: [],
        });
    }

    // Validation
    @computed
    get canSave(): boolean {
        if (this.players.size < 2) return false;
        if (!this.small_blind || !this.big_blind) return false;
        if (this.actionDrafts.length === 0) return false;
        return true;
    }

    @computed
    get validationErrors(): string[] {
        const errors: string[] = [];
        if (this.players.size < 2) {
            errors.push("At least 2 players are required");
        }
        if (!this.small_blind || !this.big_blind) {
            errors.push("Small blind and big blind are required");
        }
        if (this.actionDrafts.length === 0) {
            errors.push("At least one action is required");
        }
        return errors;
    }

    // Save hand
    @action
    async saveHand(): Promise<string> {
        if (!this.canSave) {
            throw new Error(this.validationErrors.join(", "));
        }

        this.isSaving = true;
        this.saveError = null;

        try {
            const request: HandSaveRequest = {
                hand: {
                    small_blind: this.small_blind,
                    big_blind: this.big_blind,
                    ante: this.ante,
                    button_seat: this.button_seat,
                    table_size: this.table_size,
                    max_players: this.max_players,
                    board_cards: HandReplayClient.boardCardsToStrings(
                        this.board
                    ),
                    meta: {},
                },
                players: Array.from(this.players.values()).map((p) => ({
                    seat: p.seat,
                    player_label: p.player_label,
                    starting_stack: p.starting_stack,
                    is_hero: p.is_hero,
                    hole_cards: HandReplayClient.holeCardsToStrings(
                        p.hole_cards
                    ),
                    meta: {},
                })),
                actions: this.actionDrafts.map((a) => ({
                    action_index: a.action_index,
                    street: a.street,
                    type: a.type,
                    actor_seat: a.actor_seat,
                    amount: a.amount,
                    raise_to: a.raise_to,
                    decision_ms: a.decision_ms,
                    payload: a.payload,
                    tags: a.tags,
                })),
            };

            const response = await handReplayClient.saveHand(request);
            this.lastSavedHandId = response.handId;
            return response.handId;
        } catch (error: any) {
            this.saveError = error.message || "Failed to save hand";
            throw error;
        } finally {
            this.isSaving = false;
        }
    }

    // Tray management
    @action
    toggleHandBuilderTray() {
        this.handBuilderTrayOpen = !this.handBuilderTrayOpen;
    }

    @action
    setHandBuilderTrayOpen(open: boolean) {
        this.handBuilderTrayOpen = open;
    }

    // Current action management
    @action
    setCurrentActionType(type: ActionType | null) {
        this.currentActionType = type;
        // Reset amounts when changing action type
        if (type !== "RAISE" && type !== "BET") {
            this.currentActionAmount = null;
            this.currentActionRaiseTo = null;
        }
    }

    @action
    setCurrentActionAmount(amount: number | null) {
        this.currentActionAmount = amount;
    }

    @action
    setCurrentActionRaiseTo(raiseTo: number | null) {
        this.currentActionRaiseTo = raiseTo;
    }

    @action
    toggleCurrentActionTag(tag: string) {
        const index = this.currentActionTags.indexOf(tag);
        if (index >= 0) {
            this.currentActionTags.splice(index, 1);
        } else {
            this.currentActionTags.push(tag);
        }
    }

    @action
    clearCurrentAction() {
        this.currentActionType = null;
        this.currentActionAmount = null;
        this.currentActionRaiseTo = null;
        this.currentActionTags = [];
    }

    @computed
    get currentActingPlayer(): PlayerConfig | null {
        const playersInHand = this.playersInHand;
        if (playersInHand.length === 0) return null;
        return playersInHand[this.acting_position % playersInHand.length];
    }

    @action
    submitCurrentAction() {
        const player = this.currentActingPlayer;
        if (!player || !this.currentActionType) return;

        // Validate action requirements
        if (
            (this.currentActionType === "BET" && !this.currentActionAmount) ||
            (this.currentActionType === "RAISE" && !this.currentActionRaiseTo)
        ) {
            return; // Don't submit if required amounts are missing
        }

        // Calculate amounts based on action type
        let amount: number | undefined = undefined;
        let raiseTo: number | undefined = undefined;

        switch (this.currentActionType) {
            case "FOLD":
            case "CHECK":
                // No amounts needed
                break;
            case "CALL":
                amount = Math.max(
                    0,
                    this.current_bet - player.contributed_this_street
                );
                break;
            case "BET":
                amount = this.currentActionAmount ?? undefined;
                break;
            case "RAISE":
                raiseTo = this.currentActionRaiseTo ?? undefined;
                if (raiseTo) {
                    amount = Math.max(
                        0,
                        raiseTo - player.contributed_this_street
                    );
                }
                break;
            case "ALL_IN":
                amount = player.starting_stack;
                break;
            case "POST_SB":
                amount = this.small_blind;
                break;
            case "POST_BB":
                amount = this.big_blind;
                break;
            case "POST_ANTE":
                amount = this.ante;
                break;
        }

        // Add the action
        this.addActionDraft({
            street: this.current_street,
            type: this.currentActionType,
            actor_seat: player.seat,
            amount,
            raise_to: raiseTo,
            tags: [...this.currentActionTags],
        });

        // Move to next player (only if there are players in hand)
        const playersInHand = this.playersInHand;
        if (playersInHand.length > 0) {
            this.acting_position =
                (this.acting_position + 1) % playersInHand.length;
        }

        // Clear current action
        this.clearCurrentAction();
    }

    @action
    reset() {
        this.small_blind = 25;
        this.big_blind = 50;
        this.ante = 0;
        this.button_seat = 1;
        this.table_size = 6;
        this.max_players = 6;
        this.players.clear();
        this.board = [null, null, null, null, null];
        this.actionDrafts = [];
        this.current_street = "PREFLOP";
        this.current_bet = 0;
        this.acting_position = 0;
        this.isSaving = false;
        this.saveError = null;
        this.lastSavedHandId = null;
        this.handBuilderTrayOpen = false;
        this.clearCurrentAction();
        this.initializeDefaultPlayers();
    }
}
