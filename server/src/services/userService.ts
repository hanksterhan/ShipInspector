import db from "../config/database";
import bcrypt from "bcryptjs";

export type UserRole = "user" | "admin" | "moderator";

export interface User {
    userId: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    createdAt: number;
    updatedAt?: number;
}

/**
 * Get a user by email
 */
export function getUserByEmail(email: string): User | null {
    const row = db
        .prepare(`SELECT * FROM users WHERE email = ?`)
        .get(email.toLowerCase()) as any;

    if (!row) {
        return null;
    }

    return {
        userId: row.user_id,
        email: row.email,
        passwordHash: row.password_hash,
        role: (row.role || "user") as UserRole,
        createdAt: row.created_at,
        updatedAt: row.updated_at || undefined,
    };
}

/**
 * Get a user by user ID
 */
export function getUserById(userId: string): User | null {
    const row = db
        .prepare(`SELECT * FROM users WHERE user_id = ?`)
        .get(userId) as any;

    if (!row) {
        console.error(`[getUserById] No user found with userId: ${userId}`);
        return null;
    }

    // Handle role - check for null, undefined, or empty string
    let role = row.role;
    if (!role || role.trim() === "") {
        console.warn(
            `[getUserById] User ${row.email} (${userId}) has null/empty role, defaulting to "user"`
        );
        role = "user";
    }
    role = role.trim().toLowerCase() as UserRole;
    console.log(
        `[getUserById] Found user ${row.email} (${userId}) with role: "${role}" (raw from DB: "${row.role}")`
    );

    return {
        userId: row.user_id,
        email: row.email,
        passwordHash: row.password_hash,
        role: role,
        createdAt: row.created_at,
        updatedAt: row.updated_at || undefined,
    };
}

/**
 * Check if a user exists by email
 */
export function userExists(email: string): boolean {
    const user = getUserByEmail(email);
    return user !== null;
}

/**
 * Create a new user
 */
export async function createUser(
    email: string,
    password: string,
    role: UserRole = "user"
): Promise<User> {
    const emailLower = email.toLowerCase();

    // Check if user already exists
    if (userExists(emailLower)) {
        throw new Error("User already exists");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate user ID (use timestamp + random for uniqueness)
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = Date.now();

    // Insert user into database
    db.prepare(
        `INSERT INTO users (user_id, email, password_hash, role, created_at)
         VALUES (?, ?, ?, ?, ?)`
    ).run(userId, emailLower, passwordHash, role, createdAt);

    return {
        userId,
        email: emailLower,
        passwordHash,
        role,
        createdAt,
        updatedAt: undefined,
    };
}

/**
 * Get total user count
 */
export function getUserCount(): number {
    const result = db
        .prepare(`SELECT COUNT(*) as count FROM users`)
        .get() as any;
    return result.count || 0;
}

/**
 * Update user role (admin only)
 */
export function updateUserRole(userId: string, newRole: UserRole): boolean {
    const now = Date.now();
    const result = db
        .prepare(`UPDATE users SET role = ?, updated_at = ? WHERE user_id = ?`)
        .run(newRole, now, userId);

    return result.changes > 0;
}

/**
 * Get all users (admin only)
 */
export function getAllUsers(): User[] {
    const rows = db
        .prepare(`SELECT * FROM users ORDER BY created_at DESC`)
        .all() as any[];

    return rows.map((row) => ({
        userId: row.user_id,
        email: row.email,
        passwordHash: row.password_hash,
        role: (row.role || "user") as UserRole,
        createdAt: row.created_at,
        updatedAt: row.updated_at || undefined,
    }));
}

/**
 * Get users by role
 */
export function getUsersByRole(role: UserRole): User[] {
    const rows = db
        .prepare(`SELECT * FROM users WHERE role = ? ORDER BY created_at DESC`)
        .all(role) as any[];

    return rows.map((row) => ({
        userId: row.user_id,
        email: row.email,
        passwordHash: row.password_hash,
        role: (row.role || "user") as UserRole,
        createdAt: row.created_at,
        updatedAt: row.updated_at || undefined,
    }));
}

/**
 * Check if user has admin role
 */
export function isAdmin(userId: string): boolean {
    const user = getUserById(userId);
    return user?.role === "admin";
}

/**
 * Check if user has role
 */
export function hasRole(userId: string, role: UserRole): boolean {
    const user = getUserById(userId);
    return user?.role === role;
}
