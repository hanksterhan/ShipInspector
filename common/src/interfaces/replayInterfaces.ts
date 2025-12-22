import { Card } from "./handInterfaces";

/**
 * Betting action types in poker
 */
export type BettingActionType =
    | "fold"
    | "check"
    | "call"
    | "bet"
    | "raise"
    | "all-in";

/**
 * A single betting action by a player
 */
export interface BettingAction {
    playerIndex: number;
    action: BettingActionType;
    amount?: number; // Required for bet/raise/all-in
    timestamp?: number; // Optional: for replay timing
}

/**
 * Poker street (round of betting)
 */
export type Street = "preflop" | "flop" | "turn" | "river";

/**
 * Actions and board cards for a specific street
 */
export interface StreetAction {
    street: Street;
    actions: BettingAction[];
    potSize: number; // Pot size at end of street
    boardCards?: Card[]; // Cards revealed on this street (for flop/turn/river)
}

/**
 * Player information in a hand replay
 */
export interface ReplayPlayer {
    index: number; // 0-based player index
    name?: string; // Optional player name
    position: number; // Position at table (0 = button, 1 = small blind, etc.)
    holeCards?: [Card, Card]; // Optional: known hole cards
    stack: number; // Starting stack
    isActive: boolean; // Still in hand
}

/**
 * Dead card information
 */
export interface DeadCard {
    card: Card;
    reason?: string; // Optional: why it's dead (e.g., "mucked", "burned")
}

/**
 * Complete hand replay data structure
 */
export interface HandReplay {
    id?: string; // Database ID (optional for new hands)
    title?: string; // Optional hand title/description
    date?: number; // Timestamp when hand occurred
    createdAt?: number; // When replay was created
    updatedAt?: number; // When replay was last updated

    // Table Configuration
    tableSize: number; // Number of seats (2-10)
    buttonPosition: number; // Button position (0-based)
    smallBlind: number;
    bigBlind: number;

    // Players
    players: ReplayPlayer[];

    // Streets and Actions
    streets: StreetAction[];

    // Cards
    board: Card[]; // Final board cards
    deadCards: DeadCard[]; // Known dead cards

    // Results (optional - can be filled in later)
    winners?: number[]; // Player indices who won
    potDistribution?: { playerIndex: number; amount: number }[];
    showdown?: boolean; // Whether hand went to showdown
}

