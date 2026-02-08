/**
 * GET /api/hands/:id – Retrieve a single hand for playback (SI-9)
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHandler } from "../../api-utils/createHandler";
import type {
    HandForPlayback,
    HandRecord,
    HandPlayerRecord,
    HandActionRecord,
} from "@common/interfaces/handReplayerInterfaces";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getHandler = createHandler(
    { method: "GET", rateLimit: "global" },
    async (req, res, { userId, logger }) => {
        // Extract id from req.params (populated by router)
        const id = (req as any).params?.id;

        // Validate UUID format
        if (!id || !UUID_REGEX.test(id)) {
            res.status(404).json({
                error: "Hand not found",
            });
            return;
        }

        // Use server's Neon client
        const sql = (await import("@lib/database")).default;

        // Execute 3 parallel queries
        const [handRows, playerRows, actionRows] = await Promise.all([
            // Query 1: Get hand record
            sql`
                SELECT * FROM hands
                WHERE id = ${id}
                  AND owner_user_id = ${userId}
                  AND deleted_at IS NULL
            `,
            // Query 2: Get hand players
            sql`
                SELECT * FROM hand_players
                WHERE hand_id = ${id}
                  AND deleted_at IS NULL
                ORDER BY seat_index
            `,
            // Query 3: Get hand actions
            sql`
                SELECT * FROM hand_actions
                WHERE hand_id = ${id}
                  AND deleted_at IS NULL
                ORDER BY sequence_index ASC
            `,
        ]);

        // Return 404 if hand not found (covers ownership, soft-delete, non-existent)
        if (handRows.length === 0) {
            res.status(404).json({
                error: "Hand not found",
            });
            return;
        }

        // Construct HandForPlayback response
        const result: HandForPlayback = {
            hand: handRows[0] as HandRecord,
            players: playerRows as HandPlayerRecord[],
            actions: actionRows as HandActionRecord[],
        };

        logger?.logComplete();
        res.status(200).json(result);
    }
);
