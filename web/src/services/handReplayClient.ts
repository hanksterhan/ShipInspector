import { httpClient } from "./fetch";
import { Card } from "@common/interfaces";

/**
 * Convert Card to string format (e.g., "14h" for Ace of Hearts)
 */
function cardToString(card: Card): string {
    return `${card.rank}${card.suit}`;
}

/**
 * Convert Card array to string array
 */
function cardsToStrings(cards: (Card | null)[]): string[] {
    return cards.filter((c): c is Card => c !== null).map(cardToString);
}

export interface HandSaveRequest {
    hand: {
        small_blind: number;
        big_blind: number;
        ante?: number;
        button_seat: number;
        table_size: number;
        max_players: number;
        board_cards?: string[];
        meta?: Record<string, any>;
    };
    players: Array<{
        seat: number;
        player_label: string;
        starting_stack: number;
        is_hero?: boolean;
        hole_cards?: string[];
        meta?: Record<string, any>;
    }>;
    actions: Array<{
        action_index: number;
        street: "PREFLOP" | "FLOP" | "TURN" | "RIVER" | "SHOWDOWN";
        type: string;
        actor_seat?: number;
        amount?: number;
        raise_to?: number;
        decision_ms?: number;
        payload?: Record<string, any>;
        tags?: string[];
    }>;
}

export interface HandSaveResponse {
    handId: string;
    message: string;
}

export interface HandForPlayback {
    hand: {
        id: string;
        user_id: string;
        created_at: string;
        table_size: number;
        max_players: number;
        small_blind: number;
        big_blind: number;
        ante: number;
        currency: string;
        button_seat: number;
        board_cards: string[];
        meta: Record<string, any>;
    };
    players: Array<{
        id: string;
        seat: number;
        player_label: string;
        is_hero: boolean;
        starting_stack: number;
        hole_cards: string[];
        meta: Record<string, any>;
    }>;
    actions: Array<{
        id: string;
        action_index: number;
        street: string;
        type: string;
        actor_player_id: string | null;
        amount: number | null;
        raise_to: number | null;
        target_player_id: string | null;
        decision_ms: number | null;
        payload: Record<string, any>;
        tags: Array<{
            id: number;
            key: string;
            description: string | null;
            category: string | null;
        }>;
    }>;
}

/**
 * Client for hand replayer API
 */
export class HandReplayClient {
    /**
     * Save a hand
     */
    async saveHand(request: HandSaveRequest): Promise<HandSaveResponse> {
        return httpClient.post("/api/hands/save", request);
    }

    /**
     * Get a hand for playback
     */
    async getHand(handId: string): Promise<HandForPlayback> {
        return httpClient.get(`/api/hands/${handId}`);
    }

    /**
     * Convert board cards from Card[] to string[]
     */
    static boardCardsToStrings(
        board: [Card | null, Card | null, Card | null, Card | null, Card | null]
    ): string[] {
        return cardsToStrings(board);
    }

    /**
     * Convert hole cards from [Card | null, Card | null] to string[]
     */
    static holeCardsToStrings(hole: [Card | null, Card | null]): string[] {
        return cardsToStrings(hole);
    }
}

export const handReplayClient = new HandReplayClient();
