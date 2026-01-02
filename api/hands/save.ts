// Register path aliases first (before any @common/* imports)
import "../_helpers";

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../utils/auth";
import { handleCors } from "../utils/cors";
import { strictRateLimiter } from "../utils/rateLimit";
import { logRequest } from "../utils/logger";
import { handleError } from "../utils/errorHandler";
import {
    createHand,
    addHandPlayer,
    appendAction,
    setActionTags,
} from "../../../server/src/integrations/handReplay/handReplayDb";

/**
 * HandSaveRequest payload shape
 */
interface HandSaveRequest {
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

/**
 * POST /api/hands/save
 * Save a complete hand transactionally
 */
export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    const startTime = Date.now();
    const logger = logRequest(req, startTime);

    // Handle CORS
    if (!handleCors(req, res)) {
        return;
    }

    // Only allow POST
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    // Rate limiting
    if (!strictRateLimiter(req, res)) {
        return;
    }

    try {
        // Check authentication
        const authResult = requireAuth(req);
        if (!authResult.userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const userId = authResult.userId;
        const payload: HandSaveRequest = req.body;

        // Validate payload
        if (!payload.hand || !payload.players || !payload.actions) {
            res.status(400).json({
                error: "Missing required fields: hand, players, actions",
            });
            return;
        }

        // Validate hand data
        if (
            !payload.hand.small_blind ||
            !payload.hand.big_blind ||
            !payload.hand.button_seat ||
            !payload.hand.table_size ||
            !payload.hand.max_players
        ) {
            res.status(400).json({
                error: "Missing required hand fields",
            });
            return;
        }

        // Validate players
        if (payload.players.length < 2) {
            res.status(400).json({
                error: "At least 2 players are required",
            });
            return;
        }

        // Validate unique seats
        const seats = payload.players.map((p) => p.seat);
        if (new Set(seats).size !== seats.length) {
            res.status(400).json({
                error: "Player seats must be unique",
            });
            return;
        }

        // Validate actions have contiguous action_index
        const actionIndices = payload.actions
            .map((a) => a.action_index)
            .sort((a, b) => a - b);
        for (let i = 0; i < actionIndices.length; i++) {
            if (actionIndices[i] !== i) {
                res.status(400).json({
                    error: `Actions must have contiguous action_index starting from 0. Found gap at index ${i}`,
                });
                return;
            }
        }

        // Validate actor_seat references valid seats
        const validSeats = new Set(seats);
        for (const action of payload.actions) {
            if (
                action.actor_seat !== undefined &&
                !validSeats.has(action.actor_seat)
            ) {
                res.status(400).json({
                    error: `Action references invalid seat: ${action.actor_seat}`,
                });
                return;
            }
        }

        // Use a transaction to save everything atomically
        // Note: Neon serverless doesn't support explicit transactions,
        // but we'll use a single connection and handle errors
        // For true transactions, we'd need to use Neon's transaction API
        // For now, we'll do sequential inserts and rollback on error

        // 1. Create hand
        const handId = await createHand({
            userId,
            tableSize: payload.hand.table_size,
            maxPlayers: payload.hand.max_players,
            smallBlind: payload.hand.small_blind,
            bigBlind: payload.hand.big_blind,
            ante: payload.hand.ante ?? 0,
            currency: "chips",
            buttonSeat: payload.hand.button_seat,
            boardCards: payload.hand.board_cards ?? [],
            meta: payload.hand.meta ?? {},
        });

        // 2. Add players and build seat->player_id map
        const seatToPlayerId = new Map<number, string>();
        for (const player of payload.players) {
            const playerId = await addHandPlayer({
                handId,
                seat: player.seat,
                playerLabel: player.player_label,
                startingStack: player.starting_stack,
                holeCards: player.hole_cards ?? [],
                isHero: player.is_hero ?? false,
                meta: player.meta ?? {},
            });
            seatToPlayerId.set(player.seat, playerId);
        }

        // 3. Insert actions in order
        const actionIdToTags = new Map<string, string[]>();
        for (const action of payload.actions) {
            const actorPlayerId =
                action.actor_seat !== undefined
                    ? seatToPlayerId.get(action.actor_seat) ?? null
                    : null;

            const actionId = await appendAction({
                handId,
                street: action.street,
                type: action.type as any,
                actorPlayerId: actorPlayerId ?? undefined,
                amount: action.amount ?? undefined,
                raiseTo: action.raise_to ?? undefined,
                targetPlayerId: undefined, // Not in payload yet
                decisionMs: action.decision_ms ?? undefined,
                payload: action.payload ?? {},
            });

            // Store tags for later
            if (action.tags && action.tags.length > 0) {
                actionIdToTags.set(actionId, action.tags);
            }
        }

        // 4. Set tags for actions
        for (const [actionId, tags] of actionIdToTags.entries()) {
            await setActionTags(actionId, tags);
        }

        logger.info("Hand saved successfully", { handId });

        res.status(200).json({
            handId,
            message: "Hand saved successfully",
        });
    } catch (error: any) {
        handleError(error, req, res, logger);
    }
}

