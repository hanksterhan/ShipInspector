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
        // Only calculate if we have at least 2 players with hole cards
        const validHoles = cardStore.holeCards.filter(
            (hole) => hole !== undefined && hole !== null
        );

        if (validHoles.length < 2) {
            this.equityResult = null;
            this.error = null;
            return;
        }

        this.isLoading = true;
        this.error = null;

        try {
            // Convert holes to string format
            const players = validHoles.map(holeToString);

            // Convert board to string format
            const board = boardToString({ cards: cardStore.boardCards });

            // Call the API
            const result = await pokerService.getHandEquity(players, board);

            // Parse the response
            this.parseEquityResponse(result);
        } catch (err) {
            this.error =
                err instanceof Error
                    ? err.message
                    : "Failed to calculate equity";
            this.equityResult = null;
        } finally {
            this.isLoading = false;
        }
    }
}
