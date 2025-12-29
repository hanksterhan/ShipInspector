import { neon } from "@neondatabase/serverless";

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error(
        "DATABASE_URL environment variable is required for Neon database connection"
    );
}

// Create Neon SQL client
const sql = neon(databaseUrl);

// Initialize database schema
async function initializeDatabase() {
    try {
        // Create invite_codes table
        await sql`
            CREATE TABLE IF NOT EXISTS invite_codes (
                code TEXT PRIMARY KEY,
                used INTEGER DEFAULT 0,
                used_by_email TEXT,
                used_at BIGINT,
                created_at BIGINT NOT NULL,
                created_by TEXT
            )
        `;

        // Create indexes for invite codes
        await sql`
            CREATE INDEX IF NOT EXISTS idx_invite_codes_used 
            ON invite_codes(used)
        `;

        await sql`
            CREATE INDEX IF NOT EXISTS idx_invite_codes_created_at 
            ON invite_codes(created_at)
        `;

        // Create users table
        await sql`
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                created_at BIGINT NOT NULL,
                updated_at BIGINT
            )
        `;

        // Create indexes for users
        await sql`
            CREATE INDEX IF NOT EXISTS idx_users_email 
            ON users(email)
        `;

        await sql`
            CREATE INDEX IF NOT EXISTS idx_users_role 
            ON users(role)
        `;

        console.log("✅ Database schema initialized successfully");
    } catch (error: any) {
        console.error("❌ Error initializing database schema:", error);
        // Don't throw - allow server to continue, tables may already exist
    }
}

// Initialize database on module load
initializeDatabase().catch(console.error);

export default sql;
