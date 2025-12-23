import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import {
    getInviteCode,
    markInviteCodeAsUsed,
} from "../services/inviteCodeService";

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
initializeDefaultUser().catch((err) => {
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
            res.status(401).json({
                error: "Invalid email or password",
            });
            return;
        }

        // Create session
        (req.session as any).userId = user.userId;
        (req.session as any).email = user.email;

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
            res.status(400).json({
                error: "Invite code is required",
            });
            return;
        }

        // Validate invite code
        const invite = getInviteCode(inviteCode);
        if (!invite) {
            res.status(400).json({
                error: "Invalid invite code",
            });
            return;
        }

        if (invite.used) {
            res.status(400).json({
                error: "Invite code has already been used",
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

        const emailLower = email.toLowerCase();
        if (users.has(emailLower)) {
            res.status(409).json({
                error: "Email already registered",
            });
            return;
        }

        if (password.length < 6) {
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
