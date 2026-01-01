import { action, makeObservable, observable, reaction } from "mobx";
import { Card } from "@common/interfaces";
import { pokerService } from "../../services/index";
import { holeToString, boardToString } from "../../components/utilities";

/**
 * Scope represents the currently focused slot for card selection
 */
export type Scope =
    | { kind: "player"; playerIndex: number; cardIndex: 0 | 1 }
    | { kind: "board"; boardIndex: number };

/**
 * Equity calculation state
 */
export interface EquityState {
    status: "idle" | "loading" | "success" | "error";
    data: {
        win: number[];
        tie: number[];
        samples: number;
    } | null;
    error: string | null;
    // Map from player index to win percentage (0-1)
    playerEquity: Map<number, number>;
    // Map from player index to tie percentage (0-1)
    playerTieEquity: Map<number, number>;
}

/**
 * PokerBoardStore manages the poker board state with scope-based selection
 *
 * CONFIGURATION:
 * - To change number of players: modify NUM_PLAYERS constant (default: 8)
 * - To change equity endpoint: modify equityClient.ts API_URL
 */
export class PokerBoardStore {
    // Number of players (configurable)
    static readonly NUM_PLAYERS = 8;

    @observable
    players: Array<[Card | null, Card | null]> = [];

    @observable
    activePlayers: Set<number> = new Set([0, 1]); // By default, players 1 and 2 are active

    @observable
    board: [Card | null, Card | null, Card | null, Card | null, Card | null] = [
        null,
        null,
        null,
        null,
        null,
    ];

    @observable
    scope: Scope = { kind: "player", playerIndex: 0, cardIndex: 0 };

    @observable
    pickerOpen: boolean = false;

    @observable
    equity: EquityState = {
        status: "idle",
        data: null,
        error: null,
        playerEquity: new Map(),
        playerTieEquity: new Map(),
    };

    private currentAbortController: AbortController | null = null;
    private reactionDisposer: (() => void) | null = null;

    constructor() {
        makeObservable(this);
        // Initialize players array
        this.players = Array.from(
            { length: PokerBoardStore.NUM_PLAYERS },
            () => [null, null] as [Card | null, Card | null]
        );
        // Initialize active players (default: players 0 and 1)
        this.activePlayers = new Set([0, 1]);

        // Set up reaction to calculate equity when conditions are met
        this.reactionDisposer = reaction(
            () => {
                // Track changes to players and board
                // Access all players to ensure MobX tracks them
                const players = this.players;
                const activePlayers = this.activePlayers;
                const board = this.board;

                // Create a serializable key that changes when relevant data changes
                const playerKeys = Array.from(activePlayers)
                    .map((idx) => {
                        const p = players[idx];
                        if (!p || !p[0] || !p[1]) return null;
                        return `${idx}:${p[0].rank}${p[0].suit}-${p[1].rank}${p[1].suit}`;
                    })
                    .filter((k) => k !== null)
                    .join("|");

                const boardKey = board
                    .map((c) => (c ? `${c.rank}${c.suit}` : "null"))
                    .join(",");

                return `${playerKeys}|${boardKey}`;
            },
            () => {
                this.checkAndCalculateEquity();
            },
            { fireImmediately: false }
        );
    }

    /**
     * Check if a card is already used in any player hand or board
     */
    @action
    isCardUsed(card: Card): boolean {
        // Check players
        for (const player of this.players) {
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

        // Check board
        for (const boardCard of this.board) {
            if (
                boardCard &&
                boardCard.rank === card.rank &&
                boardCard.suit === card.suit
            ) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get all used cards
     */
    getAllUsedCards(): Card[] {
        const used: Card[] = [];
        for (const player of this.players) {
            if (player[0]) used.push(player[0]);
            if (player[1]) used.push(player[1]);
        }
        for (const boardCard of this.board) {
            if (boardCard) used.push(boardCard);
        }
        return used;
    }

    /**
     * Find the next empty scope slot, starting from the given scope
     */
    @action
    nextScope(fromScope: Scope): Scope {
        // Helper to check if a slot is filled
        const isSlotFilled = (scope: Scope): boolean => {
            if (scope.kind === "player") {
                return (
                    this.players[scope.playerIndex]?.[scope.cardIndex] !== null
                );
            } else {
                return this.board[scope.boardIndex] !== null;
            }
        };

        // Start from the next position after fromScope
        let currentScope: Scope | null = null;

        // Determine starting point
        if (fromScope.kind === "player") {
            const { playerIndex, cardIndex } = fromScope;
            if (cardIndex === 0) {
                // Move to second card of same player
                currentScope = { kind: "player", playerIndex, cardIndex: 1 };
            } else {
                // Move to first card of next player
                if (playerIndex < PokerBoardStore.NUM_PLAYERS - 1) {
                    currentScope = {
                        kind: "player",
                        playerIndex: playerIndex + 1,
                        cardIndex: 0,
                    };
                } else {
                    // Move to board
                    currentScope = { kind: "board", boardIndex: 0 };
                }
            }
        } else {
            // From board, move to next board slot
            if (fromScope.boardIndex < 4) {
                currentScope = {
                    kind: "board",
                    boardIndex: fromScope.boardIndex + 1,
                };
            } else {
                // Already at last board slot, stay there
                return fromScope;
            }
        }

        // Find next empty slot (only check active players)
        let attempts = 0;
        const maxAttempts = PokerBoardStore.NUM_PLAYERS * 2 + 5; // All possible slots

        while (currentScope && attempts < maxAttempts) {
            // Skip inactive players
            if (
                currentScope.kind === "player" &&
                !this.activePlayers.has(currentScope.playerIndex)
            ) {
                // Skip to next player
                const currentPlayerIndex: number = currentScope.playerIndex;
                if (currentPlayerIndex < PokerBoardStore.NUM_PLAYERS - 1) {
                    currentScope = {
                        kind: "player",
                        playerIndex: currentPlayerIndex + 1,
                        cardIndex: 0,
                    };
                } else {
                    currentScope = { kind: "board", boardIndex: 0 };
                }
                attempts++;
                continue;
            }

            if (!isSlotFilled(currentScope)) {
                return currentScope;
            }

            // Advance to next slot
            if (currentScope.kind === "player") {
                const currentPlayerIndex: number = currentScope.playerIndex;
                const currentCardIndex: 0 | 1 = currentScope.cardIndex;
                if (currentCardIndex === 0) {
                    currentScope = {
                        kind: "player",
                        playerIndex: currentPlayerIndex,
                        cardIndex: 1,
                    };
                } else {
                    if (currentPlayerIndex < PokerBoardStore.NUM_PLAYERS - 1) {
                        currentScope = {
                            kind: "player",
                            playerIndex: currentPlayerIndex + 1,
                            cardIndex: 0,
                        };
                    } else {
                        currentScope = { kind: "board", boardIndex: 0 };
                    }
                }
            } else {
                const currentBoardIndex: number = currentScope.boardIndex;
                if (currentBoardIndex < 4) {
                    currentScope = {
                        kind: "board",
                        boardIndex: currentBoardIndex + 1,
                    };
                } else {
                    // All slots filled, return current scope
                    return fromScope;
                }
            }
            attempts++;
        }

        // If all slots are filled, return the original scope
        return fromScope;
    }

    /**
     * Apply a card to the current scope, enforcing uniqueness
     */
    @action
    applyCardToScope(scope: Scope, card: Card): boolean {
        // Check if card is already used
        if (this.isCardUsed(card)) {
            return false;
        }

        if (scope.kind === "player") {
            const player = this.players[scope.playerIndex];
            if (player) {
                // Replace the entire tuple to ensure MobX detects the change
                const newPlayer: [Card | null, Card | null] = [...player];
                newPlayer[scope.cardIndex] = card;
                // Replace the entire players array to ensure MobX detects the change
                const newPlayers = [...this.players];
                newPlayers[scope.playerIndex] = newPlayer;
                this.players = newPlayers;
            }
        } else {
            // Replace the entire board array to ensure MobX detects the change
            const newBoard: [
                Card | null,
                Card | null,
                Card | null,
                Card | null,
                Card | null,
            ] = [...this.board];
            newBoard[scope.boardIndex] = card;
            this.board = newBoard;
        }

        return true;
    }

    /**
     * Clear board cards from a given index onwards (cascading clear)
     */
    @action
    clearBoardFrom(index: number) {
        // Replace the entire board array to ensure MobX detects the change
        const newBoard: [
            Card | null,
            Card | null,
            Card | null,
            Card | null,
            Card | null,
        ] = [...this.board];
        for (let i = index; i < 5; i++) {
            newBoard[i] = null;
        }
        this.board = newBoard;
    }

    /**
     * Set the current scope
     */
    @action
    setScope(scope: Scope) {
        this.scope = scope;
    }

    /**
     * Add a player (make them active)
     */
    @action
    addPlayer(playerIndex: number) {
        if (playerIndex >= 0 && playerIndex < PokerBoardStore.NUM_PLAYERS) {
            this.activePlayers.add(playerIndex);
            // Trigger observable update by creating new Set
            this.activePlayers = new Set(this.activePlayers);
        }
    }

    /**
     * Check if a player is active
     */
    isPlayerActive(playerIndex: number): boolean {
        return this.activePlayers.has(playerIndex);
    }

    /**
     * Get player cards for a specific player index
     * This getter ensures MobX tracks the array access properly
     * Note: This is not a computed property because it takes a parameter
     * Instead, we rely on accessing this.players which is observable
     */
    getPlayerCards(playerIndex: number): [Card | null, Card | null] {
        // Access the entire array first to ensure MobX tracks it
        const players = this.players;
        return players[playerIndex] || [null, null];
    }

    /**
     * Open the card picker
     */
    @action
    openPicker() {
        this.pickerOpen = true;
    }

    /**
     * Close the card picker
     */
    @action
    closePicker() {
        this.pickerOpen = false;
    }

    /**
     * Set a card for the current scope and auto-advance
     */
    @action
    setCard(card: Card): boolean {
        if (!this.applyCardToScope(this.scope, card)) {
            return false;
        }

        // Auto-advance to next empty slot
        const next = this.nextScope(this.scope);
        this.scope = next;

        return true;
    }

    /**
     * Clear a specific slot
     */
    @action
    clearCard(scope: Scope) {
        if (scope.kind === "player") {
            const player = this.players[scope.playerIndex];
            if (player) {
                // Replace the entire tuple to ensure MobX detects the change
                const newPlayer: [Card | null, Card | null] = [...player];
                newPlayer[scope.cardIndex] = null;
                // Replace the entire players array to ensure MobX detects the change
                const newPlayers = [...this.players];
                newPlayers[scope.playerIndex] = newPlayer;
                this.players = newPlayers;
            }
        } else {
            // For board, clear from this index onwards
            this.clearBoardFrom(scope.boardIndex);
        }
    }

    /**
     * Reset all cards and state
     */
    @action
    resetAll() {
        // Cancel any in-flight equity requests
        if (this.currentAbortController) {
            this.currentAbortController.abort();
            this.currentAbortController = null;
        }

        // Reset players
        this.players = Array.from(
            { length: PokerBoardStore.NUM_PLAYERS },
            () => [null, null] as [Card | null, Card | null]
        );

        // Reset active players to default (players 0 and 1)
        this.activePlayers = new Set([0, 1]);

        // Reset board
        this.board = [null, null, null, null, null];

        // Reset scope to first slot of first active player
        this.scope = { kind: "player", playerIndex: 0, cardIndex: 0 };

        // Close picker
        this.pickerOpen = false;

        // Clear equity
        this.equity = {
            status: "idle",
            data: null,
            error: null,
            playerEquity: new Map(),
            playerTieEquity: new Map(),
        };
    }

    /**
     * Check if we have enough data to calculate equity
     * Minimum: all active players have 2 cards
     */
    canCalculateEquity(): boolean {
        for (const playerIndex of this.activePlayers) {
            const player = this.players[playerIndex];
            if (!player || !player[0] || !player[1]) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check if board is empty (preflop)
     */
    isPreflop(): boolean {
        return this.board.every((card) => card === null);
    }

    /**
     * Check if board state is valid for equity calculation
     * Valid states: preflop (0 cards), flop (3 cards), turn (4 cards), river (5 cards)
     */
    isValidBoardState(): boolean {
        const boardCards = this.board.filter((card) => card !== null);
        const count = boardCards.length;
        // Valid poker stages: 0 (preflop), 3 (flop), 4 (turn), 5 (river)
        return count === 0 || count === 3 || count === 4 || count === 5;
    }

    /**
     * Get board cards as an array (excluding nulls)
     */
    getBoardCards(): Card[] {
        return this.board.filter((card): card is Card => card !== null);
    }

    /**
     * Get active players with complete hands (both cards selected)
     */
    getActivePlayersWithCompleteHands(): Array<{
        playerIndex: number;
        cards: [Card, Card];
    }> {
        const result: Array<{ playerIndex: number; cards: [Card, Card] }> = [];
        for (const playerIndex of this.activePlayers) {
            const player = this.players[playerIndex];
            if (player && player[0] && player[1]) {
                result.push({
                    playerIndex,
                    cards: [player[0], player[1]],
                });
            }
        }
        return result;
    }

    /**
     * Check conditions and calculate equity if needed
     * Calculates for valid poker stages: preflop (0 cards), flop (3 cards), turn (4 cards), river (5 cards)
     * Requires at least 2 players with complete hands
     */
    @action
    async checkAndCalculateEquity() {
        // Only calculate for valid board states (0, 3, 4, or 5 cards)
        if (!this.isValidBoardState()) {
            // Clear equity if board state is invalid
            this.equity = {
                status: "idle",
                data: null,
                error: null,
                playerEquity: new Map(),
                playerTieEquity: new Map(),
            };
            return;
        }

        // Get active players with complete hands
        const playersWithHands = this.getActivePlayersWithCompleteHands();

        // Need at least 2 players with complete hands
        if (playersWithHands.length < 2) {
            // Clear equity if not enough players
            this.equity = {
                status: "idle",
                data: null,
                error: null,
                playerEquity: new Map(),
                playerTieEquity: new Map(),
            };
            return;
        }

        // Calculate equity
        await this.calculateEquityForPlayers(playersWithHands);
    }

    /**
     * Calculate equity for given players
     */
    @action
    async calculateEquityForPlayers(
        playersWithHands: Array<{ playerIndex: number; cards: [Card, Card] }>
    ) {
        // Cancel any in-flight requests
        if (this.currentAbortController) {
            this.currentAbortController.abort();
        }

        const abortController = new AbortController();
        this.currentAbortController = abortController;

        // Set loading state
        this.equity = {
            status: "loading",
            data: null,
            error: null,
            playerEquity: new Map(),
            playerTieEquity: new Map(),
        };

        try {
            // Convert players to string format
            const playersStrings = playersWithHands.map((p) =>
                holeToString({ cards: p.cards })
            );

            // Get board cards and convert to string format
            const boardCards = this.getBoardCards();
            const boardString = boardToString({ cards: boardCards });

            // Call the API
            const result = await pokerService.getHandEquity(
                playersStrings,
                boardString,
                { mode: "rust" },
                [],
                abortController.signal
            );

            // Check if request was aborted
            if (abortController.signal.aborted) {
                return;
            }

            // Map equity results to player indices
            const playerEquityMap = new Map<number, number>();
            const playerTieEquityMap = new Map<number, number>();
            playersWithHands.forEach((player, index) => {
                const winPercentage = result.equity.win[index] || 0;
                const tiePercentage = result.equity.tie[index] || 0;
                playerEquityMap.set(player.playerIndex, winPercentage);
                playerTieEquityMap.set(player.playerIndex, tiePercentage);
            });

            // Update equity state
            this.equity = {
                status: "success",
                data: {
                    win: result.equity.win,
                    tie: result.equity.tie,
                    samples: result.equity.samples,
                },
                error: null,
                playerEquity: playerEquityMap,
                playerTieEquity: playerTieEquityMap,
            };
        } catch (err) {
            // Don't set error for aborted requests
            if (err instanceof Error && err.name === "AbortError") {
                return;
            }

            // Only set error if this request wasn't aborted
            if (!abortController.signal.aborted) {
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : "Failed to calculate equity";
                this.equity = {
                    status: "error",
                    data: null,
                    error: errorMessage,
                    playerEquity: new Map(),
                    playerTieEquity: new Map(),
                };
            }
        } finally {
            // Only clear abort controller if this is still the current request
            if (this.currentAbortController === abortController) {
                this.currentAbortController = null;
            }
        }
    }

    /**
     * Get equity percentage for a specific player (0-100)
     */
    getPlayerEquity(playerIndex: number): number | null {
        const winPercentage = this.equity.playerEquity.get(playerIndex);
        if (winPercentage === undefined) {
            return null;
        }
        return Math.round(winPercentage * 100);
    }

    /**
     * Get tie equity percentage for a specific player (0-100)
     */
    getPlayerTieEquity(playerIndex: number): number | null {
        const tiePercentage = this.equity.playerTieEquity.get(playerIndex);
        if (tiePercentage === undefined) {
            return null;
        }
        return tiePercentage * 100; // Keep decimal precision for tie
    }

    /**
     * Check if the board is complete (has 5 cards - river)
     */
    isBoardComplete(): boolean {
        return this.getBoardCards().length === 5;
    }

    /**
     * Check if a player is a winner (has 100% win equity when board is complete)
     */
    isPlayerWinner(playerIndex: number): boolean {
        if (!this.isBoardComplete()) {
            return false;
        }
        const winEquity = this.getPlayerEquity(playerIndex);
        // When board is complete, winner has 100% win equity (or close due to rounding)
        return winEquity !== null && winEquity >= 99.9;
    }

    /**
     * Get all winning player indices when board is complete
     */
    getWinningPlayers(): number[] {
        if (!this.isBoardComplete()) {
            return [];
        }
        const winners: number[] = [];
        for (const playerIndex of this.activePlayers) {
            if (this.isPlayerWinner(playerIndex)) {
                winners.push(playerIndex);
            }
        }
        return winners;
    }

    /**
     * Check if there is at least one winner when board is complete
     */
    hasWinner(): boolean {
        return this.getWinningPlayers().length > 0;
    }

    /**
     * Cleanup reaction on dispose
     */
    dispose() {
        if (this.reactionDisposer) {
            this.reactionDisposer();
            this.reactionDisposer = null;
        }
        if (this.currentAbortController) {
            this.currentAbortController.abort();
            this.currentAbortController = null;
        }
    }
}
