import type { VercelRequest, VercelResponse } from "@vercel/node";
import { clerkClient } from "../../../utils/auth";
import { createHandler } from "../../../utils/createHandler";

/**
 * GET /auth/clerk-user
 * Get Clerk user information (example protected route)
 */
export const handler = createHandler(
    { method: "GET", rateLimit: "global" },
    async (req, res, { userId, logger }) => {
        // Use Clerk's JavaScript Backend SDK to get the user's User object
        const user = await clerkClient.users.getUser(userId);

        logger?.logComplete();
        res.json({ user });
    }
);
