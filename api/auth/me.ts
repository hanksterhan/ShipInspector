// Register path aliases first (before any @common/* imports)
import "../_helpers";

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAuth, clerkClient, requireAuth } from "../utils/auth";
import { getUserById, syncClerkUser } from "../../server/src/services/userService";
import { handleCors } from "../utils/cors";
import { globalRateLimiter } from "../utils/rateLimit";
import { logRequest } from "../utils/logger";
import { handleError } from "../utils/errorHandler";

/**
 * GET /auth/me
 * Get current user information
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

        console.log(`[getCurrentUser] Getting user info for userId: ${userId}`);

        // Get Clerk user information
        let clerkUser;
        try {
            clerkUser = await clerkClient.users.getUser(userId);
            console.log(
                `[getCurrentUser] Got Clerk user: ${clerkUser.emailAddresses[0]?.emailAddress}`
            );
        } catch (clerkError: any) {
            console.error(`[getCurrentUser] Clerk API error:`, clerkError);
            if (clerkError.status === 401 || clerkError.status === 403) {
                res.status(401).json({
                    error: "Invalid Clerk token",
                });
                return;
            }
            throw clerkError;
        }

        // Get or create local user for role management
        let localUser = null;
        try {
            localUser = await getUserById(userId);

            if (localUser) {
                console.log(
                    `[getCurrentUser] Found local user with role: ${localUser.role}`
                );
            } else {
                // User doesn't exist in local DB - sync from Clerk
                console.log(
                    `[getCurrentUser] User not in local DB, syncing from Clerk...`
                );
                const email = clerkUser.emailAddresses[0]?.emailAddress;

                if (!email) {
                    console.error(
                        `[getCurrentUser] No email address found for Clerk user`
                    );
                    throw new Error("User has no email address");
                }

                // Create user in local DB with default "user" role
                localUser = await syncClerkUser(userId, email, "user");
                console.log(
                    `[getCurrentUser] User synced to local DB with role: ${localUser.role}`
                );
            }
        } catch (dbError) {
            console.error(`[getCurrentUser] Database error:`, dbError);
            if (!localUser) {
                console.warn(
                    `[getCurrentUser] Using fallback: defaulting to "user" role`
                );
            }
        }

        logger?.logComplete();
        res.json({
            user: {
                userId: clerkUser.id,
                email: clerkUser.emailAddresses[0]?.emailAddress,
                role: localUser?.role || "user",
                clerkData: {
                    firstName: clerkUser.firstName,
                    lastName: clerkUser.lastName,
                    imageUrl: clerkUser.imageUrl,
                },
            },
        });
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

