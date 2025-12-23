import { parseHole, parseBoard } from "@common/interfaces";
import {
    computeEquityWithCache,
    clearEquityCache,
    getCacheStats,
} from "./equityLookup";
import { computeEquity } from "./equity";

describe("EquityLookupTable", () => {
    beforeEach(() => {
        // Clear cache before each test
        clearEquityCache();
    });

    describe("Basic caching", () => {
        it("should cache and return cached results", () => {
            const player1 = parseHole("14h 14d"); // Pocket Aces
            const player2 = parseHole("13h 13d"); // Pocket Kings
            const board = parseBoard(""); // Pre-flop

            // First call: should compute
            const { result: result1, fromCache: fromCache1 } =
                computeEquityWithCache([player1, player2], board, {
                    mode: "exact",
                });

            // Second call: should return cached result
            const { result: result2, fromCache: fromCache2 } =
                computeEquityWithCache([player1, player2], board, {
                    mode: "exact",
                });

            // First call should not be from cache, second should be
            expect(fromCache1).toBe(false);
            expect(fromCache2).toBe(true);

            // Results should be identical
            expect(result1.win[0]).toBe(result2.win[0]);
            expect(result1.win[1]).toBe(result2.win[1]);
            expect(result1.tie[0]).toBe(result2.tie[0]);
            expect(result1.samples).toBe(result2.samples);
        });

        it("should handle different calculation modes separately", () => {
            const player1 = parseHole("14h 14d");
            const player2 = parseHole("13h 13d");
            const board = parseBoard("");

            // Exact mode
            const { result: exactResult } = computeEquityWithCache(
                [player1, player2],
                board,
                {
                    mode: "exact",
                }
            );

            // MC mode (different cache entry)
            const { result: mcResult } = computeEquityWithCache(
                [player1, player2],
                board,
                {
                    mode: "mc",
                    iterations: 1000,
                }
            );

            // Should be different results (MC is approximate)
            expect(exactResult.samples).toBeGreaterThan(mcResult.samples);
        });

        it("should handle board cards correctly", () => {
            const player1 = parseHole("14h 14d");
            const player2 = parseHole("13h 13d");
            const board = parseBoard("12h 11h 10h"); // Flop

            const { result: result1 } = computeEquityWithCache(
                [player1, player2],
                board,
                {
                    mode: "exact",
                }
            );

            const { result: result2 } = computeEquityWithCache(
                [player1, player2],
                board,
                {
                    mode: "exact",
                }
            );

            // Should be cached
            expect(result1.win[0]).toBe(result2.win[0]);
        });
    });

    describe("Cache management", () => {
        it("should track cache size", () => {
            const stats1 = getCacheStats();
            expect(stats1.size).toBe(0);

            const player1 = parseHole("14h 14d");
            const player2 = parseHole("13h 13d");
            const board = parseBoard("");

            computeEquityWithCache([player1, player2], board, {
                mode: "exact",
            });

            const stats2 = getCacheStats();
            expect(stats2.size).toBe(1);
        });

        it("should clear cache", () => {
            const player1 = parseHole("14h 14d");
            const player2 = parseHole("13h 13d");
            const board = parseBoard("");

            computeEquityWithCache([player1, player2], board, {
                mode: "exact",
            });

            expect(getCacheStats().size).toBe(1);

            clearEquityCache();

            expect(getCacheStats().size).toBe(0);
        });
    });

    describe("Key normalization", () => {
        it("should handle different card orders as same scenario", () => {
            const player1a = parseHole("14h 14d");
            const player1b = parseHole("14d 14h"); // Same cards, different order
            const player2 = parseHole("13h 13d");
            const board = parseBoard("");

            const { result: result1 } = computeEquityWithCache(
                [player1a, player2],
                board,
                {
                    mode: "exact",
                }
            );

            // Should use cached result (same scenario)
            const { result: result2 } = computeEquityWithCache(
                [player1b, player2],
                board,
                {
                    mode: "exact",
                }
            );

            expect(result1.win[0]).toBe(result2.win[0]);
            expect(result1.win[1]).toBe(result2.win[1]);
        });
    });

    describe("Performance", () => {
        it("should be faster on second call (cached)", () => {
            const player1 = parseHole("14h 14d");
            const player2 = parseHole("13h 13d");
            const board = parseBoard("12h 11h 10h"); // Flop (smaller calculation)

            // First call
            const start1 = performance.now();
            const { result: result1 } = computeEquityWithCache(
                [player1, player2],
                board,
                {
                    mode: "exact",
                }
            );
            const time1 = performance.now() - start1;

            // Second call (should be cached)
            const start2 = performance.now();
            const { result: result2 } = computeEquityWithCache(
                [player1, player2],
                board,
                {
                    mode: "exact",
                }
            );
            const time2 = performance.now() - start2;

            // Cached call should be much faster
            expect(time2).toBeLessThan(time1);
            expect(result1.win[0]).toBe(result2.win[0]);
        });
    });

    describe("Correctness", () => {
        it("should produce same results as computeEquity", () => {
            const player1 = parseHole("14h 14d");
            const player2 = parseHole("13h 13d");
            const board = parseBoard("12h 11h 10h");

            const { result: cachedResult } = computeEquityWithCache(
                [player1, player2],
                board,
                {
                    mode: "exact",
                }
            );

            // Clear cache and compute directly
            clearEquityCache();
            const directResult = computeEquity([player1, player2], board, {
                mode: "exact",
            });

            // Results should be identical
            expect(cachedResult.win[0]).toBeCloseTo(directResult.win[0], 5);
            expect(cachedResult.win[1]).toBeCloseTo(directResult.win[1], 5);
            expect(cachedResult.tie[0]).toBeCloseTo(directResult.tie[0], 5);
            expect(cachedResult.samples).toBe(directResult.samples);
        });
    });
});
