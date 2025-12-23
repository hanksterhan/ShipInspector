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

// Hand replays table for storing poker hand replays
db.exec(`
    CREATE TABLE IF NOT EXISTS hand_replays (
        id TEXT PRIMARY KEY,
        title TEXT,
        date INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        
        -- Table Configuration
        table_size INTEGER NOT NULL,
        button_position INTEGER NOT NULL,
        small_blind REAL NOT NULL,
        big_blind REAL NOT NULL,
        
        -- Hand Data (stored as JSON)
        players TEXT NOT NULL,
        streets TEXT NOT NULL,
        board TEXT NOT NULL,
        dead_cards TEXT NOT NULL,
        winners TEXT,
        pot_distribution TEXT,
        showdown INTEGER,
        
        -- Metadata
        metadata TEXT
    )
`);

// Create indexes for hand replays
db.exec(`
    CREATE INDEX IF NOT EXISTS idx_hand_replays_created_at 
    ON hand_replays(created_at DESC)
`);

db.exec(`
    CREATE INDEX IF NOT EXISTS idx_hand_replays_date 
    ON hand_replays(date DESC)
`);

db.exec(`
    CREATE INDEX IF NOT EXISTS idx_hand_replays_title 
    ON hand_replays(title)
`);

export default db;
