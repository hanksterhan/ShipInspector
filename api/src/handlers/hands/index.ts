/**
 * POST /api/hands – Create a hand (SI-7)
 * Validates body with Zod, requires Clerk auth, inserts hand + players + actions in a transaction.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { createHandler } from "../../../utils/createHandler";

const VALID_ACTION_TAGS = [
    "tanked",
    "snap",
    "all_in",
    "showed_1",
    "showed_2",
    "mucked",
    "table_talk",
    "misclick",
] as const;

const streetSchema = z.enum(["preflop", "flop", "turn", "river"]);

const actionTypeSchema = z.enum([
    "POST_SB",
    "POST_BB",
    "POST_ANTE",
    "STRADDLE",
    "FOLD",
    "CHECK",
    "CALL",
    "BET",
    "RAISE",
    "ALL_IN",
    "REVEAL",
    "DEAL_FLOP",
    "DEAL_TURN",
    "DEAL_RIVER",
    "COLLECT",
    "NOTE",
]);

const createHandRequestSchema = z.object({
    hand: z.object({
        table_size: z.number().int().min(2).max(10),
        button_seat: z.number().int().min(0),
        small_blind: z.number().int().positive(),
        big_blind: z.number().int().positive(),
        ante: z.number().int().min(0),
        board_flop_1: z.string().nullable().optional(),
        board_flop_2: z.string().nullable().optional(),
        board_flop_3: z.string().nullable().optional(),
        board_turn: z.string().nullable().optional(),
        board_river: z.string().nullable().optional(),
    }),
    players: z.array(
        z.object({
            seat_index: z.number().int().min(0).max(9),
            display_name: z.string(),
            stack_at_start: z.number().int().positive(),
            is_hero: z.boolean(),
            showdown_card_1: z.string().nullable().optional(),
            showdown_card_2: z.string().nullable().optional(),
        })
    ),
    actions: z.array(
        z.object({
            sequence_index: z.number().int().min(0),
            street: streetSchema,
            actor_seat: z.number().int().min(0).max(9).nullable().optional(),
            action_type: actionTypeSchema,
            amount: z.number().int().nullable().optional(),
            raise_to: z.number().int().nullable().optional(),
            decision_ms: z.number().int().nullable().optional(),
            tags: z.array(z.enum(VALID_ACTION_TAGS)),
        })
    ),
});

export type CreateHandRequest = z.infer<typeof createHandRequestSchema>;

export const handler = createHandler(
    { method: "POST", rateLimit: "global" },
    async (req, res, { userId, logger }) => {
        const parseResult = createHandRequestSchema.safeParse(
            typeof req.body === "object" ? req.body : undefined
        );

        if (!parseResult.success) {
            res.status(400).json({
                error: "Validation failed",
                details: parseResult.error.flatten(),
            });
            return;
        }

        const body = parseResult.data;
        const handId = crypto.randomUUID();
        const now = Date.now();

        // Use server's Neon client for transactional insert
        const sql = (await import("../../../../server/src/config/database")).default;

        const hand = body.hand;
        // Constrain button_seat < table_size
        if (hand.button_seat >= hand.table_size) {
            res.status(400).json({
                error: "Validation failed",
                details: { fieldErrors: { "hand.button_seat": ["must be less than table_size"] } },
            });
            return;
        }

        await sql.transaction([
            sql`
                INSERT INTO hands (
                    id, owner_user_id, table_size, button_seat, small_blind, big_blind, ante,
                    board_flop_1, board_flop_2, board_flop_3, board_turn, board_river,
                    created_at, updated_at, deleted_at
                ) VALUES (
                    ${handId}, ${userId}, ${hand.table_size}, ${hand.button_seat},
                    ${hand.small_blind}, ${hand.big_blind}, ${hand.ante},
                    ${hand.board_flop_1 ?? null}, ${hand.board_flop_2 ?? null}, ${hand.board_flop_3 ?? null},
                    ${hand.board_turn ?? null}, ${hand.board_river ?? null},
                    ${now}, null, null
                )
            `,
            ...body.players.map((p) =>
                sql`
                    INSERT INTO hand_players (
                        id, hand_id, seat_index, display_name, stack_at_start, is_hero,
                        showdown_card_1, showdown_card_2, created_at, updated_at, deleted_at
                    ) VALUES (
                        ${crypto.randomUUID()}, ${handId}, ${p.seat_index}, ${p.display_name},
                        ${p.stack_at_start}, ${p.is_hero},
                        ${p.showdown_card_1 ?? null}, ${p.showdown_card_2 ?? null},
                        ${now}, null, null
                    )
                `
            ),
            ...body.actions.map((a) =>
                sql`
                    INSERT INTO hand_actions (
                        id, hand_id, sequence_index, street, actor_seat, action_type,
                        amount, raise_to, decision_ms, tags, created_at, updated_at, deleted_at
                    ) VALUES (
                        ${crypto.randomUUID()}, ${handId}, ${a.sequence_index}, ${a.street},
                        ${a.actor_seat ?? null}, ${a.action_type},
                        ${a.amount ?? null}, ${a.raise_to ?? null}, ${a.decision_ms ?? null},
                        ${(a.tags as string[]) || []},
                        ${now}, null, null
                    )
                `
            ),
        ]);

        logger?.logComplete();
        res.status(201).json({ hand_id: handId });
    }
);
