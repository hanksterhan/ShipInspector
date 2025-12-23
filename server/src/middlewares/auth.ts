import { Request, Response, NextFunction } from "express";

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
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

    req.user = {
        userId: session.userId,
        email: session.email,
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
        req.user = {
            userId: session.userId,
            email: session.email,
        };
    }
    next();
}

// Keep old function name for backward compatibility during migration
export const authenticateToken = authenticateSession;
