// Street types
export type Street = 'preflop' | 'flop' | 'turn' | 'river';

// Action types (from HAND_REPLAYER_README.md)
export type ActionType =
    | 'POST_SB' | 'POST_BB' | 'POST_ANTE' | 'STRADDLE'
    | 'FOLD' | 'CHECK' | 'CALL' | 'BET' | 'RAISE' | 'ALL_IN'
    | 'REVEAL'
    | 'DEAL_FLOP' | 'DEAL_TURN' | 'DEAL_RIVER'
    | 'COLLECT'
    | 'NOTE';

// Valid action tags
export const VALID_ACTION_TAGS = [
    'tanked',
    'snap',
    'all_in',
    'showed_1',
    'showed_2',
    'mucked',
    'table_talk',
    'misclick'
] as const;
export type ActionTag = typeof VALID_ACTION_TAGS[number];

// Database record interfaces
export interface HandRecord {
    id: string; // UUID
    owner_user_id: string;
    table_size: number; // 2-10
    button_seat: number; // 0 to table_size-1
    small_blind: number; // cents/smallest unit
    big_blind: number; // cents/smallest unit
    ante: number; // cents/smallest unit
    board_flop_1: string | null; // Card format: "14h" (Ace of hearts), "2c" (2 of clubs)
    board_flop_2: string | null;
    board_flop_3: string | null;
    board_turn: string | null;
    board_river: string | null;
    created_at: number; // BIGINT timestamp (milliseconds)
    updated_at: number | null;
    deleted_at: number | null;
}

export interface HandPlayerRecord {
    id: string; // UUID
    hand_id: string; // UUID (FK to hands.id)
    seat_index: number; // 0-9
    display_name: string;
    stack_at_start: number; // cents/smallest unit
    is_hero: boolean;
    showdown_card_1: string | null; // Card format: "14h", "2c", etc.
    showdown_card_2: string | null;
    created_at: number; // BIGINT timestamp (milliseconds)
    updated_at: number | null;
    deleted_at: number | null;
}

export interface HandActionRecord {
    id: string; // UUID
    hand_id: string; // UUID (FK to hands.id)
    sequence_index: number; // 0-based ordering
    street: Street;
    actor_seat: number | null; // seat_index or null for dealer actions
    action_type: ActionType;
    amount: number | null; // cents/smallest unit
    raise_to: number | null; // cents/smallest unit
    decision_ms: number | null; // milliseconds
    tags: ActionTag[]; // Array of tags
    created_at: number; // BIGINT timestamp (milliseconds)
    updated_at: number | null;
    deleted_at: number | null;
}

// API request/response interfaces
export interface HandSaveRequest {
    hand: {
        table_size: number;
        button_seat: number;
        small_blind: number;
        big_blind: number;
        ante: number;
        board_flop_1?: string | null;
        board_flop_2?: string | null;
        board_flop_3?: string | null;
        board_turn?: string | null;
        board_river?: string | null;
    };
    players: Array<{
        seat_index: number;
        display_name: string;
        stack_at_start: number;
        is_hero: boolean;
        showdown_card_1?: string | null;
        showdown_card_2?: string | null;
    }>;
    actions: Array<{
        sequence_index: number;
        street: Street;
        actor_seat?: number | null;
        action_type: ActionType;
        amount?: number | null;
        raise_to?: number | null;
        decision_ms?: number | null;
        tags: ActionTag[];
    }>;
}

export interface HandForPlayback {
    hand: HandRecord;
    players: HandPlayerRecord[];
    actions: HandActionRecord[];
}
