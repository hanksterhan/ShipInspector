import { action, makeObservable, observable } from "mobx";
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

    constructor() {
        makeObservable(this);
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
            // Convert holes to string format
            const players = validHoles.map(holeToString);

            // Convert board to string format
            const board = boardToString({ cards: cardStore.boardCards });

            // Call the API with abort signal
            const result = await pokerService.getHandEquity(
                players,
                board,
                {},
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
