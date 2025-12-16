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

    private currentAbortController: AbortController | null = null;
    private reactionDisposer: (() => void) | null = null;

    constructor() {
        makeObservable(this);

        // Single centralized reaction that watches for card changes
        // This ensures only one reaction triggers calculations, even if multiple EquityDisplay components exist
        this.reactionDisposer = reaction(
            () => [
                cardStore.holeCards.length,
                cardStore.holeCards.map((h) => (h ? h.cards : null)),
                cardStore.boardCards.length,
                cardStore.boardCards,
            ],
            () => {
                // Check if we have at least 2 players with hole cards
                const validHoles = cardStore.holeCards.filter(
                    (hole) => hole !== undefined && hole !== null
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
    parseEquityResponse(response: CalculateEquityResponse) {
        // Store the equity result
        this.equityResult = response.equity;

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
        // Cancel any in-flight request
        if (this.currentAbortController) {
            this.currentAbortController.abort();
            this.currentAbortController = null;
        }

        // Only calculate if we have at least 2 players with hole cards
        const validHoles = cardStore.holeCards.filter(
            (hole) => hole !== undefined && hole !== null
        );

        if (validHoles.length < 2) {
            this.equityResult = null;
            this.error = null;
            this.isLoading = false;
            return;
        }

        // Create a new AbortController for this request
        const abortController = new AbortController();
        this.currentAbortController = abortController;

        this.isLoading = true;
        this.error = null;

        try {
            // Only calculate for pre-flop (0 cards), full flop (3 cards), turn (4 cards), or river (5 cards)
            // Don't calculate during partial flop selection (1-2 cards)
            const boardCardsCount = cardStore.boardCards.length;
            if (boardCardsCount > 0 && boardCardsCount < 3) {
                this.equityResult = null;
                this.isLoading = false;
                return;
            }

            // Convert holes to string format
            const players = validHoles.map(holeToString);

            // Convert board to string format
            const board = boardToString({ cards: cardStore.boardCards });

            // Use Monte Carlo for pre-flop (empty board), auto mode for other scenarios
            const isPreFlop = boardCardsCount === 0;
            const options = isPreFlop
                ? { mode: "mc" as const, iterations: 50000 }
                : {};

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
                this.parseEquityResponse(result);
            }
        } catch (err) {
            // Don't set error for aborted requests
            if (err instanceof Error && err.name === "AbortError") {
                // Request was cancelled, ignore the error
                return;
            }

            // Only set error if this request wasn't aborted
            if (!abortController.signal.aborted) {
                this.error =
                    err instanceof Error
                        ? err.message
                        : "Failed to calculate equity";
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
