import { Request, Response, NextFunction } from "express";
import { getUserById, UserRole } from "../services/userService";

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
 * DISABLED: Auth is currently disabled - setting default admin user
 */
export function authenticateSession(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void {
    // Auth disabled - set default admin user so handlers that expect req.user work
    req.user = {
        userId: "disabled-auth",
        email: "disabled@example.com",
        role: "admin" as UserRole,
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
 * DISABLED: Auth is currently disabled - setting default admin user
 */
export function requireAdmin(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void {
    // Auth disabled - set default admin user so handlers that expect req.user work
    req.user = {
        userId: "disabled-auth",
        email: "disabled@example.com",
        role: "admin" as UserRole,
    };
    next();
}

/**
 * Require specific role middleware
 * DISABLED: Auth is currently disabled - setting default user with requested role
 */
export function requireRole(role: UserRole) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        // Auth disabled - set default user with requested role so handlers that expect req.user work
        req.user = {
            userId: "disabled-auth",
            email: "disabled@example.com",
            role: role,
        };
        next();
    };
}

// Keep old function name for backward compatibility during migration
export const authenticateToken = authenticateSession;
