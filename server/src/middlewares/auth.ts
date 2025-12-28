import { Request, Response, NextFunction } from "express";
import { getUserById, UserRole } from "../services/userService";
import { 
    requireAuth as clerkRequireAuth, 
    getAuth,
    clerkClient
} from "@clerk/express";

// Re-export Clerk functions for use in handlers
export { getAuth, clerkClient };

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: UserRole;
    };
}

/**
 * Verify admin access middleware using Clerk
 * Checks if user is authenticated via Clerk and has admin role
 * Use this AFTER requireAuth() middleware
 */
export async function requireAdmin(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // Use Clerk's getAuth to get the authenticated user's ID
        const { userId } = getAuth(req);

        if (!userId) {
            res.status(401).json({ error: "Authentication required" });
            return;
        }

        // Get user from database to ensure we have current role
        const user = await getUserById(userId);
        if (!user) {
            console.error(
                `[requireAdmin] User not found for userId: ${userId}`
            );
            res.status(401).json({ error: "User not found" });
            return;
        }

        // Check if user has admin role in database (case-insensitive check)
        const userRole = (user.role || "").toLowerCase().trim();
        if (userRole !== "admin") {
            console.error(
                `[requireAdmin] User ${userId} (${user.email}) has role "${user.role}" (normalized: "${userRole}"), not "admin"`
            );
            res.status(403).json({ error: "Admin access required" });
            return;
        }

        req.user = {
            userId: user.userId,
            email: user.email,
            role: user.role,
        };
        next();
    } catch (error) {
        console.error("[requireAdmin] Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

/**
 * Require specific role middleware using Clerk
 */
export function requireRole(role: UserRole) {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            // Use Clerk's getAuth to get the authenticated user's ID
            const { userId } = getAuth(req);

            if (!userId) {
                res.status(401).json({ error: "Authentication required" });
                return;
            }

            // Get user from database to ensure we have current role
            const user = await getUserById(userId);
            if (!user) {
                res.status(401).json({ error: "User not found" });
                return;
            }

            if (user.role !== role) {
                res.status(403).json({ error: `${role} access required` });
                return;
            }

            req.user = {
                userId: user.userId,
                email: user.email,
                role: user.role,
            };
            next();
        } catch (error) {
            console.error("[requireRole] Error:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    };
}

/**
 * Clerk's requireAuth middleware - use this on all protected routes
 * This ensures the user is authenticated via Clerk
 */
export const requireAuth = clerkRequireAuth;
