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

    // Track which scenario this result is for
    private cacheKey: string | null = null;
    private currentAbortController: AbortController | null = null;
    private reactionDisposer: (() => void) | null = null;

    constructor() {
        makeObservable(this);

        // Watch for card changes - only calculate outs on the turn (4 board cards)
        this.reactionDisposer = reaction(
            () => [
                cardStore.holeCards.length,
                cardStore.holeCards.map((h) => (h ? h.cards : null)),
                cardStore.boardCards.length,
                cardStore.boardCards,
            ],
            () => {
                // Only calculate outs if:
                // 1. We have exactly 2 players (heads-up)
                // 2. Board has exactly 4 cards (turn)
                const validHoles = cardStore.holeCards.filter(
                    (hole) => hole !== undefined && hole !== null
                );

                if (
                    validHoles.length === 2 &&
                    cardStore.boardCards.length === 4
                ) {
                    // Trigger calculation
                    this.calculateOuts();
                } else {
                    // Clear outs if conditions not met
                    this.clearOuts();
                }
            },
            { fireImmediately: true }
        );
    }

    dispose() {
        if (this.reactionDisposer) {
            this.reactionDisposer();
        }
    }

    @action
    clearOuts() {
        this.outsResult = null;
        this.error = null;
        this.cacheKey = null;
    }

    @action
    setLoading(loading: boolean) {
        this.isLoading = loading;
    }

    @action
    setError(error: string | null) {
        this.error = error;
    }

    @action
    setOutsResult(result: CalculateOutsResponse | null) {
        this.outsResult = result;
    }

    /**
     * Calculate outs for the current turn scenario
     */
    @action
    async calculateOuts() {
        // Get valid hole cards
        const validHoles = cardStore.holeCards.filter(
            (hole) => hole !== undefined && hole !== null
        );

        // Check if we have exactly 2 players and 4 board cards
        if (validHoles.length !== 2 || cardStore.boardCards.length !== 4) {
            this.clearOuts();
            return;
        }

        const hero = validHoles[0];
        const villain = validHoles[1];
        const board = { cards: cardStore.boardCards };

        // Generate cache key
        const newCacheKey = `${holeToString(hero)}-${holeToString(villain)}-${boardToString(board)}`;

        // Check if we already have the result for this exact scenario
        if (this.cacheKey === newCacheKey && this.outsResult) {
            console.log("Using cached outs result");
            return;
        }

        // Cancel any pending request
        if (this.currentAbortController) {
            this.currentAbortController.abort();
        }

        // Create new abort controller
        this.currentAbortController = new AbortController();

        this.setLoading(true);
        this.setError(null);

        try {
            const response = await pokerService.calculateOuts(
                holeToString(hero),
                holeToString(villain),
                boardToString(board),
                this.currentAbortController.signal
            );

            // Only update if this is still the current request
            if (this.cacheKey !== newCacheKey) {
                this.setOutsResult(response);
                this.cacheKey = newCacheKey;
            }
        } catch (error: any) {
            if (error.name === "AbortError") {
                // Request was cancelled, ignore
                console.log("Outs calculation aborted");
            } else {
                console.error("Error calculating outs:", error);
                this.setError(error.message || "Failed to calculate outs");
            }
        } finally {
            this.setLoading(false);
            this.currentAbortController = null;
        }
    }
}

export const outsStore = new OutsStore();
