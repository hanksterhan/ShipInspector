# Equity Cache Storage

## Storage Implementation

The equity cache is stored in **SQLite database** (`data/equity_cache.db`).

### Features

- ✅ **Persistent** - Survives server restarts
- ✅ **Fast** - < 1ms lookups with hot cache, ~1-5ms for cold lookups
- ✅ **Unlimited size** - Can store millions of entries
- ✅ **Hot cache** - Frequently accessed items kept in memory (1000 entries)
- ✅ **Queryable** - Can analyze cache with SQL
- ✅ **Analytics** - Tracks access patterns and popular scenarios

## Automatic Initialization

The SQLite cache is **automatically initialized** on first use. No configuration needed!

```typescript
import { computeEquityWithCache } from "./equityLookup";

// First call automatically creates the database
const result = computeEquityWithCache(players, board, { mode: "exact" });
```

## Database Location

- **Default**: `server/data/equity_cache.db`
- **Custom**: Set `EQUITY_CACHE_DB_PATH` environment variable

## Database Schema

```sql
CREATE TABLE equity_cache (
    key TEXT PRIMARY KEY,           -- Canonical equity scenario key
    win TEXT NOT NULL,              -- JSON array of win probabilities
    tie TEXT NOT NULL,              -- JSON array of tie probabilities
    lose TEXT NOT NULL,             -- JSON array of lose probabilities
    samples INTEGER NOT NULL,       -- Number of samples evaluated
    created_at INTEGER NOT NULL,    -- Timestamp when cached
    last_accessed INTEGER NOT NULL, -- Last access time
    access_count INTEGER DEFAULT 0  -- Number of times accessed
);
```

## Cache Management

```typescript
import { getLookupTableInstance, getCacheStats, clearEquityCache } from "./equityLookup";

// Get statistics
const stats = getCacheStats();
console.log(`Total entries: ${stats.size}`);
console.log(`Hot cache: ${stats.memoryCacheSize}`);
console.log(`Total accesses: ${stats.totalAccesses}`);

// Get table instance for advanced operations
const table = getLookupTableInstance();

// Clean up old entries (older than 30 days)
const deleted = table.cleanup(30 * 24 * 60 * 60 * 1000);

// Vacuum database to reclaim space
table.vacuum();

// Clear entire cache
clearEquityCache();
```

## Performance

- **Hot cache hit**: < 1ms (in-memory)
- **Cold lookup**: ~1-5ms (SQLite query)
- **Storage**: ~200 bytes per entry on disk
- **Hot cache**: 1000 entries in RAM (~200 KB)

## Backup

The cache database can be backed up like any SQLite file:
```bash
cp server/data/equity_cache.db /backup/location/
```

The cache can be regenerated, but backing up saves computation time.
