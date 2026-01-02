// Register path aliases first (before any @common/* imports)
import "../_helpers";

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../utils/auth";
import { handleCors } from "../utils/cors";
import { strictRateLimiter } from "../utils/rateLimit";
import { logRequest } from "../utils/logger";
import { handleError } from "../utils/errorHandler";
import { getHandForPlayback } from "../../../server/src/integrations/handReplay/handReplayDb";

/**
 * GET /api/hands/:id
 * Get a hand for playback
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

    // Only allow GET
    if (req.method !== "GET") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    // Rate limiting
    if (!strictRateLimiter(req, res)) {
        return;
    }

    try {
        // Check authentication
        requireAuth(req);

        // Extract handId from query or path
        const handId = (req.query.id as string) || (req.query.handId as string);

        if (!handId) {
            res.status(400).json({ error: "Hand ID is required" });
            return;
        }

        const playback = await getHandForPlayback(handId);

        if (!playback) {
            res.status(404).json({ error: "Hand not found" });
            return;
        }

        logger.info("Hand retrieved successfully", { handId });

        res.status(200).json(playback);
    } catch (error: any) {
        handleError(error, req, res, logger);
    }
}

