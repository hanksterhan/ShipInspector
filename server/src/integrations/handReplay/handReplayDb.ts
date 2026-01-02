import sql from "../../config/database";

// Types matching the database schema
export type Street = "PREFLOP" | "FLOP" | "TURN" | "RIVER" | "SHOWDOWN";

export type ActionType =
    | "POST_SB"
    | "POST_BB"
    | "POST_ANTE"
    | "STRADDLE"
    | "FOLD"
    | "CHECK"
    | "CALL"
    | "BET"
    | "RAISE"
    | "ALL_IN"
    | "REVEAL"
    | "DEAL_FLOP"
    | "DEAL_TURN"
    | "DEAL_RIVER"
    | "COLLECT"
    | "NOTE";

export interface CreateHandParams {
    userId: string;
    tableSize: number;
    maxPlayers: number;
    smallBlind: number;
    bigBlind: number;
    ante?: number;
    currency?: string;
    buttonSeat: number;
    boardCards?: string[];
    meta?: Record<string, any>;
}

export interface AddPlayerParams {
    handId: string;
    seat: number;
    playerLabel: string;
    startingStack: number;
    holeCards?: string[];
    isHero?: boolean;
    meta?: Record<string, any>;
}

export interface AppendActionParams {
    handId: string;
    street: Street;
    type: ActionType;
    actorPlayerId?: string | null;
    amount?: number | null;
    raiseTo?: number | null;
    targetPlayerId?: string | null;
    decisionMs?: number | null;
    payload?: Record<string, any>;
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
        street: Street;
        type: ActionType;
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
 * Create a new hand
 */
export async function createHand(params: CreateHandParams): Promise<string> {
    const result = await sql`
        INSERT INTO hands (
            user_id,
            table_size,
            max_players,
            small_blind,
            big_blind,
            ante,
            currency,
            button_seat,
            board_cards,
            meta
        ) VALUES (
            ${params.userId}::uuid,
            ${params.tableSize},
            ${params.maxPlayers},
            ${params.smallBlind},
            ${params.bigBlind},
            ${params.ante ?? 0},
            ${params.currency ?? "chips"},
            ${params.buttonSeat},
            ${params.boardCards ?? []},
            ${JSON.stringify(params.meta ?? {})}::jsonb
        )
        RETURNING id
    `;

    if (!result || result.length === 0) {
        throw new Error("Failed to create hand");
    }

    return result[0].id;
}

/**
 * Add a player to a hand
 */
export async function addHandPlayer(params: AddPlayerParams): Promise<string> {
    const result = await sql`
        INSERT INTO hand_players (
            hand_id,
            seat,
            player_label,
            is_hero,
            starting_stack,
            hole_cards,
            meta
        ) VALUES (
            ${params.handId}::uuid,
            ${params.seat},
            ${params.playerLabel},
            ${params.isHero ?? false},
            ${params.startingStack},
            ${params.holeCards ?? []},
            ${JSON.stringify(params.meta ?? {})}::jsonb
        )
        RETURNING id
    `;

    if (!result || result.length === 0) {
        throw new Error("Failed to add player to hand");
    }

    return result[0].id;
}

/**
 * Append an action to a hand with safe action_index assignment
 * Uses a subquery to get the next action_index atomically
 */
export async function appendAction(
    params: AppendActionParams
): Promise<string> {
    // Get the next action_index atomically using a subquery
    // The unique constraint on (hand_id, action_index) will prevent race conditions
    // Use a CTE to handle the case when no actions exist yet
    const result = await sql`
        WITH next_index AS (
            SELECT COALESCE(MAX(action_index), -1) + 1 AS idx
            FROM hand_actions
            WHERE hand_id = ${params.handId}::uuid
        )
        INSERT INTO hand_actions (
            hand_id,
            action_index,
            street,
            actor_player_id,
            type,
            amount,
            raise_to,
            target_player_id,
            decision_ms,
            payload
        )
        SELECT
            ${params.handId}::uuid,
            idx,
            ${params.street}::street,
            ${params.actorPlayerId ? params.actorPlayerId : null}::uuid,
            ${params.type}::action_type,
            ${params.amount ?? null},
            ${params.raiseTo ?? null},
            ${params.targetPlayerId ? params.targetPlayerId : null}::uuid,
            ${params.decisionMs ?? null},
            ${JSON.stringify(params.payload ?? {})}::jsonb
        FROM next_index
        RETURNING id
    `;

    if (!result || result.length === 0) {
        throw new Error("Failed to append action to hand");
    }

    return result[0].id;
}

/**
 * Set tags for an action (upsert mapping)
 */
export async function setActionTags(
    actionId: string,
    tagKeys: string[]
): Promise<void> {
    // First, get tag IDs for the provided keys
    const tagsWithKeys = await sql`
        SELECT id, key FROM action_tags
        WHERE key = ANY(${tagKeys})
    `;

    const foundKeySet = new Set(tagsWithKeys.map((t) => t.key));
    const missingKeys = tagKeys.filter((k) => !foundKeySet.has(k));

    if (missingKeys.length > 0) {
        throw new Error(
            `Tags not found: ${missingKeys.join(", ")}. Available tags must be created first.`
        );
    }

    const tagIds = tagsWithKeys.map((t) => t.id);

    // Delete existing tags for this action
    await sql`
        DELETE FROM hand_action_tag_map
        WHERE hand_action_id = ${actionId}::uuid
    `;

    // Insert new tags
    if (tagIds.length > 0) {
        // Insert tags one by one (Neon serverless handles arrays differently)
        for (const tagId of tagIds) {
            await sql`
                INSERT INTO hand_action_tag_map (hand_action_id, tag_id)
                VALUES (${actionId}::uuid, ${tagId})
                ON CONFLICT DO NOTHING
            `;
        }
    }
}

/**
 * Fetch a hand for playback with all related data
 * Returns a single JSON object with hand, players, and actions
 */
export async function getHandForPlayback(
    handId: string
): Promise<HandForPlayback | null> {
    // First, get the hand
    const handResult = await sql`
        SELECT
            id,
            user_id,
            created_at,
            table_size,
            max_players,
            small_blind,
            big_blind,
            ante,
            currency,
            button_seat,
            board_cards,
            meta
        FROM hands
        WHERE id = ${handId}::uuid
    `;

    if (!handResult || handResult.length === 0) {
        return null;
    }

    const hand = handResult[0];

    // Get players ordered by seat
    const playersResult = await sql`
        SELECT
            id,
            seat,
            player_label,
            is_hero,
            starting_stack,
            hole_cards,
            meta
        FROM hand_players
        WHERE hand_id = ${handId}::uuid
        ORDER BY seat
    `;

    // Get actions with tags, ordered by action_index
    const actionsResult = await sql`
        SELECT
            ha.id,
            ha.action_index,
            ha.street,
            ha.type,
            ha.actor_player_id,
            ha.amount,
            ha.raise_to,
            ha.target_player_id,
            ha.decision_ms,
            ha.payload,
            COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        'id', at.id,
                        'key', at.key,
                        'description', at.description,
                        'category', at.category
                    )
                    ORDER BY at.id
                ) FILTER (WHERE at.id IS NOT NULL),
                '[]'::jsonb
            ) AS tags
        FROM hand_actions ha
        LEFT JOIN hand_action_tag_map hatm ON ha.id = hatm.hand_action_id
        LEFT JOIN action_tags at ON hatm.tag_id = at.id
        WHERE ha.hand_id = ${handId}::uuid
        GROUP BY ha.id, ha.action_index, ha.street, ha.type, ha.actor_player_id,
                 ha.amount, ha.raise_to, ha.target_player_id, ha.decision_ms, ha.payload
        ORDER BY ha.action_index
    `;

    return {
        hand: {
            id: hand.id,
            user_id: hand.user_id,
            created_at: hand.created_at.toISOString(),
            table_size: hand.table_size,
            max_players: hand.max_players,
            small_blind: Number(hand.small_blind),
            big_blind: Number(hand.big_blind),
            ante: Number(hand.ante),
            currency: hand.currency,
            button_seat: hand.button_seat,
            board_cards: hand.board_cards || [],
            meta: hand.meta || {},
        },
        players: playersResult.map((p) => ({
            id: p.id,
            seat: p.seat,
            player_label: p.player_label,
            is_hero: p.is_hero,
            starting_stack: Number(p.starting_stack),
            hole_cards: p.hole_cards || [],
            meta: p.meta || {},
        })),
        actions: actionsResult.map((a) => ({
            id: a.id,
            action_index: a.action_index,
            street: a.street as Street,
            type: a.type as ActionType,
            actor_player_id: a.actor_player_id,
            amount: a.amount ? Number(a.amount) : null,
            raise_to: a.raise_to ? Number(a.raise_to) : null,
            target_player_id: a.target_player_id,
            decision_ms: a.decision_ms ? Number(a.decision_ms) : null,
            payload: a.payload || {},
            tags: a.tags || [],
        })),
    };
}

/**
 * Get all available action tags
 */
export async function getActionTags(): Promise<
    Array<{
        id: number;
        key: string;
        description: string | null;
        category: string | null;
    }>
> {
    const result = await sql`
        SELECT id, key, description, category
        FROM action_tags
        ORDER BY key
    `;

    return result;
}
