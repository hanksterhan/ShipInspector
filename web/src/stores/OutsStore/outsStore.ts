import { action, makeObservable, observable, reaction } from "mobx";
import { CalculateOutsResponse } from "@common/interfaces";
import { cardStore } from "../index";
import { pokerService } from "../../services/index";
import { holeToString, boardToString } from "../../components/utilities";

export class OutsStore {
    @observable
    outsResult: CalculateOutsResponse | null = null;

    @observable
    isLoading: boolean = false;

    @observable
    error: string | null = null;

    // Cache key to track which hand configuration this result is for
    private cacheKey: string | null = null;

    private currentAbortController: AbortController | null = null;
    private reactionDisposer: (() => void) | null = null;

    constructor() {
        makeObservable(this);

        // Watch for card changes - only calculate when we have exactly 4 board cards (turn)
        this.reactionDisposer = reaction(
            () => [
                cardStore.holeCards.length,
                cardStore.holeCards.map((h) => (h ? h.cards : null)),
                cardStore.boardCards.length,
                cardStore.boardCards,
            ],
            () => {
                // Check if we have exactly 2 players with hole cards and exactly 4 board cards (turn)
                const validHoles = cardStore.holeCards.filter(
                    (hole) => hole !== undefined && hole !== null
                );

                if (
                    validHoles.length === 2 &&
                    cardStore.boardCards.length === 4
                ) {
                    // Trigger calculation - it will cancel any in-flight request
                    this.calculateOuts();
                } else {
                    // Clear results if conditions aren't met
                    this.reset();
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
        this.outsResult = null;
        this.error = null;
        this.isLoading = false;
        this.cacheKey = null;
    }

    /**
     * Generate a cache key for the current hand configuration
     */
    private getCacheKey(hero: string, villain: string, board: string): string {
        return JSON.stringify({ hero, villain, board });
    }

    /**
     * Check if we have cached results for the current hand configuration
     */
    private hasCachedResult(currentCacheKey: string): boolean {
        return (
            this.outsResult !== null &&
            this.cacheKey === currentCacheKey &&
            !this.error
        );
    }

    @action
    async calculateOuts() {
        // Cancel any in-flight requests
        if (this.currentAbortController) {
            this.currentAbortController.abort();
            this.currentAbortController = null;
        }

        // Only calculate if we have exactly 2 players with hole cards and exactly 4 board cards
        const validHoles = cardStore.holeCards.filter(
            (hole) => hole !== undefined && hole !== null
        );

        if (validHoles.length !== 2) {
            this.outsResult = null;
            this.error = null;
            this.isLoading = false;
            this.cacheKey = null;
            return;
        }

        const boardCardsCount = cardStore.boardCards.length;
        if (boardCardsCount !== 4) {
            this.outsResult = null;
            this.isLoading = false;
            this.cacheKey = null;
            return;
        }

        // Convert holes to string format
        const hero = holeToString(validHoles[0]);
        const villain = holeToString(validHoles[1]);

        // Convert board to string format
        const board = boardToString({ cards: cardStore.boardCards });

        // Generate cache key for current hand configuration
        const currentCacheKey = this.getCacheKey(hero, villain, board);

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
            // Call the API with abort signal
            const result = await pokerService.getOuts(
                hero,
                villain,
                board,
                abortController.signal
            );

            // Only parse the response if this request wasn't aborted
            if (!abortController.signal.aborted) {
                this.outsResult = result;
                this.cacheKey = currentCacheKey;
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
                        : "Failed to calculate outs";
                this.error = errorMessage;
                this.outsResult = null;
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
