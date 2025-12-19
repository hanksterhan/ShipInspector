/**
 * Example usage of the equity lookup table
 *
 * This demonstrates how to use the lookup table for fast equity queries.
 */

import { Hole, parseHole, parseBoard } from "@common/interfaces";
import {
    computeEquityWithCache,
    clearEquityCache,
    getCacheStats,
} from "./equityLookup";

/**
 * Example 1: Basic usage with caching
 */
export function exampleBasicUsage() {
    const player1 = parseHole("14h 14d"); // Pocket Aces
    const player2 = parseHole("13h 13d"); // Pocket Kings
    const board = parseBoard(""); // Pre-flop

    // First call: computes and caches
    const result1 = computeEquityWithCache([player1, player2], board, {
        mode: "exact",
    });

    // Second call: returns cached result (instant)
    const result2 = computeEquityWithCache([player1, player2], board, {
        mode: "exact",
    });

    console.log("First call (computed):", result1);
    console.log("Second call (cached):", result2);
    console.log("Results are identical:", result1 === result2);
}

/**
 * Example 2: Cache statistics
 */
export function exampleCacheStats() {
    // Get cache statistics
    const stats = getCacheStats();
    console.log("Cache stats:", stats);
    console.log(`Total entries: ${stats.size}`);
    console.log(`Hot cache size: ${stats.memoryCacheSize}`);
    console.log(`Total accesses: ${stats.totalAccesses}`);
    console.log("Most accessed scenarios:", stats.mostAccessed);
}

/**
 * Example 3: Cache management
 */
export function exampleCacheManagement() {
    // Get cache statistics
    const stats = getCacheStats();
    console.log("Cache stats:", stats);

    // Clear cache if needed
    clearEquityCache();
    console.log("Cache cleared");

    // Get new stats
    const newStats = getCacheStats();
    console.log("New cache stats:", newStats);
}

/**
 * Example 4: Integration with existing code
 *
 * To use the lookup table in your existing codebase, simply replace:
 *   computeEquity(players, board, opts, dead)
 * with:
 *   computeEquityWithCache(players, board, opts, dead)
 *
 * The API is identical, but now with automatic caching!
 */
export function exampleIntegration() {
    const players: Hole[] = [parseHole("14h 14d"), parseHole("13h 13d")];
    const board = parseBoard("12h 11h 10h"); // Flop

    // Drop-in replacement - same API, but with caching
    const result = computeEquityWithCache(players, board, {
        mode: "exact",
    });

    return result;
}

/**
 * Performance comparison example
 */
export function examplePerformanceComparison() {
    const player1 = parseHole("14h 14d");
    const player2 = parseHole("13h 13d");
    const board = parseBoard("");

    // Without cache (original function)
    const start1 = performance.now();
    // ... computeEquity call ...
    const time1 = performance.now() - start1;

    // With cache (first call - computes)
    const start2 = performance.now();
    computeEquityWithCache([player1, player2], board, { mode: "exact" });
    const time2 = performance.now() - start2;

    // With cache (second call - cached, should be < 1ms)
    const start3 = performance.now();
    computeEquityWithCache([player1, player2], board, { mode: "exact" });
    const time3 = performance.now() - start3;

    console.log(`Without cache: ${time1}ms`);
    console.log(`With cache (first): ${time2}ms`);
    console.log(`With cache (cached): ${time3}ms`);
    console.log(`Speedup: ${(time1 / time3).toFixed(2)}x`);
}
