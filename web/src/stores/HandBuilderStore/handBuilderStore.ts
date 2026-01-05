import { action, makeObservable, observable, computed } from "mobx";
import { Card } from "@common/interfaces";
import {
    HandReplayClient,
    HandSaveRequest,
    handReplayClient,
} from "../../services/handReplayClient";
import { pokerBoardStore } from "../index";

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
    current_stack: number; // Current remaining stack (decreases as player bets)
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
    small_blind: number = 10;

    @observable
    big_blind: number = 20;

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

    @observable
    handBuilderTrayMinimized: boolean = false;

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

    @observable
    handStarted: boolean = false;

    constructor() {
        makeObservable(this);
        this.initializeDefaultPlayers();
    }

    @action
    initializeDefaultPlayers() {
        // Get default stack from pokerBoardStore or use 2000 as fallback
        const defaultStack = pokerBoardStore?.defaultStack ?? 2000;

        // Initialize with 2 players by default
        this.players.set(1, {
            seat: 1,
            player_label: "", // Empty string means use default "p1"
            starting_stack: defaultStack,
            current_stack: defaultStack,
            is_hero: true,
            hole_cards: [null, null],
            status: "ACTIVE",
            contributed_this_street: 0,
        });
        this.players.set(2, {
            seat: 2,
            player_label: "", // Empty string means use default "p2"
            starting_stack: defaultStack,
            current_stack: defaultStack,
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
        label: string = "", // Default to empty string (will display as "p{seat}")
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
            current_stack: stack,
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

    /**
     * Get display name for a player: custom name if set, otherwise "p{seat}"
     */
    getPlayerDisplayName(seat: number): string {
        const player = this.players.get(seat);
        if (!player) {
            return `p${seat}`;
        }
        // If player_label is set and non-empty, use it; otherwise use "p{seat}"
        return player.player_label && player.player_label.trim() !== ""
            ? player.player_label
            : `p${seat}`;
    }

    @action
    updatePlayerStack(seat: number, stack: number) {
        const player = this.players.get(seat);
        if (player) {
            // Calculate the difference to adjust current_stack accordingly
            const difference = stack - player.starting_stack;
            player.starting_stack = stack;
            player.current_stack = Math.max(
                0,
                player.current_stack + difference
            );
        }
    }

    /**
     * Update all player stacks to a new default value
     * Adjusts both starting_stack and current_stack proportionally
     */
    @action
    updateAllPlayerStacksToDefault(newDefaultStack: number) {
        this.players.forEach((player) => {
            // Calculate the difference between old and new default
            const difference = newDefaultStack - player.starting_stack;
            player.starting_stack = newDefaultStack;
            // Adjust current_stack by the same difference
            player.current_stack = Math.max(
                0,
                player.current_stack + difference
            );
        });
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

        // Calculate the amount to subtract from current_stack
        let betAmount: number = 0;

        switch (action.type) {
            case "FOLD":
                player.status = "FOLDED";
                break;
            case "ALL_IN":
                player.status = "ALL_IN";
                if (action.amount) {
                    betAmount = action.amount;
                    player.contributed_this_street += action.amount;
                }
                break;
            case "POST_SB":
                if (action.amount) {
                    betAmount = action.amount;
                    player.contributed_this_street += action.amount;
                    // Set current bet to small blind initially
                    if (this.current_bet === 0) {
                        this.current_bet = action.amount;
                    }
                }
                break;
            case "POST_BB":
                if (action.amount) {
                    betAmount = action.amount;
                    player.contributed_this_street += action.amount;
                    // Set current bet to big blind (overrides small blind)
                    this.current_bet = action.amount;
                }
                break;
            case "POST_ANTE":
            case "STRADDLE":
                if (action.amount) {
                    betAmount = action.amount;
                    player.contributed_this_street += action.amount;
                }
                break;
            case "CALL":
                if (action.amount) {
                    betAmount = action.amount;
                    player.contributed_this_street += action.amount;
                }
                break;
            case "BET":
                if (action.amount) {
                    betAmount = action.amount;
                    player.contributed_this_street += action.amount;
                }
                break;
            case "RAISE":
                if (action.raise_to) {
                    // For raise, use action.amount if available (already calculated), otherwise calculate it
                    betAmount =
                        action.amount ??
                        action.raise_to - player.contributed_this_street;
                    player.contributed_this_street = action.raise_to;
                    if (action.tags?.includes("all_in")) {
                        player.status = "ALL_IN";
                    }
                }
                break;
        }

        // Update current_stack by subtracting the bet amount
        if (betAmount > 0) {
            player.current_stack = Math.max(
                0,
                player.current_stack - betAmount
            );
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
                    player_label: this.getPlayerDisplayName(p.seat), // Use display name when saving
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
        // Reset minimized state when closing
        if (!this.handBuilderTrayOpen) {
            this.handBuilderTrayMinimized = false;
        }
    }

    @action
    setHandBuilderTrayOpen(open: boolean) {
        this.handBuilderTrayOpen = open;
        // Reset minimized state when closing
        if (!open) {
            this.handBuilderTrayMinimized = false;
        }
    }

    @action
    toggleHandBuilderTrayMinimized() {
        this.handBuilderTrayMinimized = !this.handBuilderTrayMinimized;
    }

    @action
    setHandBuilderTrayMinimized(minimized: boolean) {
        this.handBuilderTrayMinimized = minimized;
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

    /**
     * Get actions for the current street
     */
    @computed
    get currentStreetActions(): ActionDraft[] {
        return this.actionDrafts.filter(
            (a) => a.street === this.current_street
        );
    }

    /**
     * Get the seat that posted the big blind or straddle in preflop
     */
    private getBigBlindOrStraddleSeat(): number | null {
        if (this.current_street !== "PREFLOP") return null;

        const currentStreetActions = this.currentStreetActions;

        // Find straddle first (if exists, it's the last blind)
        for (let i = currentStreetActions.length - 1; i >= 0; i--) {
            const action = currentStreetActions[i];
            if (action.type === "STRADDLE" && action.actor_seat !== undefined) {
                return action.actor_seat;
            }
        }

        // Otherwise find big blind
        for (let i = currentStreetActions.length - 1; i >= 0; i--) {
            const action = currentStreetActions[i];
            if (action.type === "POST_BB" && action.actor_seat !== undefined) {
                return action.actor_seat;
            }
        }

        return null;
    }

    /**
     * Check if betting round is complete
     * A betting round is complete when all active players have either:
     * 1. Folded, OR
     * 2. Matched the current bet (contributed_this_street >= current_bet), OR
     * 3. Are all-in
     * AND action has returned to the last aggressor (or big blind/straddle in preflop)
     */
    @computed
    get isBettingRoundComplete(): boolean {
        const playersInHand = this.playersInHand;
        if (playersInHand.length <= 1) return true; // Only one player left

        const currentStreetActions = this.currentStreetActions;

        // Check if all players have matched the bet or folded
        const allMatchedOrFolded = playersInHand.every((player) => {
            // Player has folded
            if (player.status === "FOLDED") return true;
            // Player is all-in
            if (player.status === "ALL_IN") return true;
            // Player has matched the current bet
            return player.contributed_this_street >= this.current_bet;
        });

        if (!allMatchedOrFolded) return false;

        // Find the last aggressive action (BET or RAISE)
        let lastAggressorSeat: number | null = null;
        let lastAggressorIndex = -1;

        for (let i = currentStreetActions.length - 1; i >= 0; i--) {
            const action = currentStreetActions[i];
            if (
                (action.type === "BET" || action.type === "RAISE") &&
                action.actor_seat !== undefined
            ) {
                lastAggressorSeat = action.actor_seat;
                lastAggressorIndex = i;
                break;
            }
        }

        // Special handling for PREFLOP: if no bet/raise, check if BB/straddle has checked
        if (lastAggressorSeat === null && this.current_street === "PREFLOP") {
            const bbOrStraddleSeat = this.getBigBlindOrStraddleSeat();
            if (bbOrStraddleSeat !== null) {
                // Find the index of the POST_BB or STRADDLE action
                let blindActionIndex = -1;
                for (let i = 0; i < currentStreetActions.length; i++) {
                    const action = currentStreetActions[i];
                    if (
                        (action.type === "POST_BB" ||
                            action.type === "STRADDLE") &&
                        action.actor_seat === bbOrStraddleSeat
                    ) {
                        blindActionIndex = i;
                        break;
                    }
                }

                // Check if BB/straddle has checked AFTER posting the blind
                if (blindActionIndex >= 0) {
                    const actionsAfterBlind = currentStreetActions.slice(
                        blindActionIndex + 1
                    );
                    const hasChecked = actionsAfterBlind.some(
                        (a) =>
                            a.actor_seat === bbOrStraddleSeat &&
                            a.type === "CHECK"
                    );

                    if (hasChecked) {
                        // Count unique players who have acted (excluding blinds/antes/straddle)
                        const actingSeats = new Set(
                            currentStreetActions
                                .filter(
                                    (a) =>
                                        a.actor_seat !== undefined &&
                                        a.type !== "POST_SB" &&
                                        a.type !== "POST_BB" &&
                                        a.type !== "POST_ANTE" &&
                                        a.type !== "STRADDLE"
                                )
                                .map((a) => a.actor_seat!)
                        );
                        // All players have acted (including BB/straddle checking)
                        return actingSeats.size >= playersInHand.length;
                    }
                }
            }

            // If no bet/raise and BB/straddle hasn't checked yet, betting is not complete
            return false;
        }

        // If no bet/raise happened in post-flop, betting round is complete when all players have checked
        if (lastAggressorSeat === null) {
            // Count unique players who have acted (excluding blinds/antes)
            const actingSeats = new Set(
                currentStreetActions
                    .filter(
                        (a) =>
                            a.actor_seat !== undefined &&
                            a.type !== "POST_SB" &&
                            a.type !== "POST_BB" &&
                            a.type !== "POST_ANTE" &&
                            a.type !== "STRADDLE"
                    )
                    .map((a) => a.actor_seat!)
            );
            return actingSeats.size >= playersInHand.length;
        }

        // Action has returned to last aggressor if:
        // 1. There are actions after the last bet/raise
        // 2. All other active players have acted after the last bet/raise
        // 3. Last aggressor has acted again (or all others folded)
        const actionsAfterLastBet = currentStreetActions.slice(
            lastAggressorIndex + 1
        );

        if (actionsAfterLastBet.length === 0) return false;

        // Get seats that acted after the last bet/raise
        const seatsThatActedAfter = new Set(
            actionsAfterLastBet
                .filter((a) => a.actor_seat !== undefined)
                .map((a) => a.actor_seat!)
        );

        // Get active seats (excluding folded players)
        const activeSeats = new Set(
            playersInHand
                .filter((p) => p.status !== "FOLDED")
                .map((p) => p.seat)
        );

        // Check if all active players (except possibly the last aggressor) have acted
        // and the last aggressor has acted again OR all others have folded
        const otherActiveSeats = new Set(activeSeats);
        otherActiveSeats.delete(lastAggressorSeat);

        // All other active players have acted
        const allOthersActed = Array.from(otherActiveSeats).every((seat) =>
            seatsThatActedAfter.has(seat)
        );

        // Last aggressor has acted again OR all others folded
        const lastAggressorActedAgain =
            seatsThatActedAfter.has(lastAggressorSeat);
        const allOthersFolded = otherActiveSeats.size === 0;

        return allOthersActed && (lastAggressorActedAgain || allOthersFolded);
    }

    /**
     * Check if current player is facing a bet (needs to call)
     */
    @computed
    get isFacingBet(): boolean {
        const player = this.currentActingPlayer;
        if (!player) return false;
        return (
            this.current_bet > 0 &&
            player.contributed_this_street < this.current_bet
        );
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
                amount = player.current_stack;
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

        // Check if betting round is now complete
        const bettingComplete = this.isBettingRoundComplete;

        // Move to next player (only if there are players in hand and betting not complete)
        if (!bettingComplete) {
            const playersInHand = this.playersInHand;
            if (playersInHand.length > 0) {
                this.acting_position =
                    (this.acting_position + 1) % playersInHand.length;
            }
        }

        // Clear current action
        this.clearCurrentAction();

        // If betting is complete, update scope to highlight board cards
        if (bettingComplete) {
            this.updateScopeForNextAction();
        }
    }

    /**
     * Update scope to highlight the next action (board cards)
     * This is called when betting round completes
     */
    @action
    updateScopeForNextAction() {
        const board = pokerBoardStore.board;
        const currentStreet = this.current_street;

        // Determine which board card should be highlighted
        if (currentStreet === "PREFLOP" || currentStreet === "FLOP") {
            // Waiting for flop - highlight first empty flop card
            if (board[0] === null) {
                pokerBoardStore.setScope({ kind: "board", boardIndex: 0 });
            } else if (board[1] === null) {
                pokerBoardStore.setScope({ kind: "board", boardIndex: 1 });
            } else if (board[2] === null) {
                pokerBoardStore.setScope({ kind: "board", boardIndex: 2 });
            }
        } else if (currentStreet === "TURN") {
            // Waiting for turn - highlight turn card
            if (board[3] === null) {
                pokerBoardStore.setScope({ kind: "board", boardIndex: 3 });
            }
        } else if (currentStreet === "RIVER") {
            // Waiting for river - highlight river card
            if (board[4] === null) {
                pokerBoardStore.setScope({ kind: "board", boardIndex: 4 });
            }
        }
    }

    /**
     * Get the next active player seat clockwise from a given seat
     */
    private getNextActivePlayerClockwise(fromSeat: number): number | null {
        const activePlayers = this.activePlayers;
        if (activePlayers.length === 0) return null;

        // Sort by seat number
        const sortedSeats = activePlayers
            .map((p) => p.seat)
            .sort((a, b) => a - b);

        // Find the next seat after fromSeat
        for (const seat of sortedSeats) {
            if (seat > fromSeat) {
                return seat;
            }
        }

        // Wrap around: return the first seat
        return sortedSeats[0] !== fromSeat ? sortedSeats[0] : null;
    }

    /**
     * Calculate small blind seat based on button and number of players
     * In heads-up, dealer is small blind
     */
    private getSmallBlindSeat(): number | null {
        const activePlayers = this.activePlayers;
        if (activePlayers.length < 2) return null;

        // Heads-up: dealer is small blind
        if (activePlayers.length === 2) {
            return this.button_seat;
        }

        // 3+ players: SB is next clockwise from button
        return this.getNextActivePlayerClockwise(this.button_seat);
    }

    /**
     * Calculate big blind seat based on button and number of players
     */
    private getBigBlindSeat(): number | null {
        const activePlayers = this.activePlayers;
        if (activePlayers.length < 2) return null;

        // Heads-up: BB is the non-dealer
        if (activePlayers.length === 2) {
            const nonDealer = activePlayers.find(
                (p) => p.seat !== this.button_seat
            );
            return nonDealer?.seat ?? null;
        }

        // 3+ players: BB is next clockwise from SB
        const sbSeat = this.getSmallBlindSeat();
        if (sbSeat === null) return null;
        return this.getNextActivePlayerClockwise(sbSeat);
    }

    /**
     * Get the first player to act after blinds (UTG in multi-way, SB in heads-up)
     */
    private getFirstToActSeat(): number | null {
        const activePlayers = this.activePlayers;
        if (activePlayers.length < 2) return null;

        // Heads-up: SB acts first (dealer)
        if (activePlayers.length === 2) {
            return this.button_seat;
        }

        // Multi-way: UTG is next clockwise from big blind
        const bbSeat = this.getBigBlindSeat();
        if (bbSeat === null) return null;
        return this.getNextActivePlayerClockwise(bbSeat);
    }

    @action
    setHandStarted(started: boolean) {
        if (started && !this.handStarted) {
            // Check if blinds have already been posted
            const hasBlinds = this.actionDrafts.some(
                (a) => a.type === "POST_SB" || a.type === "POST_BB"
            );

            // Hand is starting - automatically post blinds if not already posted
            if (!hasBlinds) {
                const sbSeat = this.getSmallBlindSeat();
                const bbSeat = this.getBigBlindSeat();

                // Post small blind
                if (sbSeat !== null) {
                    this.addActionDraft({
                        street: "PREFLOP",
                        type: "POST_SB",
                        actor_seat: sbSeat,
                        amount: this.small_blind,
                        tags: [],
                    });
                }

                // Post big blind
                if (bbSeat !== null) {
                    this.addActionDraft({
                        street: "PREFLOP",
                        type: "POST_BB",
                        actor_seat: bbSeat,
                        amount: this.big_blind,
                        tags: [],
                    });
                }
            }

            // Set acting position to first player to act
            const firstToActSeat = this.getFirstToActSeat();
            if (firstToActSeat !== null) {
                const playersInHand = this.playersInHand;
                const firstToActIndex = playersInHand.findIndex(
                    (p) => p.seat === firstToActSeat
                );
                if (firstToActIndex >= 0) {
                    this.acting_position = firstToActIndex;
                }
            }
        }

        this.handStarted = started;
    }

    get GetHandStarted(): boolean {
        return this.handStarted;
    }

    @action
    reset() {
        this.small_blind = 10;
        this.big_blind = 20;
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
        this.handStarted = false;
        this.initializeDefaultPlayers();
    }
}
