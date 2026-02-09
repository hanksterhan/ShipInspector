/**
 * GET /api/hands – List hands with cursor-based pagination (SI-8)
 * Supports filtering by stakes and date range.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { createHandler } from "../../api-utils/createHandler";

// Query parameter schema
const listHandsQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
    cursor: z.string().optional(),
    minStakes: z.coerce.number().int().positive().optional(),
    maxStakes: z.coerce.number().int().positive().optional(),
    startDate: z.coerce.number().int().positive().optional(),
    endDate: z.coerce.number().int().positive().optional(),
}).refine(
    (data) => {
        if (data.minStakes !== undefined && data.maxStakes !== undefined) {
            return data.minStakes <= data.maxStakes;
        }
        return true;
    },
    { message: "minStakes must be less than or equal to maxStakes" }
);

interface CursorData {
    t: number; // created_at timestamp
    i: string; // id
}

/**
 * Encodes cursor from the last item's created_at and id
 */
function encodeCursor(createdAt: number, id: string): string {
    return Buffer.from(JSON.stringify({ t: createdAt, i: id })).toString('base64');
}

/**
 * Decodes cursor, returns null if invalid
 */
function decodeCursor(cursor: string): CursorData | null {
    try {
        const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
        if (typeof decoded.t !== 'number' || typeof decoded.i !== 'string') {
            return null;
        }
        return decoded;
    } catch {
        return null;
    }
}

export const listHandler = createHandler(
    { method: "GET", rateLimit: "global" },
    async (req, res, { userId, logger }) => {
        // Validate query parameters
        const parseResult = listHandsQuerySchema.safeParse(req.query);

        if (!parseResult.success) {
            res.status(400).json({
                error: "Validation failed",
                details: parseResult.error.flatten(),
            });
            return;
        }

        const { limit, cursor, minStakes, maxStakes, startDate, endDate } = parseResult.data;

        // Decode cursor if provided
        let cursorData: CursorData | null = null;
        if (cursor) {
            cursorData = decodeCursor(cursor);
            if (!cursorData) {
                res.status(400).json({
                    error: "Invalid cursor",
                });
                return;
            }
        }

        // Use server's Neon client
        const sql = (await import("@lib/database")).default;

        // Build dynamic query with conditions
        let query = sql`
            SELECT
                id,
                table_size,
                button_seat,
                small_blind,
                big_blind,
                ante,
                board_flop_1,
                board_flop_2,
                board_flop_3,
                board_turn,
                board_river,
                created_at
            FROM hands
            WHERE owner_user_id = ${userId}
              AND deleted_at IS NULL
        `;

        // Add cursor condition (created_at, id) < (cursorT, cursorI)
        if (cursorData) {
            query = sql`${query} AND (created_at, id) < (${cursorData.t}, ${cursorData.i})`;
        }

        // Add stake filters
        if (minStakes !== undefined) {
            query = sql`${query} AND big_blind >= ${minStakes}`;
        }
        if (maxStakes !== undefined) {
            query = sql`${query} AND big_blind <= ${maxStakes}`;
        }

        // Add date filters
        if (startDate !== undefined) {
            query = sql`${query} AND created_at >= ${startDate}`;
        }
        if (endDate !== undefined) {
            query = sql`${query} AND created_at <= ${endDate}`;
        }

        // Add ORDER BY and LIMIT
        query = sql`${query} ORDER BY created_at DESC, id DESC LIMIT ${limit + 1}`;

        // Fetch limit + 1 to detect if there are more results
        const dbStart = Date.now();
        const rows = await query;
        const dbQueryTimeMs = Date.now() - dbStart;

        // Determine if there are more results
        const hasMore = rows.length > limit;
        const hands = hasMore ? rows.slice(0, limit) : rows;

        // Generate nextCursor from last item if there are more results
        let nextCursor: string | null = null;
        if (hasMore && hands.length > 0) {
            const lastHand = hands[hands.length - 1];
            nextCursor = encodeCursor(lastHand.created_at, lastHand.id);
        }

        logger.logComplete(200, { dbQueryTimeMs, handCount: hands.length });
        res.status(200).json({
            hands,
            nextCursor,
        });
    }
);
