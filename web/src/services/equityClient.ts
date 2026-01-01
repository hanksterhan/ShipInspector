import { httpClient } from "./fetch";
import { Card } from "@common/interfaces";
import { holeToString, boardToString } from "../components/utilities";

/**
 * EquityClient for calling equity calculation endpoints
 *
 * CONFIGURATION:
 * - To change the endpoint URL, modify the EQUITY_ENDPOINT constant below
 */
const EQUITY_ENDPOINT = "/poker/equity/calculate";

export interface EquityRequest {
    players: string[]; // Array of hole strings like "14h 14d"
    board: string; // Board string like "Kd 9h 2c" or empty string
    options?: {
        mode?: "rust" | "js";
        samples?: number;
    };
    dead?: string[]; // Array of dead card strings
}

export interface EquityResponse {
    equity: {
        win: number[]; // Win percentages per player (0-1)
        tie: number[]; // Tie percentages per player (0-1)
        lose: number[]; // Lose percentages per player (0-1)
        samples: number;
    };
    players: Card[][];
    board: Card[];
    dead: Card[];
    fromCache?: boolean;
}

export class EquityClient {
    /**
     * Calculate equity for given players and board
     */
    async calculateEquity(
        players: Array<[Card, Card]>, // Array of player hole cards
        board: Card[], // Board cards (0-5 cards)
        signal?: AbortSignal
    ): Promise<EquityResponse> {
        // Convert players to string format
        const playersStrings = players.map((hole) =>
            holeToString({ cards: hole })
        );

        // Convert board to string format
        const boardString = boardToString({ cards: board });

        const request: EquityRequest = {
            players: playersStrings,
            board: boardString,
            options: {
                mode: "rust", // Use Rust mode for calculations
            },
            dead: [],
        };

        const response = await httpClient.post(
            EQUITY_ENDPOINT,
            request,
            signal
        );

        return response as EquityResponse;
    }
}

export const equityClient = new EquityClient();
