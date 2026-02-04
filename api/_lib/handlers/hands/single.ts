/**
 * /api/hands/:id – Single hand endpoint router
 * GET – Retrieve a hand (SI-9)
 * DELETE – Soft delete a hand (SI-10)
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getHandler } from "./get";
import { deleteHandler } from "./delete";

export const handler = async (
    req: VercelRequest,
    res: VercelResponse
): Promise<void> => {
    if (req.method === "GET") {
        return getHandler(req, res);
    }
    if (req.method === "DELETE") {
        return deleteHandler(req, res);
    }

    res.status(405).json({ error: "Method not allowed" });
};
