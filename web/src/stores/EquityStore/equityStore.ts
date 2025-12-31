import { action, makeObservable, observable, reaction } from "mobx";
import {
    EquityResult,
    CalculateEquityResponse,
    Card,
} from "@common/interfaces";
import { cardStore } from "../index";
import { pokerService } from "../../services/index";
import { holeToString, boardToString } from "../../components/utilities";

export class EquityStore {
    @observable
    equityResult: EquityResult | null = null;

    @observable
    isLoading: boolean = false;

    @observable
    error: string | null = null;

    @observable
    players: Card[][] = [];

    @observable
    board: Card[] = [];

    @observable
    dead: Card[] = [];

    @observable
    samples: number = 0;

    // Cache key to track which hand configuration this result is for
    private cacheKey: string | null = null;

    private currentAbortController: AbortController | null = null;
    private reactionDisposer: (() => void) | null = null;

    constructor() {
        makeObservable(this);

        // Single centralized reaction that watches for card changes
        // This ensures only one reaction triggers calculations, even if multiple EquityDisplay components exist
        this.reactionDisposer = reaction(
            () => {
                // Guard against cardStore being undefined during initialization
                if (!cardStore) {
                    return [0, [], 0, []];
                }
                return [
                    cardStore.holeCards.length,
                    cardStore.holeCards.map((h) => (h && 'cards' in h ? h.cards : null)),
                    cardStore.boardCards.length,
                    cardStore.boardCards,
                ];
            },
            () => {
                // Guard against cardStore being undefined
                if (!cardStore) {
                    return;
                }
                // Check if we have at least 2 players with complete hole cards (both cards present)
                const validHoles = cardStore.holeCards.filter(
                    (hole) => {
                        if (!hole || !('cards' in hole)) {
                            return false;
                        }
                        return hole.cards[0] !== null && hole.cards[1] !== null;
                    }
                );

                if (validHoles.length >= 2) {
                    // Trigger calculation - it will cancel any in-flight request
                    this.calculateEquity();
                }
            },
            { fireImmediately: true }
        );
    }

    dispose() {
        if (this.reactionDisposer) {
            this.reactionDisposer();
            this.reactionDisposer = null;
        }
    }

    @action
    reset() {
        // Cancel any in-flight requests
        if (this.currentAbortController) {
            this.currentAbortController.abort();
            this.currentAbortController = null;
        }

        // Clear all results
        this.equityResult = null;
        this.error = null;
        this.isLoading = false;
        this.players = [];
        this.board = [];
        this.dead = [];
        this.samples = 0;
        this.cacheKey = null;
    }

    /**
     * Generate a cache key for the current hand configuration
     */
    private getCacheKey(players: string[], board: string): string {
        return JSON.stringify({ players, board });
    }

    /**
     * Check if we have cached results for the current hand configuration
     */
    private hasCachedResult(currentCacheKey: string): boolean {
        return (
            this.equityResult !== null &&
            this.cacheKey === currentCacheKey &&
            !this.error
        );
    }

    @action
    parseEquityResponse(response: CalculateEquityResponse, cacheKey?: string) {
        // Store the equity result
        this.equityResult = response.equity;

        if (cacheKey) {
            this.cacheKey = cacheKey;
        }

        // Store additional information from the response
        this.players = response.players;
        this.board = response.board;
        this.dead = response.dead;
        this.samples = response.equity.samples;
    }

    @action
    formatPlayerOdds(): string {
        if (!this.equityResult) {
            return "";
        }

        const { win } = this.equityResult;
        const oddsStrings = win.map((winPercentage, index) => {
            const percentage = Math.round(winPercentage * 100);
            return `player ${index + 1}: ${percentage}%`;
        });

        return oddsStrings.join(", ");
    }

    @action
    async calculateEquity() {
        // Guard against cardStore being undefined
        if (!cardStore) {
            return;
        }

        // Cancel any in-flight requests
        if (this.currentAbortController) {
            this.currentAbortController.abort();
            this.currentAbortController = null;
        }

        // Only calculate if we have at least 2 players with complete hole cards (both cards present)
        const validHoles = cardStore.holeCards
            .filter((hole) => {
                if (!hole || !('cards' in hole)) {
                    return false;
                }
                // Only include holes where both cards are non-null
                return hole.cards[0] !== null && hole.cards[1] !== null;
            })
            .map((hole) => hole as { cards: [Card, Card] });

        if (validHoles.length < 2) {
            this.equityResult = null;
            this.error = null;
            this.isLoading = false;
            this.cacheKey = null;
            return;
        }

        // Calculate for valid poker stages:
        // - Pre-flop (0 cards)
        // - Post-flop (3 cards)
        // - Turn (4 cards)
        // - River (5 cards)
        // Skip invalid board sizes (1-2 cards) as these aren't valid poker stages
        const boardCardsCount = cardStore.boardCards.length;
        if (boardCardsCount > 5) {
            // Invalid: board cannot have more than 5 cards
            this.equityResult = null;
            this.isLoading = false;
            this.cacheKey = null;
            return;
        }
        // Note: We allow 0, 3, 4, and 5 cards (valid poker stages)
        // We skip 1-2 cards as they're not valid stages, but the backend will handle validation

        // Convert holes to string format
        const players = validHoles.map(holeToString);

        // Convert board to string format
        const board = boardToString({ cards: cardStore.boardCards });

        // Generate cache key for current hand configuration
        const currentCacheKey = this.getCacheKey(players, board);

        // Check if we already have results for this configuration
        if (this.hasCachedResult(currentCacheKey)) {
            // Results already exist, just update loading state
            this.isLoading = false;
            return;
        }

        // Create a new AbortController for this request
        const abortController = new AbortController();
        this.currentAbortController = abortController;

        // Set loading state
        this.isLoading = true;
        this.error = null;

        try {
            // Use Rust mode for all calculations
            const options = { mode: "rust" as const };

            // Call the API with abort signal
            const result = await pokerService.getHandEquity(
                players,
                board,
                options,
                [],
                abortController.signal
            );

            // Only parse the response if this request wasn't aborted
            if (!abortController.signal.aborted) {
                this.parseEquityResponse(result, currentCacheKey);
            }
        } catch (err) {
            // Don't set error for aborted requests
            if (err instanceof Error && err.name === "AbortError") {
                // Request was cancelled, ignore the error
                return;
            }

            // Only set error if this request wasn't aborted
            if (!abortController.signal.aborted) {
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : "Failed to calculate equity";
                this.error = errorMessage;
                this.equityResult = null;
            }
        } finally {
            // Only update loading state if this is still the current request
            if (this.currentAbortController === abortController) {
                this.isLoading = false;
                this.currentAbortController = null;
            }
        }
    }
}
