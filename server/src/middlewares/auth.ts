import { Request, Response, NextFunction } from "express";
import { getUserById, isAdmin, UserRole } from "../services/userService";

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: UserRole;
    };
}

/**
 * Verify session middleware
 * Checks if user has an active session
 */
export function authenticateSession(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void {
    const session = req.session as any;

    if (!session.userId || !session.email) {
        res.status(401).json({ error: "Authentication required" });
        return;
    }

    // Get user from database to ensure we have current role
    const user = getUserById(session.userId);
    if (!user) {
        res.status(401).json({ error: "User not found" });
        return;
    }

    req.user = {
        userId: user.userId,
        email: user.email,
        role: user.role,
    };
    next();
}

/**
 * Optional authentication - doesn't fail if session is missing
 * Useful for endpoints that have different behavior for authenticated vs unauthenticated users
 */
export function optionalAuth(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void {
    const session = req.session as any;

    if (session.userId && session.email) {
        const user = getUserById(session.userId);
        if (user) {
            req.user = {
                userId: user.userId,
                email: user.email,
                role: user.role,
            };
        }
    }
    next();
}

/**
 * Verify admin access middleware
 * Checks if user has an active session and has admin role
 */
export function requireAdmin(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void {
    const session = req.session as any;

    if (!session.userId || !session.email) {
        res.status(401).json({ error: "Authentication required" });
        return;
    }

    // Check if user has admin role in database
    if (!isAdmin(session.userId)) {
        res.status(403).json({ error: "Admin access required" });
        return;
    }

    // Get user from database to ensure we have current role
    const user = getUserById(session.userId);
    if (!user) {
        res.status(401).json({ error: "User not found" });
        return;
    }

    req.user = {
        userId: user.userId,
        email: user.email,
        role: user.role,
    };
    next();
}

/**
 * Require specific role middleware
 */
export function requireRole(role: UserRole) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        const session = req.session as any;

        if (!session.userId || !session.email) {
            res.status(401).json({ error: "Authentication required" });
            return;
        }

        // Get user from database to ensure we have current role
        const user = getUserById(session.userId);
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
    };
}

// Keep old function name for backward compatibility during migration
export const authenticateToken = authenticateSession;
