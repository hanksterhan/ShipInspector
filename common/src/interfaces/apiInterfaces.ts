import { HandRank, EquityOptions, Card } from "./index";

/**
 * API Request/Response interfaces for poker endpoints
 * These are shared between client and server to ensure type safety
 */

// Hand Evaluation API
export interface EvaluateHandRequest {
    hole: string; // e.g., "14h 14d"
    board?: string; // e.g., "12h 11h 10h" (optional, can be empty string)
}

export interface EvaluateHandResponse {
    handRank: HandRank;
    hole: Card[];
    board: Card[];
}

// Hand Comparison API
export interface CompareHandsRequest {
    hole1: string;
    hole2: string;
    board?: string;
}

export interface CompareHandsResponse {
    hand1: {
        hole: Card[];
        rank: HandRank;
    };
    hand2: {
        hole: Card[];
        rank: HandRank;
    };
    comparison: {
        result: "hand1_wins" | "hand2_wins" | "tie";
        value: number; // 1 if hand1 wins, -1 if hand2 wins, 0 if tie
    };
}

// Equity Calculation API
export interface CalculateEquityRequest {
    players: string[]; // Array of hole card strings, e.g., ["14h 14d", "13h 13d"]
    board?: string;
    options?: EquityOptions;
    dead?: string[]; // Array of card strings, e.g., ["9h", "8h"]
}

export interface CalculateEquityResponse {
    equity: {
        win: number[];
        tie: number[];
        lose: number[];
        samples: number;
    };
    players: Card[][];
    board: Card[];
    dead: Card[];
}

// Error Response (shared format)
export interface ApiErrorResponse {
    error: string;
}

