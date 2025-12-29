import sql from "../config/database";
import bcrypt from "bcryptjs";

export type UserRole = "user";

/**
 * User interface - represents user data stored in local database
 * Note: With Clerk, passwordHash is deprecated and not used for authentication
 */
export interface User {
    userId: string;
    email: string;
    passwordHash: string; // @deprecated - Not used with Clerk authentication
    role: UserRole;
    createdAt: number;
    updatedAt?: number;
}

/**
 * Get a user by email
 * @deprecated With Clerk, use Clerk's user management. Kept for backward compatibility.
 */
export async function getUserByEmail(email: string): Promise<User | null> {
    const rows =
        await sql`SELECT * FROM users WHERE email = ${email.toLowerCase()}`;

    if (!rows || rows.length === 0) {
        return null;
    }

    const row = rows[0];

    return {
        userId: row.user_id,
        email: row.email,
        passwordHash: row.password_hash,
        role: (row.role || "user") as UserRole,
        createdAt: Number(row.created_at),
        updatedAt: row.updated_at ? Number(row.updated_at) : undefined,
    };
}

/**
 * Get a user by user ID
 */
export async function getUserById(userId: string): Promise<User | null> {
    const rows = await sql`SELECT * FROM users WHERE user_id = ${userId}`;

    if (!rows || rows.length === 0) {
        console.error(`[getUserById] No user found with userId: ${userId}`);
        return null;
    }

    const row = rows[0];

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
        createdAt: Number(row.created_at),
        updatedAt: row.updated_at ? Number(row.updated_at) : undefined,
    };
}

/**
 * Check if a user exists by email
 * @deprecated With Clerk, use Clerk's user management. Kept for backward compatibility.
 */
export async function userExists(email: string): Promise<boolean> {
    const user = await getUserByEmail(email);
    return user !== null;
}

/**
 * Create a new user
 * @deprecated With Clerk, users are created through Clerk.
 * For new implementations, sync Clerk user IDs with local database instead.
 */
export async function createUser(
    email: string,
    password: string,
    role: UserRole = "user"
): Promise<User> {
    const emailLower = email.toLowerCase();

    // Check if user already exists
    if (await userExists(emailLower)) {
        throw new Error("User already exists");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate user ID (use timestamp + random for uniqueness)
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = Date.now();

    // Insert user into database
    await sql`
        INSERT INTO users (user_id, email, password_hash, role, created_at)
        VALUES (${userId}, ${emailLower}, ${passwordHash}, ${role}, ${createdAt})
    `;

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
export async function getUserCount(): Promise<number> {
    const result = await sql`SELECT COUNT(*) as count FROM users`;
    return result[0]?.count ? Number(result[0].count) : 0;
}

/**
 * Get total user count
 */
export async function getTotalUsers(): Promise<number> {
    const rows = await sql`SELECT COUNT(*) as count FROM users`;
    return rows[0]?.count ? Number(rows[0].count) : 0;
}

/**
 * Create or update a user from Clerk
 * This syncs Clerk users to the local database for role management
 * @param clerkUserId - The Clerk user ID
 * @param email - User's email address
 * @param role - Optional role (defaults to "user" for new users)
 */
export async function syncClerkUser(
    clerkUserId: string,
    email: string,
    role: UserRole = "user"
): Promise<User> {
    const emailLower = email.toLowerCase();
    const now = Date.now();

    console.log(`[syncClerkUser] Syncing user ${clerkUserId} (${emailLower})`);

    // Check if user already exists
    const existingUser = await getUserById(clerkUserId);

    if (existingUser) {
        console.log(
            `[syncClerkUser] User already exists with role: ${existingUser.role}`
        );
        // Update email if it changed
        if (existingUser.email !== emailLower) {
            console.log(
                `[syncClerkUser] Updating email from ${existingUser.email} to ${emailLower}`
            );
            await sql`
                UPDATE users 
                SET email = ${emailLower}, updated_at = ${now}
                WHERE user_id = ${clerkUserId}
            `;
        }
        return existingUser;
    }

    // Create new user
    console.log(`[syncClerkUser] Creating new user with role: ${role}`);

    // Use empty password hash for Clerk-authenticated users
    const passwordHash = "";

    await sql`
        INSERT INTO users (user_id, email, password_hash, role, created_at)
        VALUES (${clerkUserId}, ${emailLower}, ${passwordHash}, ${role}, ${now})
    `;

    console.log(`[syncClerkUser] User created successfully`);

    return {
        userId: clerkUserId,
        email: emailLower,
        passwordHash,
        role,
        createdAt: now,
        updatedAt: undefined,
    };
}
