import sql from "../config/database";

export interface InviteCode {
    code: string;
    used: boolean;
    usedByEmail?: string;
    usedAt?: number;
    createdAt: number;
    createdBy?: string;
}

/**
 * Generate a random alphanumeric invite code
 */
export function generateInviteCode(length: number = 8): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Create a new invite code
 */
export async function createInviteCode(createdBy?: string): Promise<string> {
    let code: string;
    let attempts = 0;
    const maxAttempts = 10;

    // Generate unique code (retry if collision)
    do {
        code = generateInviteCode();
        attempts++;
        if (attempts > maxAttempts) {
            throw new Error("Failed to generate unique invite code");
        }
    } while ((await getInviteCode(code)) !== null);

    const now = Date.now();
    await sql`
        INSERT INTO invite_codes (code, used, created_at, created_by)
        VALUES (${code}, 0, ${now}, ${createdBy || null})
    `;

    return code;
}

/**
 * Get an invite code by code string
 */
export async function getInviteCode(code: string): Promise<InviteCode | null> {
    const rows = await sql`SELECT * FROM invite_codes WHERE code = ${code}`;

    if (!rows || rows.length === 0) {
        return null;
    }

    const row = rows[0];

    return {
        code: row.code,
        used: row.used === 1,
        usedByEmail: row.used_by_email || undefined,
        usedAt: row.used_at ? Number(row.used_at) : undefined,
        createdAt: Number(row.created_at),
        createdBy: row.created_by || undefined,
    };
}

/**
 * Mark an invite code as used
 */
export async function markInviteCodeAsUsed(
    code: string,
    usedByEmail: string
): Promise<boolean> {
    const inviteCode = await getInviteCode(code);
    if (!inviteCode) {
        return false;
    }

    if (inviteCode.used) {
        return false; // Already used
    }

    const now = Date.now();
    const result = await sql`
        UPDATE invite_codes 
        SET used = 1, used_by_email = ${usedByEmail}, used_at = ${now}
        WHERE code = ${code} AND used = 0
    `;

    return result.length > 0;
}

/**
 * Get all invite codes (for admin)
 */
export async function getAllInviteCodes(): Promise<InviteCode[]> {
    const rows = await sql`SELECT * FROM invite_codes ORDER BY created_at DESC`;

    return rows.map((row) => ({
        code: row.code,
        used: row.used === 1,
        usedByEmail: row.used_by_email || undefined,
        usedAt: row.used_at ? Number(row.used_at) : undefined,
        createdAt: Number(row.created_at),
        createdBy: row.created_by || undefined,
    }));
}

/**
 * Get unused invite codes
 */
export async function getUnusedInviteCodes(): Promise<InviteCode[]> {
    const rows =
        await sql`SELECT * FROM invite_codes WHERE used = 0 ORDER BY created_at DESC`;

    return rows.map((row) => ({
        code: row.code,
        used: false,
        usedByEmail: undefined,
        usedAt: undefined,
        createdAt: Number(row.created_at),
        createdBy: row.created_by || undefined,
    }));
}

/**
 * Get used invite codes
 */
export async function getUsedInviteCodes(): Promise<InviteCode[]> {
    const rows =
        await sql`SELECT * FROM invite_codes WHERE used = 1 ORDER BY used_at DESC`;

    return rows.map((row) => ({
        code: row.code,
        used: true,
        usedByEmail: row.used_by_email || undefined,
        usedAt: row.used_at ? Number(row.used_at) : undefined,
        createdAt: Number(row.created_at),
        createdBy: row.created_by || undefined,
    }));
}

/**
 * Delete an invite code
 */
export async function deleteInviteCode(code: string): Promise<boolean> {
    const result = await sql`DELETE FROM invite_codes WHERE code = ${code}`;
    return result.length > 0;
}
