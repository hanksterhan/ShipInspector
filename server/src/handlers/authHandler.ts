import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import {
    getInviteCode,
    markInviteCodeAsUsed,
} from "../services/inviteCodeService";
import {
    getUserByEmail,
    getUserById,
    createUser,
    userExists,
    isAdmin,
} from "../services/userService";
import {
    userRegistrationCounter,
    userLoginCounter,
    totalUsersGauge,
} from "../config/metrics";

/**
 * Login handler - validates credentials and creates session
 */
export async function login(req: Request, res: Response): Promise<void> {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({
                error: "Email and password are required",
            });
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({
                error: "Invalid email format",
            });
            return;
        }

        const user = getUserByEmail(email);
        if (!user) {
            userLoginCounter.add(1, {
                status: "failure",
                failure_reason: "user_not_found",
            });
            res.status(401).json({
                error: "Invalid email or password",
            });
            return;
        }

        const isValidPassword = await bcrypt.compare(
            password,
            user.passwordHash
        );
        if (!isValidPassword) {
            userLoginCounter.add(1, {
                status: "failure",
                failure_reason: "invalid_credentials",
            });
            res.status(401).json({
                error: "Invalid email or password",
            });
            return;
        }

        // Check if this is an admin app request (via custom header)
        const isAdminAppRequest = req.headers["x-admin-app"] === "true";
        
        // If request is from admin app, verify user is admin
        if (isAdminAppRequest && user.role !== "admin") {
            userLoginCounter.add(1, {
                status: "failure",
                failure_reason: "non_admin_access_attempt",
            });
            res.status(403).json({
                error: "Admin access required. This application is only available to administrators.",
            });
            return;
        }

        // Create session
        (req.session as any).userId = user.userId;
        (req.session as any).email = user.email;
        (req.session as any).role = user.role;

        // Record successful login
        userLoginCounter.add(1, {
            status: "success",
        });

        res.json({
            user: {
                userId: user.userId,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            error: "Internal server error during authentication",
        });
    }
}

/**
 * Register handler - creates a new user
 */
export async function register(req: Request, res: Response): Promise<void> {
    try {
        const { email, password, inviteCode } = req.body;

        if (!email || !password) {
            res.status(400).json({
                error: "Email and password are required",
            });
            return;
        }

        if (!inviteCode) {
            userRegistrationCounter.add(1, {
                status: "failure",
                failure_reason: "missing_invite_code",
            });
            res.status(400).json({
                error: "Invite code is required",
            });
            return;
        }

        // Validate invite code
        const invite = getInviteCode(inviteCode);
        if (!invite) {
            userRegistrationCounter.add(1, {
                status: "failure",
                failure_reason: "invalid_invite_code",
            });
            res.status(400).json({
                error: "Invalid invite code",
            });
            return;
        }

        if (invite.used) {
            userRegistrationCounter.add(1, {
                status: "failure",
                failure_reason: "invite_code_already_used",
            });
            res.status(400).json({
                error: "Invite code has already been used",
            });
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            userRegistrationCounter.add(1, {
                status: "failure",
                failure_reason: "invalid_email_format",
            });
            res.status(400).json({
                error: "Invalid email format",
            });
            return;
        }

        const emailLower = email.toLowerCase();
        if (userExists(emailLower)) {
            userRegistrationCounter.add(1, {
                status: "failure",
                failure_reason: "email_already_registered",
            });
            res.status(409).json({
                error: "Email already registered",
            });
            return;
        }

        if (password.length < 6) {
            userRegistrationCounter.add(1, {
                status: "failure",
                failure_reason: "password_too_short",
            });
            res.status(400).json({
                error: "Password must be at least 6 characters",
            });
            return;
        }

        // Create user in database
        const user = await createUser(emailLower, password);

        // Check if this is an admin app request (via custom header)
        const isAdminAppRequest = req.headers["x-admin-app"] === "true";
        
        // If request is from admin app, verify user is admin
        // Note: New registrations default to 'user' role, so they will always fail
        if (isAdminAppRequest && user.role !== "admin") {
            userRegistrationCounter.add(1, {
                status: "failure",
                failure_reason: "non_admin_registration_attempt",
            });
            res.status(403).json({
                error: "Admin access required. This application is only available to administrators.",
            });
            return;
        }

        // Mark invite code as used
        const codeMarked = markInviteCodeAsUsed(inviteCode, emailLower);
        if (!codeMarked) {
            // This shouldn't happen if we validated above, but handle it anyway
            console.error(
                `Failed to mark invite code ${inviteCode} as used for ${emailLower}`
            );
        }

        // Record successful registration and update user count
        userRegistrationCounter.add(1, {
            status: "success",
        });
        totalUsersGauge.add(1);

        // Create session
        (req.session as any).userId = user.userId;
        (req.session as any).email = user.email;
        (req.session as any).role = user.role;

        res.status(201).json({
            user: {
                userId: user.userId,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
            error: "Internal server error during registration",
        });
    }
}

/**
 * Get current user info (requires authentication)
 */
export function getCurrentUser(req: Request, res: Response): void {
    const session = req.session as any;

    if (!session.userId || !session.email) {
        res.status(401).json({
            error: "Not authenticated",
        });
        return;
    }

    // Get user from database to ensure we have current role
    const user = getUserById(session.userId);
    if (!user) {
        res.status(401).json({
            error: "User not found",
        });
        return;
    }

    // Check if this is an admin app request (via custom header)
    const isAdminAppRequest = req.headers["x-admin-app"] === "true";
    
    // If request is from admin app, verify user is admin
    if (isAdminAppRequest && user.role !== "admin") {
        res.status(403).json({
            error: "Admin access required",
        });
        return;
    }

    res.json({
        user: {
            userId: user.userId,
            email: user.email,
            role: user.role,
        },
    });
}

/**
 * Get current admin user info (requires admin authentication)
 * This is a dedicated endpoint for admin app that always requires admin role
 */
export function getCurrentAdminUser(req: Request, res: Response): void {
    const session = req.session as any;

    if (!session.userId || !session.email) {
        res.status(401).json({
            error: "Not authenticated",
        });
        return;
    }

    // Get user from database to ensure we have current role
    const user = getUserById(session.userId);
    if (!user) {
        res.status(401).json({
            error: "User not found",
        });
        return;
    }

    // Always require admin role for this endpoint
    if (user.role !== "admin") {
        res.status(403).json({
            error: "Admin access required",
        });
        return;
    }

    res.json({
        user: {
            userId: user.userId,
            email: user.email,
            role: user.role,
        },
    });
}

/**
 * Logout handler - destroys session
 */
export function logout(req: Request, res: Response): void {
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout error:", err);
            res.status(500).json({
                error: "Failed to logout",
            });
            return;
        }
        res.clearCookie("connect.sid");
        res.json({
            message: "Logged out successfully",
        });
    });
}

// Export as object to match other handlers pattern
export const authHandler = {
    login,
    register,
    getCurrentUser,
    getCurrentAdminUser,
    logout,
};
