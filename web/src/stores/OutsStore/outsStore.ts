import { action, makeObservable, observable, reaction } from "mobx";
import { CalculateOutsResponse } from "@common/interfaces";
import { pokerBoardStore } from "../index";
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
            () => {
                // Guard against pokerBoardStore being undefined during initialization
                if (!pokerBoardStore) {
                    return [0, [], 0, []];
                }
                // Access observable properties directly so MobX can track them
                const players = pokerBoardStore.players;
                const activePlayers = pokerBoardStore.activePlayers;
                const board = pokerBoardStore.board;

                // Iterate over activePlayers Set to ensure MobX tracks it
                // Access Set.size to ensure MobX tracks Set changes
                const activePlayersSize = activePlayers.size;

                // Create a serializable key that changes when relevant data changes
                // Iterate over the Set to ensure MobX tracks it
                const playerKeys = Array.from(activePlayers)
                    .map((idx) => {
                        const p = players[idx];
                        // Access both cards to ensure MobX tracks them
                        if (!p || !p[0] || !p[1]) return null;
                        return `${idx}:${p[0].rank}${p[0].suit}-${p[1].rank}${p[1].suit}`;
                    })
                    .filter((k) => k !== null)
                    .join("|");

                // Access each board card to ensure MobX tracks them
                const boardKey = board
                    .map((c) => (c ? `${c.rank}${c.suit}` : "null"))
                    .join(",");

                return `${activePlayersSize}|${playerKeys}|${boardKey}`;
            },
            () => {
                // Guard against pokerBoardStore being undefined
                if (!pokerBoardStore) {
                    return;
                }
                // Check if we have exactly 2 active players with complete hole cards (both cards present) and exactly 4 board cards (turn)
                const activePlayersWithHands =
                    pokerBoardStore.getActivePlayersWithCompleteHands();
                const boardCards = pokerBoardStore.getBoardCards();

                console.log("[OutsStore] Reaction fired:", {
                    activePlayersCount: activePlayersWithHands.length,
                    boardCardsCount: boardCards.length,
                    shouldCalculate:
                        activePlayersWithHands.length === 2 &&
                        boardCards.length === 4,
                });

                if (
                    activePlayersWithHands.length === 2 &&
                    boardCards.length === 4
                ) {
                    // Trigger calculation - it will cancel any in-flight request
                    console.log(
                        "[OutsStore] Conditions met, calling calculateOuts()"
                    );
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
        // Guard against pokerBoardStore being undefined
        if (!pokerBoardStore) {
            return;
        }

        // Cancel any in-flight requests
        if (this.currentAbortController) {
            this.currentAbortController.abort();
            this.currentAbortController = null;
        }

        // Only calculate if we have exactly 2 active players with complete hole cards (both cards present) and exactly 4 board cards
        const activePlayersWithHands =
            pokerBoardStore.getActivePlayersWithCompleteHands();

        if (activePlayersWithHands.length !== 2) {
            this.outsResult = null;
            this.error = null;
            this.isLoading = false;
            this.cacheKey = null;
            return;
        }

        const boardCards = pokerBoardStore.getBoardCards();
        if (boardCards.length !== 4) {
            this.outsResult = null;
            this.isLoading = false;
            this.cacheKey = null;
            return;
        }

        // Convert holes to string format (first player is hero, second is villain)
        const hero = holeToString({ cards: activePlayersWithHands[0].cards });
        const villain = holeToString({
            cards: activePlayersWithHands[1].cards,
        });

        // Convert board to string format
        const board = boardToString({ cards: boardCards });

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

        console.log("[OutsStore] calculateOuts called with:", {
            hero,
            villain,
            board,
        });

        try {
            // Call the API with abort signal
            console.log("[OutsStore] Making API call to /poker/outs/calculate");
            const result = await pokerService.getOuts(
                hero,
                villain,
                board,
                abortController.signal
            );
            console.log("[OutsStore] API call successful, result:", result);

            // Only parse the response if this request wasn't aborted
            if (!abortController.signal.aborted) {
                this.outsResult = result;
                this.cacheKey = currentCacheKey;
            }
        } catch (err) {
            console.error("[OutsStore] API call failed:", err);
            // Don't set error for aborted requests
            if (err instanceof Error && err.name === "AbortError") {
                // Request was cancelled, ignore the error
                console.log("[OutsStore] Request was aborted");
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
