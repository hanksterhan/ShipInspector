import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import {
    getInviteCode,
    markInviteCodeAsUsed,
} from "../services/inviteCodeService";
import {
    userRegistrationCounter,
    userLoginCounter,
    totalUsersGauge,
} from "../config/metrics";

// Simple in-memory user store
// In production, this should be replaced with a proper database
interface User {
    userId: string;
    email: string;
    passwordHash: string;
}

// Default admin user (password: "admin123")
// In production, users should be stored in a database
// For now, we'll use environment variables or a default admin
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";

// In-memory user store (replace with database in production)
const users: Map<string, User> = new Map(); // Keyed by email

// Initialize default admin user on first load
async function initializeDefaultUser(): Promise<void> {
    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
    users.set(DEFAULT_ADMIN_EMAIL, {
        userId: "1",
        email: DEFAULT_ADMIN_EMAIL,
        passwordHash,
    });
}

// Initialize on module load
initializeDefaultUser()
    .then(() => {
        // Initialize total users gauge with current user count
        totalUsersGauge.add(users.size);
    })
    .catch((err) => {
        console.error("Failed to initialize default user:", err);
    });

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

        const user = users.get(email.toLowerCase());
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

        // Create session
        (req.session as any).userId = user.userId;
        (req.session as any).email = user.email;

        // Record successful login
        userLoginCounter.add(1, {
            status: "success",
        });

        res.json({
            user: {
                userId: user.userId,
                email: user.email,
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
        if (users.has(emailLower)) {
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

        const passwordHash = await bcrypt.hash(password, 10);
        const userId = (users.size + 1).toString();

        const user: User = {
            userId,
            email: emailLower,
            passwordHash,
        };

        users.set(emailLower, user);

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

        res.status(201).json({
            user: {
                userId: user.userId,
                email: user.email,
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

    res.json({
        user: {
            userId: session.userId,
            email: session.email,
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
    logout,
};
