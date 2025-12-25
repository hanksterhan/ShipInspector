import { Hole, parseCard, parseHole, parseBoard } from "@common/interfaces";
import { computeEquity } from "./equity";

describe("computeEquity", () => {
    describe("Input validation", () => {
        it("should throw error if less than 2 players", async () => {
            const players: Hole[] = [parseHole("14h 14d")];
            const board = parseBoard("");

            await expect(computeEquity(players, board)).rejects.toThrow(
                "At least 2 players required"
            );
        });

        it("should throw error if board has more than 5 cards", async () => {
            const players: Hole[] = [
                parseHole("14h 14d"),
                parseHole("13h 13d"),
            ];
            const board = parseBoard("12h 11h 10h 9h 8h 7h");

            await expect(computeEquity(players, board)).rejects.toThrow(
                "Board cannot have more than 5 cards"
            );
        });

        it("should throw error on duplicate cards in holes", async () => {
            const players: Hole[] = [
                parseHole("14h 14d"),
                parseHole("14h 13d"), // Duplicate Ace of Hearts
            ];
            const board = parseBoard("");

            await expect(computeEquity(players, board)).rejects.toThrow(
                "Duplicate card"
            );
        });

        it("should throw error on duplicate cards between hole and board", async () => {
            const players: Hole[] = [
                parseHole("14h 14d"),
                parseHole("13h 13d"),
            ];
            const board = parseBoard("14h 12h 11h 10h 9h"); // Duplicate Ace of Hearts

            await expect(computeEquity(players, board)).rejects.toThrow(
                "Duplicate card"
            );
        });

        it("should throw error on duplicate cards in dead cards", async () => {
            const players: Hole[] = [
                parseHole("14h 14d"),
                parseHole("13h 13d"),
            ];
            const board = parseBoard("");
            const dead = [parseCard("14h")]; // Duplicate Ace of Hearts

            await expect(
                computeEquity(players, board, {}, dead)
            ).rejects.toThrow("Duplicate card");
        });

        it("should throw error for incomplete boards (flop/turn)", async () => {
            const players: Hole[] = [
                parseHole("14h 14d"),
                parseHole("13h 13d"),
            ];
            const board = parseBoard("12h 11h 10h"); // Flop (3 cards)

            await expect(computeEquity(players, board)).rejects.toThrow(
                "Equity calculation currently only supports preflop (empty board) or complete board (river showdown)"
            );
        });
    });

    describe("Deterministic showdown (5-card board)", () => {
        it("should return correct equity for clear winner", async () => {
            const players: Hole[] = [
                parseHole("14h 14d"), // Pocket Aces
                parseHole("13h 13d"), // Pocket Kings
            ];
            // Board where aces make a better hand (e.g., aces make a full house)
            const board = parseBoard("14c 14s 13c 2h 3h"); // Aces full of kings

            const result = await computeEquity(players, board);

            expect(result.samples).toBe(1);
            expect(result.win[0]).toBe(1); // Aces win (full house aces over kings)
            expect(result.win[1]).toBe(0);
            expect(result.tie[0]).toBe(0);
            expect(result.tie[1]).toBe(0);
            expect(result.lose[0]).toBe(0);
            expect(result.lose[1]).toBe(1);
        });

        it("should handle ties correctly", async () => {
            const players: Hole[] = [
                parseHole("14h 13h"), // AK hearts
                parseHole("14d 13d"), // AK diamonds
            ];
            const board = parseBoard("12h 11h 10h 9h 8h"); // Board makes straight flush for both

            const result = await computeEquity(players, board);

            expect(result.samples).toBe(1);
            expect(result.win[0]).toBe(0);
            expect(result.win[1]).toBe(0);
            expect(result.tie[0]).toBe(0.5);
            expect(result.tie[1]).toBe(0.5);
            expect(result.lose[0]).toBe(0.5);
            expect(result.lose[1]).toBe(0.5);
        });

        it("should handle three-way tie", async () => {
            const players: Hole[] = [
                parseHole("2h 3h"),
                parseHole("2d 3d"),
                parseHole("2c 3c"),
            ];
            const board = parseBoard("14h 14d 14c 14s 13h"); // Four aces on board

            const result = await computeEquity(players, board);

            expect(result.samples).toBe(1);
            expect(result.win[0]).toBe(0);
            expect(result.win[1]).toBe(0);
            expect(result.win[2]).toBe(0);
            expect(result.tie[0]).toBeCloseTo(1 / 3);
            expect(result.tie[1]).toBeCloseTo(1 / 3);
            expect(result.tie[2]).toBeCloseTo(1 / 3);
        });
    });

    describe("Rust WASM preflop calculations", () => {
        it("should give pocket aces high equity against pocket kings pre-flop", async () => {
            const players: Hole[] = [
                parseHole("14h 14d"), // Pocket Aces
                parseHole("13h 13d"), // Pocket Kings
            ];
            const board = parseBoard("");

            const result = await computeEquity(players, board, {
                mode: "rust",
            });

            // Aces should have roughly 82% equity vs Kings
            expect(result.win[0]).toBeGreaterThan(0.8);
            expect(result.win[0]).toBeLessThan(0.85);
            expect(result.win[1]).toBeGreaterThan(0.15);
            expect(result.win[1]).toBeLessThan(0.2);
            expect(result.samples).toBeGreaterThan(1_000_000); // Rust calculates all combos
        });

        it("should handle multiple players preflop", async () => {
            const players: Hole[] = [
                parseHole("14h 14d"), // Pocket Aces
                parseHole("13h 13d"), // Pocket Kings
                parseHole("12h 12d"), // Pocket Queens
            ];
            const board = parseBoard("");

            const result = await computeEquity(players, board, {
                mode: "rust",
            });

            // Aces should have highest equity
            expect(result.win[0]).toBeGreaterThan(result.win[1]);
            expect(result.win[1]).toBeGreaterThan(result.win[2]);

            // All equities should sum to 1 (accounting for ties)
            const totalEquity =
                result.win.reduce((a, b) => a + b, 0) +
                result.tie.reduce((a, b) => a + b, 0);
            expect(totalEquity).toBeCloseTo(1, 2);
        });

        it("should handle suited connectors vs pocket pair", async () => {
            const players: Hole[] = [
                parseHole("11h 10h"), // JT suited
                parseHole("9h 9d"), // Pocket 9s
            ];
            const board = parseBoard("");

            const result = await computeEquity(players, board, {
                mode: "rust",
            });

            // Pocket pair should have slight edge
            expect(result.win[1]).toBeGreaterThan(result.win[0]);
            expect(result.win[1]).toBeGreaterThan(0.5);
            expect(result.win[1]).toBeLessThan(0.6);
        });

        it("should handle dead cards in preflop calculation", async () => {
            const players: Hole[] = [
                parseHole("14h 14d"), // Pocket Aces
                parseHole("13h 13d"), // Pocket Kings
            ];
            const board = parseBoard("");
            const dead = [parseCard("14c"), parseCard("14s")]; // Two more aces dead

            const result = await computeEquity(
                players,
                board,
                { mode: "rust" },
                dead
            );

            // With two aces dead, kings should have better equity than normal
            expect(result.win[1]).toBeGreaterThan(0.3); // Kings do better
            expect(result.win[0]).toBeLessThan(0.7); // Aces do worse
        });
    });

    describe("Edge cases", () => {
        it("should handle scenario where board is best hand", async () => {
            const players: Hole[] = [parseHole("2h 3h"), parseHole("2d 3d")];
            const board = parseBoard("14h 14d 14c 14s 13h"); // Four aces on board

            const result = await computeEquity(players, board);

            // Should be a tie since board plays
            expect(result.win[0]).toBe(0);
            expect(result.win[1]).toBe(0);
            expect(result.tie[0]).toBe(0.5);
            expect(result.tie[1]).toBe(0.5);
        });

        it("should throw error when not enough cards in deck", async () => {
            const players: Hole[] = [
                parseHole("14h 14d"),
                parseHole("13h 13d"),
            ];
            const board = parseBoard("");
            // Create 48 dead cards (leaving only 0 cards for the board)
            const dead: any[] = [];
            const suits = ["c", "s"];
            const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
            for (const suit of suits) {
                for (const rank of ranks) {
                    dead.push({ rank, suit });
                }
            }
            dead.push({ rank: 14, suit: "c" });
            dead.push({ rank: 14, suit: "s" });
            dead.push({ rank: 13, suit: "c" });
            dead.push({ rank: 13, suit: "s" });
            dead.push({ rank: 12, suit: "h" });
            dead.push({ rank: 12, suit: "d" });

            await expect(
                computeEquity(players, board, {}, dead)
            ).rejects.toThrow("Not enough cards in deck");
        });
    });
});
