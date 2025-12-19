import {
    Board,
    Hole,
    EquityResult,
    EquityOptions,
    Card,
} from "@common/interfaces";
import { createEquityKey } from "./equityLookup";
import db from "../../config/database";

/**
 * Persistent equity lookup table using SQLite
 *
 * This provides a high-performance cache that persists results to a SQLite database,
 * allowing the cache to survive server restarts.
 *
 * Performance:
 * - Fast lookups (indexed by key, hot cache in memory)
 * - Persistent across restarts
 * - Can handle millions of entries
 * - Automatic cleanup of old entries (optional TTL)
 */

/**
 * Persistent lookup table using SQLite (shared database)
 */
export class PersistentEquityLookupTable {
    private inMemoryCache: Map<string, EquityResult>; // Hot cache for frequently accessed items
    private maxMemoryCacheSize: number;

    constructor(maxMemoryCacheSize: number = 1000) {
        // Use the shared database from config/database.ts
        // Table is already created in database.ts initialization
        this.maxMemoryCacheSize = maxMemoryCacheSize;
        this.inMemoryCache = new Map();
    }

    /**
     * Get equity result from cache
     */
    get(
        players: readonly Hole[],
        board: Board,
        dead: readonly Card[],
        options?: EquityOptions
    ): EquityResult | null {
        const key = createEquityKey(players, board, dead, options);

        // Check in-memory cache first (fastest)
        const memoryCached = this.inMemoryCache.get(key);
        if (memoryCached) {
            this.updateAccessStats(key);
            return memoryCached;
        }

        // Check database
        const stmt = db.prepare(
            "SELECT win, tie, lose, samples FROM equity_cache WHERE key = ?"
        );
        const row = stmt.get(key) as
            | {
                  win: string;
                  tie: string;
                  lose: string;
                  samples: number;
              }
            | undefined;

        if (!row) {
            return null;
        }

        // Parse JSON arrays
        const result: EquityResult = {
            win: JSON.parse(row.win),
            tie: JSON.parse(row.tie),
            lose: JSON.parse(row.lose),
            samples: row.samples,
        };

        // Update access stats
        this.updateAccessStats(key);

        // Add to in-memory cache for faster future access
        this.addToMemoryCache(key, result);

        return result;
    }

    /**
     * Store equity result in cache
     */
    set(
        players: readonly Hole[],
        board: Board,
        dead: readonly Card[],
        result: EquityResult,
        options?: EquityOptions
    ): void {
        const key = createEquityKey(players, board, dead, options);
        const now = Date.now();

        // Store in database
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO equity_cache 
            (key, win, tie, lose, samples, created_at, last_accessed, access_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0)
        `);

        stmt.run(
            key,
            JSON.stringify(result.win),
            JSON.stringify(result.tie),
            JSON.stringify(result.lose),
            result.samples,
            now,
            now
        );

        // Also add to in-memory cache
        this.addToMemoryCache(key, result);
    }

    /**
     * Update access statistics
     */
    private updateAccessStats(key: string): void {
        const stmt = db.prepare(`
            UPDATE equity_cache 
            SET last_accessed = ?, access_count = access_count + 1
            WHERE key = ?
        `);
        stmt.run(Date.now(), key);
    }

    /**
     * Add to in-memory cache with LRU eviction
     */
    private addToMemoryCache(key: string, result: EquityResult): void {
        if (this.inMemoryCache.size >= this.maxMemoryCacheSize) {
            // Evict least recently used (simple: remove first entry)
            const firstKey = this.inMemoryCache.keys().next().value;
            if (firstKey) {
                this.inMemoryCache.delete(firstKey);
            }
        }
        this.inMemoryCache.set(key, result);
    }

    /**
     * Clear the cache
     */
    clear(): void {
        db.exec("DELETE FROM equity_cache");
        this.inMemoryCache.clear();
    }

    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        memoryCacheSize: number;
        maxMemoryCacheSize: number;
        totalAccesses: number;
        mostAccessed: Array<{ key: string; count: number }>;
    } {
        const sizeStmt = db.prepare(
            "SELECT COUNT(*) as count FROM equity_cache"
        );
        const size = (sizeStmt.get() as { count: number }).count;

        const totalAccessStmt = db.prepare(
            "SELECT SUM(access_count) as total FROM equity_cache"
        );
        const totalAccesses =
            (totalAccessStmt.get() as { total: number | null }).total || 0;

        const topAccessedStmt = db.prepare(`
            SELECT key, access_count 
            FROM equity_cache 
            ORDER BY access_count DESC 
            LIMIT 10
        `);
        const mostAccessed = topAccessedStmt.all() as Array<{
            key: string;
            count: number;
        }>;

        return {
            size,
            memoryCacheSize: this.inMemoryCache.size,
            maxMemoryCacheSize: this.maxMemoryCacheSize,
            totalAccesses,
            mostAccessed,
        };
    }

    /**
     * Clean up old entries (optional TTL)
     *
     * @param maxAgeMs - Maximum age in milliseconds (default: 30 days)
     */
    cleanup(maxAgeMs: number = 30 * 24 * 60 * 60 * 1000): number {
        const cutoff = Date.now() - maxAgeMs;
        const stmt = db.prepare(
            "DELETE FROM equity_cache WHERE last_accessed < ?"
        );
        const result = stmt.run(cutoff);
        return result.changes;
    }

    /**
     * Vacuum database to reclaim space
     */
    vacuum(): void {
        db.exec("VACUUM");
    }
}

/**
 * Global persistent lookup table instance
 */
let globalPersistentLookupTable: PersistentEquityLookupTable | null = null;

/**
 * Get or create the global persistent lookup table
 */
export function getPersistentLookupTable(
    maxMemoryCacheSize?: number
): PersistentEquityLookupTable {
    if (!globalPersistentLookupTable) {
        globalPersistentLookupTable = new PersistentEquityLookupTable(
            maxMemoryCacheSize
        );
    }
    return globalPersistentLookupTable;
}
