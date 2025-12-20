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

export default db;
