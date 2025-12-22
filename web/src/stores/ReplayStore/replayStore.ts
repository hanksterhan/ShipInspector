import { action, makeObservable, observable } from "mobx";
import {
    HandReplay,
    ReplayPlayer,
    StreetAction,
    BettingAction,
    Street,
    Card,
} from "@common/interfaces";
import { replayService } from "../../services/index";

export class ReplayStore {
    @observable
    currentReplay: HandReplay | null = null;

    @observable
    savedReplays: HandReplay[] = [];

    @observable
    isLoading: boolean = false;

    @observable
    error: string | null = null;

    @observable
    activeStreet: Street = "preflop";

    @observable
    selectedPlayerIndex: number | null = null;

    constructor() {
        makeObservable(this);
    }

    /**
     * Create a new empty replay
     */
    @action
    createNewReplay(
        tableSize: number,
        smallBlind: number,
        bigBlind: number
    ): void {
        this.currentReplay = {
            tableSize,
            buttonPosition: 0,
            smallBlind,
            bigBlind,
            players: [],
            streets: [],
            board: [],
            deadCards: [],
        };
        this.activeStreet = "preflop";
        this.selectedPlayerIndex = null;
        this.error = null;
    }

    /**
     * Set button position
     */
    @action
    setButtonPosition(position: number): void {
        if (!this.currentReplay) return;
        if (position < 0 || position >= this.currentReplay.tableSize) return;
        this.currentReplay.buttonPosition = position;
    }

    /**
     * Add a player to the replay
     */
    @action
    addPlayer(player: Omit<ReplayPlayer, "index">): void {
        if (!this.currentReplay) return;
        const index = this.currentReplay.players.length;
        if (index >= this.currentReplay.tableSize) return;

        this.currentReplay.players.push({
            ...player,
            index,
            isActive: player.isActive !== undefined ? player.isActive : true,
        });
    }

    /**
     * Update player information
     */
    @action
    updatePlayer(
        playerIndex: number,
        updates: Partial<Omit<ReplayPlayer, "index">>
    ): void {
        if (!this.currentReplay) return;
        const player = this.currentReplay.players.find(
            (p) => p.index === playerIndex
        );
        if (!player) return;

        Object.assign(player, updates);
    }

    /**
     * Remove a player from the replay
     */
    @action
    removePlayer(playerIndex: number): void {
        if (!this.currentReplay) return;
        this.currentReplay.players = this.currentReplay.players.filter(
            (p) => p.index !== playerIndex
        );
        // Re-index remaining players
        this.currentReplay.players.forEach((p, idx) => {
            p.index = idx;
        });
    }

    /**
     * Set hole cards for a player
     */
    @action
    setPlayerHoleCards(
        playerIndex: number,
        cards: [Card, Card] | undefined
    ): void {
        if (!this.currentReplay) return;
        const player = this.currentReplay.players.find(
            (p) => p.index === playerIndex
        );
        if (!player) return;

        player.holeCards = cards;
    }

    /**
     * Add a betting action to the current street
     */
    @action
    addStreetAction(action: BettingAction): void {
        if (!this.currentReplay) return;

        let streetAction = this.currentReplay.streets.find(
            (s) => s.street === this.activeStreet
        );

        if (!streetAction) {
            streetAction = {
                street: this.activeStreet,
                actions: [],
                potSize: 0,
            };
            this.currentReplay.streets.push(streetAction);
        }

        streetAction.actions.push(action);
    }

    /**
     * Remove the last action from the current street
     */
    @action
    removeLastStreetAction(): void {
        if (!this.currentReplay) return;

        const streetAction = this.currentReplay.streets.find(
            (s) => s.street === this.activeStreet
        );
        if (!streetAction || streetAction.actions.length === 0) return;

        streetAction.actions.pop();
    }

    /**
     * Set board cards for a street
     */
    @action
    setStreetBoardCards(street: Street, cards: Card[]): void {
        if (!this.currentReplay) return;

        let streetAction = this.currentReplay.streets.find(
            (s) => s.street === street
        );

        if (!streetAction) {
            streetAction = {
                street,
                actions: [],
                potSize: 0,
            };
            this.currentReplay.streets.push(streetAction);
        }

        streetAction.boardCards = cards;

        // Update main board array
        this.updateMainBoard();
    }

    /**
     * Update the main board array from street actions
     */
    @action
    private updateMainBoard(): void {
        if (!this.currentReplay) return;

        const allBoardCards: Card[] = [];
        const streets: Street[] = ["flop", "turn", "river"];

        for (const street of streets) {
            const streetAction = this.currentReplay.streets.find(
                (s) => s.street === street
            );
            if (streetAction?.boardCards) {
                allBoardCards.push(...streetAction.boardCards);
            }
        }

        this.currentReplay.board = allBoardCards;
    }

    /**
     * Set the active street
     */
    @action
    setActiveStreet(street: Street): void {
        this.activeStreet = street;
    }

    /**
     * Add a dead card
     */
    @action
    addDeadCard(card: Card, reason?: string): void {
        if (!this.currentReplay) return;

        // Check if card already exists
        const exists = this.currentReplay.deadCards.some(
            (dc) =>
                dc.card.rank === card.rank && dc.card.suit === card.suit
        );
        if (exists) return;

        this.currentReplay.deadCards.push({
            card,
            reason,
        });
    }

    /**
     * Remove a dead card
     */
    @action
    removeDeadCard(card: Card): void {
        if (!this.currentReplay) return;

        this.currentReplay.deadCards = this.currentReplay.deadCards.filter(
            (dc) =>
                !(dc.card.rank === card.rank && dc.card.suit === card.suit)
        );
    }

    /**
     * Set pot size for a street
     */
    @action
    setStreetPotSize(street: Street, potSize: number): void {
        if (!this.currentReplay) return;

        let streetAction = this.currentReplay.streets.find(
            (s) => s.street === street
        );

        if (!streetAction) {
            streetAction = {
                street,
                actions: [],
                potSize: 0,
            };
            this.currentReplay.streets.push(streetAction);
        }

        streetAction.potSize = potSize;
    }

    /**
     * Set winners
     */
    @action
    setWinners(playerIndices: number[]): void {
        if (!this.currentReplay) return;
        this.currentReplay.winners = playerIndices;
    }

    /**
     * Set pot distribution
     */
    @action
    setPotDistribution(
        distribution: { playerIndex: number; amount: number }[]
    ): void {
        if (!this.currentReplay) return;
        this.currentReplay.potDistribution = distribution;
    }

    /**
     * Set showdown flag
     */
    @action
    setShowdown(showdown: boolean): void {
        if (!this.currentReplay) return;
        this.currentReplay.showdown = showdown;
    }

    /**
     * Set replay title
     */
    @action
    setReplayTitle(title: string): void {
        if (!this.currentReplay) return;
        this.currentReplay.title = title;
    }

    /**
     * Set replay date
     */
    @action
    setReplayDate(date: number): void {
        if (!this.currentReplay) return;
        this.currentReplay.date = date;
    }

    /**
     * Save the current replay to the database
     */
    @action
    async saveReplay(): Promise<void> {
        if (!this.currentReplay) {
            this.error = "No replay to save";
            return;
        }

        this.isLoading = true;
        this.error = null;

        try {
            const response = await replayService.saveReplay(this.currentReplay);
            this.currentReplay = response.replay;
        } catch (error: any) {
            this.error = error.message || "Failed to save replay";
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Load a replay from the database
     */
    @action
    async loadReplay(id: string): Promise<void> {
        this.isLoading = true;
        this.error = null;

        try {
            const response = await replayService.loadReplay(id);
            this.currentReplay = response.replay;
            // Set active street to the last street with actions, or preflop
            if (this.currentReplay.streets.length > 0) {
                const lastStreet =
                    this.currentReplay.streets[
                        this.currentReplay.streets.length - 1
                    ];
                this.activeStreet = lastStreet.street;
            } else {
                this.activeStreet = "preflop";
            }
        } catch (error: any) {
            this.error = error.message || "Failed to load replay";
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Delete a replay from the database
     */
    @action
    async deleteReplay(id: string): Promise<void> {
        this.isLoading = true;
        this.error = null;

        try {
            await replayService.deleteReplay(id);
            // Remove from saved replays list
            this.savedReplays = this.savedReplays.filter((r) => r.id !== id);
            // If it's the current replay, clear it
            if (this.currentReplay?.id === id) {
                this.currentReplay = null;
            }
        } catch (error: any) {
            this.error = error.message || "Failed to delete replay";
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * List saved replays
     */
    @action
    async listReplays(options?: {
        limit?: number;
        offset?: number;
        search?: string;
    }): Promise<void> {
        this.isLoading = true;
        this.error = null;

        try {
            const response = await replayService.listReplays(options);
            this.savedReplays = response.replays;
        } catch (error: any) {
            this.error = error.message || "Failed to list replays";
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Reset/clear the current replay
     */
    @action
    resetReplay(): void {
        this.currentReplay = null;
        this.activeStreet = "preflop";
        this.selectedPlayerIndex = null;
        this.error = null;
    }

    /**
     * Get the current street action
     */
    getCurrentStreetAction(): StreetAction | null {
        if (!this.currentReplay) return null;

        return (
            this.currentReplay.streets.find(
                (s) => s.street === this.activeStreet
            ) || null
        );
    }

    /**
     * Get all active players (or all players if none are marked inactive)
     */
    getActivePlayers(): ReplayPlayer[] {
        if (!this.currentReplay) return [];
        const players = this.currentReplay.players;
        // If all players are active or none have isActive set, return all
        const hasInactive = players.some((p) => p.isActive === false);
        if (!hasInactive) return players;
        return players.filter((p) => p.isActive);
    }
}

