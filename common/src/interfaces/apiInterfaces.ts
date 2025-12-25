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
    fromCache?: boolean; // Indicates if the result was retrieved from cache
}

// Outs Calculation API
export interface CalculateOutsRequest {
    hero: string; // Hero's hole cards, e.g., "14h 13h"
    villain: string; // Villain's hole cards, e.g., "9d 9c"
    board: string; // Turn board (4 cards), e.g., "8h 7h 6h 2c"
}

export interface OutCard {
    rank: number;
    suit: number; // 0=c, 1=d, 2=h, 3=s
    category: number; // Hand category: 0=high_card, 1=pair, 2=two_pair, 3=set, 4=straight, 5=flush, etc.
}

export interface OutsSuppressionReason {
    reason: string;
    baseline_win: number;
    baseline_tie: number;
}

export interface CalculateOutsResponse {
    suppressed: OutsSuppressionReason | null;
    win_outs: OutCard[];
    tie_outs: OutCard[];
    baseline_win: number;
    baseline_tie: number;
    baseline_lose: number;
    total_river_cards: number;
    // Friendly format with Card[] instead of OutCard[]
    win_outs_cards?: Card[];
    tie_outs_cards?: Card[];
}

// Error Response (shared format)
export interface ApiErrorResponse {
    error: string;
}

