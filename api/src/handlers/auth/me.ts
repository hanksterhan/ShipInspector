import type { VercelRequest, VercelResponse } from "@vercel/node";
import { clerkClient } from "../../../utils/auth";
import { getUserById, syncClerkUser } from "../../../../server/src/services/userService";
import { createHandler } from "../../../utils/createHandler";

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
    }
);
