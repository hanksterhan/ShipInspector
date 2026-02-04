/**
 * DELETE /api/hands/:id – Soft delete a hand (SI-10)
 */
import { createHandler } from "../../api-utils/createHandler";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const deleteHandler = createHandler(
    { method: "DELETE", rateLimit: "global" },
    async (req, res, { userId, logger }) => {
        const id = (req as any).params?.id;

        if (!id || !UUID_REGEX.test(id)) {
            res.status(404).json({
                error: "Hand not found",
            });
            return;
        }

        const sql = (await import("../../../../server/src/config/database")).default;
        const now = Date.now();

        const rows = await sql`
            UPDATE hands
            SET deleted_at = ${now}, updated_at = ${now}
            WHERE id = ${id}
              AND owner_user_id = ${userId}
              AND deleted_at IS NULL
            RETURNING id
        `;

        if (rows.length === 0) {
            res.status(404).json({
                error: "Hand not found",
            });
            return;
        }

        logger?.logComplete();
        res.status(204).end();
    }
);
