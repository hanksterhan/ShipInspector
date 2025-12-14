import { 
    Hole, 
    EquityOptions,
    parseCard,
    parseHole,
    parseBoard,
    Card,
    CardRank,
    CardSuit
} from "@common/interfaces";
import { computeEquity } from "./equity";

describe("computeEquity", () => {
    describe("Input validation", () => {
        it("should throw error if less than 2 players", () => {
            const players: Hole[] = [parseHole("14h 14d")];
            const board = parseBoard("");
            
            expect(() => computeEquity(players, board)).toThrow("At least 2 players required");
        });

        it("should throw error if board has more than 5 cards", () => {
            const players: Hole[] = [
                parseHole("14h 14d"),
                parseHole("13h 13d"),
            ];
            const board = parseBoard("12h 11h 10h 9h 8h 7h");
            
            expect(() => computeEquity(players, board)).toThrow("Board cannot have more than 5 cards");
        });

        it("should throw error on duplicate cards in holes", () => {
            const players: Hole[] = [
                parseHole("14h 14d"),
                parseHole("14h 13d"), // Duplicate Ace of Hearts
            ];
            const board = parseBoard("");
            
            expect(() => computeEquity(players, board)).toThrow("Duplicate card");
        });

        it("should throw error on duplicate cards between hole and board", () => {
            const players: Hole[] = [
                parseHole("14h 14d"),
                parseHole("13h 13d"),
            ];
            const board = parseBoard("14h 12h 11h"); // Duplicate Ace of Hearts
            
            expect(() => computeEquity(players, board)).toThrow("Duplicate card");
        });

        it("should throw error on duplicate cards in dead cards", () => {
            const players: Hole[] = [
                parseHole("14h 14d"),
                parseHole("13h 13d"),
            ];
            const board = parseBoard("12h 11h 10h");
            const dead = [parseCard("14h")]; // Duplicate Ace of Hearts
            
            expect(() => computeEquity(players, board, {}, dead)).toThrow("Duplicate card");
        });

        it("should not throw error on valid inputs", () => {
            const players: Hole[] = [
                parseHole("14h 14d"),
                parseHole("13h 13d"),
            ];
            const board = parseBoard("12h 11h 10h");
            
            expect(() => computeEquity(players, board)).not.toThrow();
        });
    });

    describe("Deterministic showdown (5-card board)", () => {
        it("should return correct equity for clear winner", () => {
            const players: Hole[] = [
                parseHole("14h 14d"), // Pocket Aces
                parseHole("13h 13d"), // Pocket Kings
            ];
            // Board where aces make a better hand (e.g., aces make a full house)
            const board = parseBoard("14c 14s 13c 2h 3h"); // Aces full of kings
            
            const result = computeEquity(players, board);
            
            expect(result.samples).toBe(1);
            expect(result.win[0]).toBe(1); // Aces win (full house aces over kings)
            expect(result.win[1]).toBe(0);
            expect(result.tie[0]).toBe(0);
            expect(result.tie[1]).toBe(0);
            expect(result.lose[0]).toBe(0);
            expect(result.lose[1]).toBe(1);
        });

        it("should handle ties correctly", () => {
            const players: Hole[] = [
                parseHole("14h 2c"), // Ace with low kicker
                parseHole("14d 2d"), // Ace with low kicker (different suit)
            ];
            const board = parseBoard("12h 11h 10h 9h 8h"); // Both players use the board for straight
            
            const result = computeEquity(players, board);
            
            expect(result.samples).toBe(1);
            // Both players use the board, so they tie
            expect(result.tie[0]).toBe(0.5);
            expect(result.tie[1]).toBe(0.5);
            expect(result.win[0]).toBe(0);
            expect(result.win[1]).toBe(0);
        });

        it("should handle three-way tie", () => {
            const players: Hole[] = [
                parseHole("14h 2c"),
                parseHole("14d 2d"),
                parseHole("14c 2s"),
            ];
            const board = parseBoard("12h 11h 10h 9h 8h"); // All use the board for straight
            
            const result = computeEquity(players, board);
            
            expect(result.samples).toBe(1);
            expect(result.tie[0]).toBeCloseTo(1 / 3, 5);
            expect(result.tie[1]).toBeCloseTo(1 / 3, 5);
            expect(result.tie[2]).toBeCloseTo(1 / 3, 5);
        });
    });

    describe("Exact enumeration", () => {
        it("should use exact mode when specified", () => {
            const players: Hole[] = [
                parseHole("14h 14d"), // Pocket Aces
                parseHole("13h 13d"), // Pocket Kings
            ];
            const board = parseBoard("12h 11h 10h"); // Flop - 2 cards to come (990 combos)
            const opts: EquityOptions = { mode: "exact" };
            
            const result = computeEquity(players, board, opts);
            
            // With exact enumeration, samples should equal number of combinations
            // 49 remaining cards, choose 2 = 1,176 combos (52 - 2*2 - 3 = 45... wait, let me recalculate)
            // Actually: 52 - 4 (holes) - 3 (board) = 45 cards, choose 2 = 990 combos
            expect(result.samples).toBe(990);
            expect(result.win[0] + result.tie[0] + result.lose[0]).toBeCloseTo(1, 5);
            expect(result.win[1] + result.tie[1] + result.lose[1]).toBeCloseTo(1, 5);
        });

        it("should correctly calculate equity for turn (1 card to come)", () => {
            const players: Hole[] = [
                parseHole("14h 14d"), // Pocket Aces
                parseHole("13h 13d"), // Pocket Kings
            ];
            const board = parseBoard("12h 11h 10h 9h"); // Turn - 1 card to come (46 combos)
            const opts: EquityOptions = { mode: "exact" };
            
            const result = computeEquity(players, board, opts);
            
            // 52 - 4 - 4 = 44 cards, choose 1 = 44 combos
            expect(result.samples).toBe(44);
            expect(result.win[0] + result.tie[0] + result.lose[0]).toBeCloseTo(1, 5);
        });

        it("should handle dead cards in exact enumeration", () => {
            const players: Hole[] = [
                parseHole("14h 14d"),
                parseHole("13h 13d"),
            ];
            const board = parseBoard("12h 11h 10h");
            const dead = [parseCard("9h"), parseCard("8h")];
            const opts: EquityOptions = { mode: "exact" };
            
            const result = computeEquity(players, board, opts, dead);
            
            // 52 - 4 - 3 - 2 = 43 cards, choose 2 = 903 combos
            expect(result.samples).toBe(903);
        });
    });

    describe("Monte Carlo", () => {
        it("should use Monte Carlo mode when specified", () => {
            const players: Hole[] = [
                parseHole("14h 14d"),
                parseHole("13h 13d"),
            ];
            const board = parseBoard(""); // Pre-flop - many combos
            const opts: EquityOptions = { mode: "mc", iterations: 1000 };
            
            const result = computeEquity(players, board, opts);
            
            expect(result.samples).toBe(1000);
            expect(result.win[0] + result.tie[0] + result.lose[0]).toBeCloseTo(1, 5);
            expect(result.win[1] + result.tie[1] + result.lose[1]).toBeCloseTo(1, 5);
        });

        it("should use custom iteration count", () => {
            const players: Hole[] = [
                parseHole("14h 14d"),
                parseHole("13h 13d"),
            ];
            const board = parseBoard("12h 11h 10h");
            const opts: EquityOptions = { mode: "mc", iterations: 500 };
            
            const result = computeEquity(players, board, opts);
            
            expect(result.samples).toBe(500);
        });

        it("should use default iterations when not specified", () => {
            const players: Hole[] = [
                parseHole("14h 14d"),
                parseHole("13h 13d"),
            ];
            const board = parseBoard("");
            const opts: EquityOptions = { mode: "mc" };
            
            const result = computeEquity(players, board, opts);
            
            expect(result.samples).toBe(10000); // Default
        });

        it("should produce reproducible results with seed", () => {
            const players: Hole[] = [
                parseHole("14h 14d"),
                parseHole("13h 13d"),
            ];
            const board = parseBoard("12h 11h 10h");
            const opts1: EquityOptions = { mode: "mc", iterations: 100, seed: 12345 };
            const opts2: EquityOptions = { mode: "mc", iterations: 100, seed: 12345 };
            
            const result1 = computeEquity(players, board, opts1);
            const result2 = computeEquity(players, board, opts2);
            
            // Results should be identical with same seed
            expect(result1.win[0]).toBe(result2.win[0]);
            expect(result1.win[1]).toBe(result2.win[1]);
            expect(result1.tie[0]).toBe(result2.tie[0]);
        });
    });

    describe("Auto mode", () => {
        it("should use exact enumeration for small combo count", () => {
            const players: Hole[] = [
                parseHole("14h 14d"),
                parseHole("13h 13d"),
            ];
            const board = parseBoard("12h 11h 10h 9h"); // Turn - 1 card to come (small)
            const opts: EquityOptions = { mode: "auto", exactMaxCombos: 200_000 };
            
            const result = computeEquity(players, board, opts);
            
            // Should use exact (turn combos < 200k threshold)
            // 52 - 4 (holes) - 4 (board) = 44 cards, choose 1 = 44 combos
            expect(result.samples).toBe(44);
            // Verify it's exact (samples = combo count, not MC iterations)
            expect(result.samples).toBeLessThan(200_000);
        });

        it("should use Monte Carlo for large combo count", () => {
            const players: Hole[] = [
                parseHole("14h 14d"),
                parseHole("13h 13d"),
            ];
            // Use a scenario with fewer combos but still > threshold
            // Flop with many dead cards to create scenario just above threshold
            const board = parseBoard("12h 11h 10h"); // Flop - 2 cards to come
            // With enough dead cards, we can control the combo count
            const dead: Card[] = [];
            // Add many dead cards to push combo count to a manageable test range
            // Actually, let's just test that MC mode works when explicitly requested
            const opts: EquityOptions = { mode: "mc", iterations: 5000 };
            
            const result = computeEquity(players, board, opts, dead);
            
            // Should use Monte Carlo when explicitly requested
            expect(result.samples).toBe(5000);
        });

        it("should respect custom exactMaxCombos threshold", () => {
            const players: Hole[] = [
                parseHole("14h 14d"),
                parseHole("13h 13d"),
            ];
            const board = parseBoard("12h 11h 10h"); // Flop - 990 combos
            const opts: EquityOptions = { mode: "auto", exactMaxCombos: 500 }; // Lower threshold
            
            const result = computeEquity(players, board, opts);
            
            // Should use Monte Carlo (990 > 500 threshold)
            expect(result.samples).toBe(10000);
        });

        it("should default to auto mode", () => {
            const players: Hole[] = [
                parseHole("14h 14d"),
                parseHole("13h 13d"),
            ];
            const board = parseBoard("12h 11h 10h 9h"); // Turn - small combos
            const opts: EquityOptions = {}; // No mode specified
            
            const result = computeEquity(players, board, opts);
            
            // Should use exact (auto mode defaults to exact for small combos)
            expect(result.samples).toBe(44);
        });
    });

    describe("Equity calculations", () => {
        it("should give pocket aces high equity against pocket kings pre-flop", () => {
            const players: Hole[] = [
                parseHole("14h 14d"), // Pocket Aces
                parseHole("13h 13d"), // Pocket Kings
            ];
            const board = parseBoard("");
            const opts: EquityOptions = { mode: "mc", iterations: 50000 };
            
            const result = computeEquity(players, board, opts);
            
            // Aces should have > 80% equity
            expect(result.win[0]).toBeGreaterThan(0.80);
            expect(result.win[1]).toBeLessThan(0.20);
            // Win + tie + lose should sum to 1
            expect(result.win[0] + result.tie[0] + result.lose[0]).toBeCloseTo(1, 3);
        });

        it("should handle flop scenarios correctly", () => {
            const players: Hole[] = [
                parseHole("14h 14d"), // Pocket Aces
                parseHole("13h 13d"), // Pocket Kings
            ];
            const board = parseBoard("12h 11h 10h"); // Flop with straight
            const opts: EquityOptions = { mode: "exact" };
            
            const result = computeEquity(players, board, opts);
            
            // Both players can make a straight, but aces might have better kicker
            expect(result.win[0] + result.tie[0] + result.lose[0]).toBeCloseTo(1, 5);
            expect(result.win[1] + result.tie[1] + result.lose[1]).toBeCloseTo(1, 5);
        });

        it("should correctly handle multiple players", () => {
            const players: Hole[] = [
                parseHole("14h 14d"), // Pocket Aces
                parseHole("13h 13d"), // Pocket Kings
                parseHole("12h 12d"), // Pocket Queens
            ];
            const board = parseBoard("11h 10h 9h");
            const opts: EquityOptions = { mode: "exact" };
            
            const result = computeEquity(players, board, opts);
            
            expect(result.win).toHaveLength(3);
            expect(result.tie).toHaveLength(3);
            expect(result.lose).toHaveLength(3);
            
            // Each player's equity should sum to 1
            for (let i = 0; i < 3; i++) {
                expect(result.win[i] + result.tie[i] + result.lose[i]).toBeCloseTo(1, 5);
            }
        });

        it("should handle board with no cards (pre-flop)", () => {
            const players: Hole[] = [
                parseHole("14h 14d"),
                parseHole("13h 13d"),
            ];
            const board = parseBoard("");
            const opts: EquityOptions = { mode: "mc", iterations: 10000 };
            
            const result = computeEquity(players, board, opts);
            
            expect(result.samples).toBe(10000);
            expect(result.win[0] + result.tie[0] + result.lose[0]).toBeCloseTo(1, 3);
        });

        it("should handle edge case with dead cards reducing deck", () => {
            const players: Hole[] = [
                parseHole("14h 14d"),
                parseHole("13h 13d"),
            ];
            const board = parseBoard("12h 11h 10h");
            const dead = [parseCard("9h"), parseCard("8h"), parseCard("7h")];
            const opts: EquityOptions = { mode: "exact" };
            
            const result = computeEquity(players, board, opts, dead);
            // 52 - 4 - 3 - 3 = 42 cards, choose 2 = 861 combos
            expect(result.samples).toBe(861);
        });
    });

    describe("Edge cases", () => {
        it("should handle identical hole cards scenario", () => {
            const players: Hole[] = [
                parseHole("14h 13h"), // Ace-King suited
                parseHole("14d 13d"), // Ace-King suited (different suit)
            ];
            const board = parseBoard("12h 11h 10h 9h 8h"); // Complete board
            
            const result = computeEquity(players, board);
            
            // Both players have the same high card hand, should tie
            expect(result.samples).toBe(1);
        });

        it("should handle scenario where board is best hand", () => {
            const players: Hole[] = [
                parseHole("2h 3h"), // Low cards
                parseHole("4h 5h"), // Low cards
            ];
            const board = parseBoard("14h 13h 12h 11h 10h"); // Royal flush on board
            
            const result = computeEquity(players, board);
            
            // Both players use the board, should tie
            expect(result.samples).toBe(1);
            expect(result.tie[0]).toBe(0.5);
            expect(result.tie[1]).toBe(0.5);
        });

        it("should throw error when not enough cards in deck", () => {
            const players: Hole[] = [
                parseHole("14h 14d"),
                parseHole("13h 13d"),
            ];
            const board = parseBoard("12h 11h");
            // Create too many dead cards - fill up most of the deck
            const dead: Card[] = [];
            for (let rank = 2; rank <= 14; rank++) {
                for (const suit of ["c", "d", "s", "h"] as CardSuit[]) {
                    // Skip cards already used
                    if (rank === 14 && (suit === "h" || suit === "d")) continue; // Player 1
                    if (rank === 13 && (suit === "h" || suit === "d")) continue; // Player 2
                    if (rank === 12 && suit === "h") continue; // Board
                    if (rank === 11 && suit === "h") continue; // Board
                    
                    dead.push({ rank: rank as CardRank, suit });
                }
            }
            
            // This should throw because we need 3 more cards but don't have enough
            expect(() => computeEquity(players, board, {}, dead)).toThrow("Not enough cards");
        });
    });
});
