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
            const sql = (await import("@lib/database")).default;

            // Get user from local database
            const rows = await sql`SELECT * FROM users WHERE user_id = ${userId}`;
            if (rows && rows.length > 0) {
                localUser = {
                    userId: rows[0].user_id,
                    email: rows[0].email,
                    role: (rows[0].role || "user").trim().toLowerCase(),
                };
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
                const now = Date.now();
                await sql`
                    INSERT INTO users (user_id, email, password_hash, role, created_at)
                    VALUES (${userId}, ${email}, ${""}, ${"user"}, ${now})
                `;
                localUser = { userId, email, role: "user" };
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
    }
);
