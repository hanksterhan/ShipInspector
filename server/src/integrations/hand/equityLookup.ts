import {
    Board,
    Hole,
    EquityResult,
    EquityOptions,
    Card,
} from "@common/interfaces";
import { computeEquity } from "./equity";
import {
    PersistentEquityLookupTable,
    getPersistentLookupTable,
} from "./equityLookupPersistent";

/**
 * Lookup table for fast equity queries (SQLite)
 *
 * This provides a high-performance cache for equity calculations using SQLite.
 * Keys are canonical representations of the scenario (holes + board + dead cards).
 * Values are pre-computed equity results stored in a SQLite database.
 *
 * Performance characteristics:
 * - Fast lookups (~1-5ms, <1ms with hot cache)
 * - Persistent across server restarts
 * - Hot cache in memory for frequently accessed items
 * - Unlimited size (millions of entries)
 * - Queryable and analyzable via SQL
 */

/**
 * Create a canonical key for an equity scenario
 *
 * Strategy:
 * 1. Normalize holes (sort cards within each hole, sort holes by canonical form)
 * 2. Normalize board (sort cards)
 * 3. Normalize dead cards (sort cards)
 * 4. Create deterministic string key
 *
 * This ensures that isomorphic scenarios (same cards, different order) get the same key.
 */
export function createEquityKey(
    players: readonly Hole[],
    board: Board,
    dead: readonly Card[],
    options?: EquityOptions
): string {
    // Normalize holes: sort cards within each hole, then sort holes
    const normalizedHoles = players.map((hole) => {
        const cards = [...hole.cards];
        // Sort by rank (descending), then suit for consistency
        cards.sort((a, b) => {
            if (a.rank !== b.rank) {
                return b.rank - a.rank; // Higher ranks first
            }
            return a.suit.localeCompare(b.suit);
        });
        return cards.map((c) => `${c.rank}${c.suit}`).join("");
    });

    // Sort holes by their canonical representation
    normalizedHoles.sort();

    // Normalize board: sort cards
    const normalizedBoard = [...board.cards];
    normalizedBoard.sort((a, b) => {
        if (a.rank !== b.rank) {
            return b.rank - a.rank;
        }
        return a.suit.localeCompare(b.suit);
    });
    const boardStr = normalizedBoard.map((c) => `${c.rank}${c.suit}`).join("");

    // Normalize dead cards: sort cards
    const normalizedDead = [...dead];
    normalizedDead.sort((a, b) => {
        if (a.rank !== b.rank) {
            return b.rank - a.rank;
        }
        return a.suit.localeCompare(b.suit);
    });
    const deadStr = normalizedDead.map((c) => `${c.rank}${c.suit}`).join("");

    // Include options in key if they affect the result
    const optionsStr =
        options?.mode === "exact"
            ? "exact"
            : options?.mode === "mc"
              ? `mc:${options.iterations ?? 10000}`
              : "auto";

    // Create composite key
    return `equity:${normalizedHoles.join("|")}:${boardStr}:${deadStr}:${optionsStr}`;
}

/**
 * Global persistent lookup table instance (SQLite)
 */
let globalPersistentLookupTable: PersistentEquityLookupTable | null = null;

/**
 * Get or create the global lookup table (SQLite)
 */
export function getLookupTable(
    maxMemoryCacheSize?: number
): PersistentEquityLookupTable {
    if (!globalPersistentLookupTable) {
        globalPersistentLookupTable =
            getPersistentLookupTable(maxMemoryCacheSize);
    }
    return globalPersistentLookupTable;
}

/**
 * Compute equity with lookup table caching (SQLite)
 *
 * This is a drop-in replacement for computeEquity that adds caching.
 * It checks the SQLite database first, and if not found, computes and caches the result.
 *
 * The cache is stored in SQLite and persists across server restarts.
 */
export function computeEquityWithCache(
    players: readonly Hole[],
    board: Board,
    opts: EquityOptions = {},
    dead: readonly Card[] = []
): EquityResult {
    // Get or create the persistent lookup table
    const lookupTable = getLookupTable();

    // Try to get from cache
    const cached = lookupTable.get(players, board, dead, opts);
    if (cached !== null) {
        return cached;
    }

    // Compute result
    const result = computeEquity(players, board, opts, dead);

    // Store in cache
    lookupTable.set(players, board, dead, result, opts);

    return result;
}

/**
 * Clear the lookup table cache
 */
export function clearEquityCache(): void {
    const lookupTable = getLookupTable();
    lookupTable.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
    const lookupTable = getLookupTable();
    return lookupTable.getStats();
}

/**
 * Get the lookup table instance
 */
export function getLookupTableInstance(): PersistentEquityLookupTable {
    return getLookupTable();
}
