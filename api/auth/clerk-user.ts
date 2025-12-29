// Register path aliases first (before any @common/* imports)
import "../_helpers";

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAuth, clerkClient, requireAuth } from "../utils/auth";
import { handleCors } from "../utils/cors";
import { globalRateLimiter } from "../utils/rateLimit";
import { logRequest } from "../utils/logger";
import { handleError } from "../utils/errorHandler";

/**
 * GET /auth/clerk-user
 * Get Clerk user information (example protected route)
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
    if (!globalRateLimiter(req, res)) {
        return;
    }

    try {
        // Check authentication
        const { userId } = requireAuth(req);

        // Use Clerk's JavaScript Backend SDK to get the user's User object
        const user = await clerkClient.users.getUser(userId);

        logger?.logComplete();
        res.json({ user });
    } catch (error: any) {
        if (error.message === "Not authenticated") {
            res.status(401).json({
                error: "Not authenticated",
            });
            return;
        }
        handleError(error, res, 500);
    }
}

