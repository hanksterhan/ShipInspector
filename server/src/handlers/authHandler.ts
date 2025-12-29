import { Request, Response } from "express";
import { getAuth, clerkClient } from "../middlewares/auth";
import { getUserById, syncClerkUser } from "../services/userService";

/**
 * Get current user info (requires authentication)
 * Uses Clerk authentication
 */
export async function getCurrentUser(
    req: Request,
    res: Response
): Promise<void> {
    try {
        // Use Clerk's getAuth to get the user's userId
        const { userId } = getAuth(req);

        if (!userId) {
            res.status(401).json({
                error: "Not authenticated",
            });
            return;
        }

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
            // If Clerk API fails, check if it's an authentication issue
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
            // If database sync fails, still return user info with default role
            // but log the error for investigation
            if (!localUser) {
                console.warn(
                    `[getCurrentUser] Using fallback: defaulting to "user" role`
                );
            }
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
    } catch (error: any) {
        console.error("[getCurrentUser] Unexpected error:", error);
        console.error("Error details:", {
            message: error.message,
            status: error.status,
            stack: error.stack,
        });
        res.status(500).json({
            error: "Failed to retrieve user information",
            details:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
}

/**
 * Example protected route using Clerk authentication
 * This demonstrates how to use getAuth() and clerkClient
 * as shown in the Clerk tutorial
 */
export async function getClerkUserInfo(
    req: Request,
    res: Response
): Promise<void> {
    try {
        // Use getAuth() to get the user's userId from Clerk
        const { userId } = getAuth(req);

        if (!userId) {
            res.status(401).json({
                error: "Not authenticated",
            });
            return;
        }

        // Use Clerk's JavaScript Backend SDK to get the user's User object
        const user = await clerkClient.users.getUser(userId);

        res.json({ user });
    } catch (error) {
        console.error("Error fetching Clerk user:", error);
        res.status(500).json({
            error: "Failed to fetch user information",
        });
    }
}

// Export as object to match other handlers pattern
export const authHandler = {
    getCurrentUser,
    getClerkUserInfo,
};
