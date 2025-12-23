import db from "../config/database";

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
export function createInviteCode(createdBy?: string): string {
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
    } while (getInviteCode(code) !== null);

    const now = Date.now();
    db.prepare(
        `INSERT INTO invite_codes (code, used, created_at, created_by)
         VALUES (?, 0, ?, ?)`
    ).run(code, now, createdBy || null);

    return code;
}

/**
 * Get an invite code by code string
 */
export function getInviteCode(code: string): InviteCode | null {
    const row = db
        .prepare(`SELECT * FROM invite_codes WHERE code = ?`)
        .get(code) as any;

    if (!row) {
        return null;
    }

    return {
        code: row.code,
        used: row.used === 1,
        usedByEmail: row.used_by_email || undefined,
        usedAt: row.used_at || undefined,
        createdAt: row.created_at,
        createdBy: row.created_by || undefined,
    };
}

/**
 * Mark an invite code as used
 */
export function markInviteCodeAsUsed(
    code: string,
    usedByEmail: string
): boolean {
    const inviteCode = getInviteCode(code);
    if (!inviteCode) {
        return false;
    }

    if (inviteCode.used) {
        return false; // Already used
    }

    const now = Date.now();
    const result = db
        .prepare(
            `UPDATE invite_codes 
             SET used = 1, used_by_email = ?, used_at = ?
             WHERE code = ? AND used = 0`
        )
        .run(usedByEmail, now, code);

    return result.changes > 0;
}

/**
 * Get all invite codes (for admin)
 */
export function getAllInviteCodes(): InviteCode[] {
    const rows = db
        .prepare(`SELECT * FROM invite_codes ORDER BY created_at DESC`)
        .all() as any[];

    return rows.map((row) => ({
        code: row.code,
        used: row.used === 1,
        usedByEmail: row.used_by_email || undefined,
        usedAt: row.used_at || undefined,
        createdAt: row.created_at,
        createdBy: row.created_by || undefined,
    }));
}

/**
 * Get unused invite codes
 */
export function getUnusedInviteCodes(): InviteCode[] {
    const rows = db
        .prepare(
            `SELECT * FROM invite_codes WHERE used = 0 ORDER BY created_at DESC`
        )
        .all() as any[];

    return rows.map((row) => ({
        code: row.code,
        used: false,
        usedByEmail: undefined,
        usedAt: undefined,
        createdAt: row.created_at,
        createdBy: row.created_by || undefined,
    }));
}

/**
 * Get used invite codes
 */
export function getUsedInviteCodes(): InviteCode[] {
    const rows = db
        .prepare(
            `SELECT * FROM invite_codes WHERE used = 1 ORDER BY used_at DESC`
        )
        .all() as any[];

    return rows.map((row) => ({
        code: row.code,
        used: true,
        usedByEmail: row.used_by_email || undefined,
        usedAt: row.used_at || undefined,
        createdAt: row.created_at,
        createdBy: row.created_by || undefined,
    }));
}
