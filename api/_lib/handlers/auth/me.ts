import type { VercelRequest, VercelResponse } from "@vercel/node";
import { clerkClient } from "../../api-utils/auth";
import { createHandler } from "../../api-utils/createHandler";

/**
 * GET /auth/me
 * Get current user information
 */
export const handler = createHandler(
    { method: "GET", rateLimit: "global" },
    async (req, res, { userId, logger }) => {
        logger.info("Getting user info", { userId });

        // Get Clerk user information
        let clerkUser;
        try {
            clerkUser = await clerkClient.users.getUser(userId);
            logger.info("Got Clerk user", {
                email: clerkUser.emailAddresses[0]?.emailAddress,
            });
        } catch (clerkError: any) {
            logger.error("Clerk API error", clerkError);
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
            const sql = (await import("@lib/database")).default;

            const dbStart = Date.now();
            // Get user from local database
            const rows = await sql`SELECT * FROM users WHERE user_id = ${userId}`;
            if (rows && rows.length > 0) {
                localUser = {
                    userId: rows[0].user_id,
                    email: rows[0].email,
                    role: (rows[0].role || "user").trim().toLowerCase(),
                };
                logger.info("Found local user", { role: localUser.role });
            } else {
                // User doesn't exist in local DB - sync from Clerk
                logger.info("User not in local DB, syncing from Clerk");
                const email = clerkUser.emailAddresses[0]?.emailAddress;

                if (!email) {
                    logger.error("No email address found for Clerk user");
                    throw new Error("User has no email address");
                }

                // Create user in local DB with default "user" role
                const now = Date.now();
                await sql`
                    INSERT INTO users (user_id, email, password_hash, role, created_at)
                    VALUES (${userId}, ${email}, ${""}, ${"user"}, ${now})
                `;
                localUser = { userId, email, role: "user" };
                logger.info("User synced to local DB", { role: localUser.role });
            }
            const dbQueryTimeMs = Date.now() - dbStart;

            logger.logComplete(200, { dbQueryTimeMs });
        } catch (dbError) {
            logger.error("Database error", dbError);
            if (!localUser) {
                logger.warn("Using fallback: defaulting to user role");
            }
            logger.logComplete(200);
        }

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
    }
);
