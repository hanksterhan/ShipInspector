import path from "path";
import fs from "fs";
import Database from "better-sqlite3";

// Resolve path relative to server directory (works for both src and dist)
const serverDir = path.resolve(__dirname, "../..");
const dataDir = path.join(serverDir, "data");
const dbFilePath = path.join(dataDir, "equity_cache.db");

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbFilePath, { verbose: console.log });

// Equity cache table for poker hand equity calculations
db.exec(`
    CREATE TABLE IF NOT EXISTS equity_cache (
        key TEXT PRIMARY KEY,
        win TEXT NOT NULL,  -- JSON array
        tie TEXT NOT NULL,  -- JSON array
        lose TEXT NOT NULL, -- JSON array
        samples INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        last_accessed INTEGER NOT NULL,
        access_count INTEGER DEFAULT 0
    )
`);

// Create indexes for equity cache
db.exec(`
    CREATE INDEX IF NOT EXISTS idx_equity_last_accessed 
    ON equity_cache(last_accessed)
`);

db.exec(`
    CREATE INDEX IF NOT EXISTS idx_equity_access_count 
    ON equity_cache(access_count)
`);

// Invite codes table for registration
db.exec(`
    CREATE TABLE IF NOT EXISTS invite_codes (
        code TEXT PRIMARY KEY,
        used INTEGER DEFAULT 0,
        used_by_email TEXT,
        used_at INTEGER,
        created_at INTEGER NOT NULL,
        created_by TEXT
    )
`);

// Create indexes for invite codes
db.exec(`
    CREATE INDEX IF NOT EXISTS idx_invite_codes_used 
    ON invite_codes(used)
`);

db.exec(`
    CREATE INDEX IF NOT EXISTS idx_invite_codes_created_at 
    ON invite_codes(created_at)
`);

// Users table for authentication
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at INTEGER NOT NULL,
        updated_at INTEGER
    )
`);

// Migration: Add role column if it doesn't exist (for existing databases)
// This must happen BEFORE creating indexes on the role column
try {
    db.exec(`
        ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'
    `);
} catch (error: any) {
    // Column already exists, ignore error
    if (!error.message?.includes("duplicate column")) {
        console.warn("Migration note: role column may already exist");
    }
}

// Migration: Add updated_at column if it doesn't exist
try {
    db.exec(`
        ALTER TABLE users ADD COLUMN updated_at INTEGER
    `);
} catch (error: any) {
    // Column already exists, ignore error
    if (!error.message?.includes("duplicate column")) {
        console.warn("Migration note: updated_at column may already exist");
    }
}

// Update existing users without role to have 'user' role
db.exec(`
    UPDATE users SET role = 'user' WHERE role IS NULL
`);

// Create indexes for users (after migrations ensure columns exist)
db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email 
    ON users(email)
`);

db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_role 
    ON users(role)
`);

export default db;
