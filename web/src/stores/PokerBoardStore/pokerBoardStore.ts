import { action, makeObservable, observable, reaction } from "mobx";
import { Card, HandRank, CardRank } from "@common/interfaces";
import { pokerService } from "../../services/index";
import {
    holeToString,
    boardToString,
    formatHandRank,
} from "../../components/utilities";

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
    dealerIndex: number = 0; // Dealer position (default: player 1, which is index 0)

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
    dealerSelectionMode: boolean = false;

    @observable
    equity: EquityState = {
        status: "idle",
        data: null,
        error: null,
        playerEquity: new Map(),
        playerTieEquity: new Map(),
    };

    @observable
    boardCardsUsedInWinningHand: Set<number> = new Set();

    @observable
    winningHandRank: HandRank | null = null;

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
     * Toggle dealer selection mode
     */
    @action
    toggleDealerSelectionMode() {
        this.dealerSelectionMode = !this.dealerSelectionMode;
    }

    /**
     * Set the dealer position
     */
    @action
    setDealer(playerIndex: number) {
        this.dealerIndex = playerIndex;
        this.dealerSelectionMode = false;
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

        // Clear board cards used in winning hand
        this.boardCardsUsedInWinningHand = new Set();
        this.winningHandRank = null;
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
            this.boardCardsUsedInWinningHand = new Set();
            this.winningHandRank = null;
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
            this.boardCardsUsedInWinningHand = new Set();
            this.winningHandRank = null;
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

            // Update board cards used in winning hand if board is complete
            if (this.isBoardComplete() && this.hasWinner()) {
                await this.updateBoardCardsUsedInWinningHand();
            } else {
                this.boardCardsUsedInWinningHand = new Set();
                this.winningHandRank = null;
            }
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
     * Update which board cards are used in the winning hand
     */
    @action
    async updateBoardCardsUsedInWinningHand() {
        if (!this.isBoardComplete()) {
            this.boardCardsUsedInWinningHand = new Set();
            this.winningHandRank = null;
            return;
        }

        const winningPlayers = this.getWinningPlayers();
        if (winningPlayers.length === 0) {
            this.boardCardsUsedInWinningHand = new Set();
            this.winningHandRank = null;
            return;
        }

        // Use the first winning player to determine which board cards are used
        const winningPlayerIndex = winningPlayers[0];
        const player = this.players[winningPlayerIndex];
        if (!player || !player[0] || !player[1]) {
            this.boardCardsUsedInWinningHand = new Set();
            this.winningHandRank = null;
            return;
        }

        const boardCards = this.getBoardCards();
        if (boardCards.length !== 5) {
            this.boardCardsUsedInWinningHand = new Set();
            this.winningHandRank = null;
            return;
        }

        try {
            // Get the winning player's hand rank
            const holeString = holeToString({ cards: [player[0], player[1]] });
            const boardString = boardToString({ cards: boardCards });
            const evaluateResult = await pokerService.evaluateHand(
                holeString,
                boardString
            );

            const bestHandRank = evaluateResult.handRank;
            this.winningHandRank = bestHandRank;

            // Find which 5 cards from 7 produce this hand rank
            const all7Cards: Card[] = [player[0], player[1], ...boardCards];
            const best5Cards = this.findBest5CardHand(all7Cards, bestHandRank);

            // Determine which board cards are in the best 5-card hand
            const boardIndicesUsed = new Set<number>();
            for (let i = 0; i < boardCards.length; i++) {
                const boardCard = boardCards[i];
                if (
                    best5Cards.some((card) => this.cardsEqual(card, boardCard))
                ) {
                    boardIndicesUsed.add(i);
                }
            }

            this.boardCardsUsedInWinningHand = boardIndicesUsed;
        } catch (error) {
            console.error(
                "Error determining board cards used in winning hand:",
                error
            );
            this.boardCardsUsedInWinningHand = new Set();
            this.winningHandRank = null;
        }
    }

    /**
     * Get the formatted winning hand name (e.g., "K high flush", "pair of 6s")
     * Returns null if there's no winning hand
     */
    getWinningHandName(): string | null {
        if (!this.winningHandRank) {
            return null;
        }
        return formatHandRank(this.winningHandRank);
    }

    /**
     * Find the best 5-card hand from 7 cards that matches the given hand rank
     * When multiple combinations have the same rank, prefers the one that uses
     * the player's hole cards (indices 0 and 1) over board cards
     */
    private findBest5CardHand(cards7: Card[], targetRank: HandRank): Card[] {
        let bestHand: Card[] | null = null;
        let bestRank: HandRank | null = null;
        let bestHoleCardCount: number = -1; // Track how many hole cards are used

        // Try all C(7,5) = 21 combinations
        for (let i = 0; i < 7; i++) {
            for (let j = i + 1; j < 7; j++) {
                // Build 5-card combination by excluding cards at indices i and j
                const cards5: Card[] = [];
                const excludedIndices = new Set([i, j]);
                for (let k = 0; k < 7; k++) {
                    if (!excludedIndices.has(k)) {
                        cards5.push(cards7[k]);
                    }
                }

                const handRank = this.evaluate5CardHand(cards5);

                // Count how many hole cards (indices 0 and 1) are in this combination
                // We exclude 2 cards (indices i and j), so:
                // holeCardsInHand = 2 - (number of excluded cards that are hole cards)
                // A hole card is excluded if its index is < 2
                const excludedHoleCards = (i < 2 ? 1 : 0) + (j < 2 ? 1 : 0);
                const holeCardsInHand = 2 - excludedHoleCards;

                const comparison =
                    bestRank === null
                        ? 1
                        : this.compareHandRanks(handRank, bestRank);

                if (comparison > 0) {
                    // This hand is better
                    bestRank = handRank;
                    bestHand = cards5;
                    bestHoleCardCount = holeCardsInHand;
                } else if (comparison === 0) {
                    // Same rank - prefer the one with more hole cards
                    if (holeCardsInHand > bestHoleCardCount) {
                        bestRank = handRank;
                        bestHand = cards5;
                        bestHoleCardCount = holeCardsInHand;
                    }
                }
            }
        }

        // If we found a hand that matches the target rank, return it
        if (bestRank && this.handRanksEqual(bestRank, targetRank) && bestHand) {
            return bestHand;
        }

        // Fallback: return the best hand we found
        return bestHand || [];
    }

    /**
     * Evaluate a 5-card hand and return its hand rank
     */
    private evaluate5CardHand(cards5: Card[]): HandRank {
        const ranks = cards5.map((c) => c.rank).sort((a, b) => b - a);
        const suits = cards5.map((c) => c.suit);

        // Count occurrences of each rank
        const rankCounts = new Map<CardRank, number>();
        ranks.forEach((rank) => {
            rankCounts.set(rank, (rankCounts.get(rank) || 0) + 1);
        });

        const counts = Array.from(rankCounts.values()).sort((a, b) => b - a);
        const isFlush = suits.every((suit) => suit === suits[0]);
        const isStraight = this.isStraight(ranks);

        // Check for Royal Flush (A-K-Q-J-10, all same suit)
        if (isFlush && isStraight && ranks[0] === 14 && ranks[4] === 10) {
            return { category: 9, tiebreak: [] };
        }

        // Check for Straight Flush
        if (isFlush && isStraight) {
            return { category: 8, tiebreak: [this.getStraightHigh(ranks)] };
        }

        // Check for Four of a Kind
        if (counts[0] === 4) {
            const fourOfAKind = Array.from(rankCounts.entries()).find(
                ([_, count]) => count === 4
            )?.[0]!;
            const kicker = Array.from(rankCounts.entries()).find(
                ([_, count]) => count === 1
            )?.[0]!;
            return { category: 7, tiebreak: [fourOfAKind, kicker] };
        }

        // Check for Full House
        if (counts[0] === 3 && counts[1] === 2) {
            const threeOfAKind = Array.from(rankCounts.entries()).find(
                ([_, count]) => count === 3
            )?.[0]!;
            const pair = Array.from(rankCounts.entries()).find(
                ([_, count]) => count === 2
            )?.[0]!;
            return { category: 6, tiebreak: [threeOfAKind, pair] };
        }

        // Check for Flush
        if (isFlush) {
            return { category: 5, tiebreak: ranks };
        }

        // Check for Straight
        if (isStraight) {
            return { category: 4, tiebreak: [this.getStraightHigh(ranks)] };
        }

        // Check for Three of a Kind
        if (counts[0] === 3) {
            const threeOfAKind = Array.from(rankCounts.entries()).find(
                ([_, count]) => count === 3
            )?.[0]!;
            const kickers = Array.from(rankCounts.entries())
                .filter(([_, count]) => count === 1)
                .map(([rank]) => rank)
                .sort((a, b) => b - a);
            return { category: 3, tiebreak: [threeOfAKind, ...kickers] };
        }

        // Check for Two Pair
        if (counts[0] === 2 && counts[1] === 2) {
            const pairs = Array.from(rankCounts.entries())
                .filter(([_, count]) => count === 2)
                .map(([rank]) => rank)
                .sort((a, b) => b - a);
            const kicker = Array.from(rankCounts.entries()).find(
                ([_, count]) => count === 1
            )?.[0]!;
            return { category: 2, tiebreak: [...pairs, kicker] };
        }

        // Check for Pair
        if (counts[0] === 2) {
            const pair = Array.from(rankCounts.entries()).find(
                ([_, count]) => count === 2
            )?.[0]!;
            const kickers = Array.from(rankCounts.entries())
                .filter(([_, count]) => count === 1)
                .map(([rank]) => rank)
                .sort((a, b) => b - a);
            return { category: 1, tiebreak: [pair, ...kickers] };
        }

        // High Card
        return { category: 0, tiebreak: ranks };
    }

    /**
     * Check if ranks form a straight
     */
    private isStraight(ranks: CardRank[]): boolean {
        // Check for A-2-3-4-5 (wheel)
        if (
            ranks[0] === 14 &&
            ranks[1] === 5 &&
            ranks[2] === 4 &&
            ranks[3] === 3 &&
            ranks[4] === 2
        ) {
            return true;
        }

        // Check for regular straight
        for (let i = 0; i < ranks.length - 1; i++) {
            if (ranks[i] - ranks[i + 1] !== 1) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get the high card of a straight
     */
    private getStraightHigh(ranks: CardRank[]): CardRank {
        // For wheel (A-2-3-4-5), the high card is 5
        if (
            ranks[0] === 14 &&
            ranks[1] === 5 &&
            ranks[2] === 4 &&
            ranks[3] === 3 &&
            ranks[4] === 2
        ) {
            return 5;
        }
        return ranks[0];
    }

    /**
     * Compare two hand ranks
     * Returns: > 0 if rank1 > rank2, < 0 if rank1 < rank2, 0 if equal
     */
    private compareHandRanks(rank1: HandRank, rank2: HandRank): number {
        if (rank1.category !== rank2.category) {
            return rank1.category - rank2.category;
        }

        // Compare tiebreak arrays
        for (
            let i = 0;
            i < Math.max(rank1.tiebreak.length, rank2.tiebreak.length);
            i++
        ) {
            const val1 = rank1.tiebreak[i] || 0;
            const val2 = rank2.tiebreak[i] || 0;
            if (val1 !== val2) {
                return val1 - val2;
            }
        }

        return 0;
    }

    /**
     * Check if two hand ranks are equal
     */
    private handRanksEqual(rank1: HandRank, rank2: HandRank): boolean {
        return this.compareHandRanks(rank1, rank2) === 0;
    }

    /**
     * Check if two cards are equal
     */
    private cardsEqual(card1: Card, card2: Card): boolean {
        return card1.rank === card2.rank && card1.suit === card2.suit;
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
