import { HandRank, Card, parseCard } from "@common/interfaces";
import { hand } from "./hand";

describe("Hand", () => {
    describe("evaluate7", () => {
        it("should throw error if not exactly 7 cards", () => {
            expect(() => hand.evaluate7([])).toThrow(
                "evaluate7 requires exactly 7 cards"
            );
            expect(() => hand.evaluate7([parseCard("2c")])).toThrow(
                "evaluate7 requires exactly 7 cards"
            );
            expect(() =>
                hand.evaluate7(new Array(8).fill(parseCard("2c")))
            ).toThrow("evaluate7 requires exactly 7 cards");
        });

        describe("Royal Flush", () => {
            it("should detect royal flush in hearts", () => {
                const cards: Card[] = [
                    parseCard("14h"), // Ace
                    parseCard("13h"), // King
                    parseCard("12h"), // Queen
                    parseCard("11h"), // Jack
                    parseCard("10h"), // Ten
                    parseCard("2c"), // extra
                    parseCard("3d"), // extra
                ];
                const result = hand.evaluate7(cards);
                expect(result.category).toBe(9);
                expect(result.tiebreak).toEqual([]);
            });

            it("should detect royal flush with extra cards", () => {
                const cards: Card[] = [
                    parseCard("14s"),
                    parseCard("13s"),
                    parseCard("12s"),
                    parseCard("11s"),
                    parseCard("10s"),
                    parseCard("9s"),
                    parseCard("8s"),
                ];
                const result = hand.evaluate7(cards);
                expect(result.category).toBe(9);
            });
        });

        describe("Straight Flush", () => {
            it("should detect straight flush (9-high)", () => {
                const cards: Card[] = [
                    parseCard("9h"),
                    parseCard("8h"),
                    parseCard("7h"),
                    parseCard("6h"),
                    parseCard("5h"),
                    parseCard("2c"),
                    parseCard("3d"),
                ];
                const result = hand.evaluate7(cards);
                expect(result.category).toBe(8);
                expect(result.tiebreak).toEqual([9]);
            });

            it("should detect straight flush (A-2-3-4-5 wheel)", () => {
                const cards: Card[] = [
                    parseCard("14c"),
                    parseCard("5c"),
                    parseCard("4c"),
                    parseCard("3c"),
                    parseCard("2c"),
                    parseCard("10d"),
                    parseCard("11d"),
                ];
                const result = hand.evaluate7(cards);
                expect(result.category).toBe(8);
                expect(result.tiebreak).toEqual([5]); // Wheel high card is 5
            });

            it("should prefer straight flush over flush", () => {
                const cards: Card[] = [
                    parseCard("8d"),
                    parseCard("7d"),
                    parseCard("6d"),
                    parseCard("5d"),
                    parseCard("4d"),
                    parseCard("3d"),
                    parseCard("2d"),
                ];
                const result = hand.evaluate7(cards);
                expect(result.category).toBe(8);
                expect(result.tiebreak).toEqual([8]);
            });
        });

        describe("Four of a Kind", () => {
            it("should detect four of a kind (Kings)", () => {
                const cards: Card[] = [
                    parseCard("13h"),
                    parseCard("13d"),
                    parseCard("13c"),
                    parseCard("13s"),
                    parseCard("7h"),
                    parseCard("2c"),
                    parseCard("3d"),
                ];
                const result = hand.evaluate7(cards);
                expect(result.category).toBe(7);
                expect(result.tiebreak).toEqual([13, 7]);
            });

            it("should use highest kicker for four of a kind", () => {
                const cards: Card[] = [
                    parseCard("10h"),
                    parseCard("10d"),
                    parseCard("10c"),
                    parseCard("10s"),
                    parseCard("14h"),
                    parseCard("9h"),
                    parseCard("2c"),
                ];
                const result = hand.evaluate7(cards);
                expect(result.category).toBe(7);
                expect(result.tiebreak).toEqual([10, 14]);
            });
        });

        describe("Full House", () => {
            it("should detect full house (Aces over Kings)", () => {
                const cards: Card[] = [
                    parseCard("14h"),
                    parseCard("14d"),
                    parseCard("14c"),
                    parseCard("13h"),
                    parseCard("13d"),
                    parseCard("2c"),
                    parseCard("3d"),
                ];
                const result = hand.evaluate7(cards);
                expect(result.category).toBe(6);
                expect(result.tiebreak).toEqual([14, 13]);
            });

            it("should prefer higher three of a kind in full house", () => {
                const cards: Card[] = [
                    parseCard("12h"),
                    parseCard("12d"),
                    parseCard("12c"),
                    parseCard("14h"),
                    parseCard("14d"),
                    parseCard("11h"),
                    parseCard("11d"),
                ];
                const result = hand.evaluate7(cards);
                expect(result.category).toBe(6);
                expect(result.tiebreak).toEqual([12, 14]); // Queens over Aces
            });
        });

        describe("Flush", () => {
            it("should detect flush", () => {
                const cards: Card[] = [
                    parseCard("14h"),
                    parseCard("12h"),
                    parseCard("10h"),
                    parseCard("7h"),
                    parseCard("5h"),
                    parseCard("2c"),
                    parseCard("3d"),
                ];
                const result = hand.evaluate7(cards);
                expect(result.category).toBe(5);
                expect(result.tiebreak).toEqual([14, 12, 10, 7, 5]);
            });

            it("should use highest 5 cards for flush", () => {
                const cards: Card[] = [
                    parseCard("14h"),
                    parseCard("12h"),
                    parseCard("10h"),
                    parseCard("7h"),
                    parseCard("5h"),
                    parseCard("3h"),
                    parseCard("2c"),
                ];
                const result = hand.evaluate7(cards);
                expect(result.category).toBe(5);
                expect(result.tiebreak).toEqual([14, 12, 10, 7, 5]); // Should pick highest 5
            });
        });

        describe("Straight", () => {
            it("should detect straight (10-high)", () => {
                const cards: Card[] = [
                    parseCard("10h"),
                    parseCard("9d"),
                    parseCard("8c"),
                    parseCard("7s"),
                    parseCard("6h"),
                    parseCard("2c"),
                    parseCard("3d"),
                ];
                const result = hand.evaluate7(cards);
                expect(result.category).toBe(4);
                expect(result.tiebreak).toEqual([10]);
            });

            it("should detect wheel straight (A-2-3-4-5)", () => {
                const cards: Card[] = [
                    parseCard("14h"),
                    parseCard("5d"),
                    parseCard("4c"),
                    parseCard("3s"),
                    parseCard("2h"),
                    parseCard("10c"),
                    parseCard("11d"),
                ];
                const result = hand.evaluate7(cards);
                expect(result.category).toBe(4);
                expect(result.tiebreak).toEqual([5]);
            });

            it("should prefer straight over pair", () => {
                const cards: Card[] = [
                    parseCard("9h"),
                    parseCard("8d"),
                    parseCard("7c"),
                    parseCard("6s"),
                    parseCard("5h"),
                    parseCard("14c"),
                    parseCard("14d"),
                ];
                const result = hand.evaluate7(cards);
                expect(result.category).toBe(4);
            });
        });

        describe("Three of a Kind", () => {
            it("should detect three of a kind", () => {
                const cards: Card[] = [
                    parseCard("10h"),
                    parseCard("10d"),
                    parseCard("10c"),
                    parseCard("7s"),
                    parseCard("5h"),
                    parseCard("2c"),
                    parseCard("3d"),
                ];
                const result = hand.evaluate7(cards);
                expect(result.category).toBe(3);
                expect(result.tiebreak).toEqual([10, 7, 5]);
            });

            it("should use highest kickers for three of a kind", () => {
                const cards: Card[] = [
                    parseCard("8h"),
                    parseCard("8d"),
                    parseCard("8c"),
                    parseCard("14s"),
                    parseCard("13h"),
                    parseCard("12c"),
                    parseCard("2d"),
                ];
                const result = hand.evaluate7(cards);
                expect(result.category).toBe(3);
                expect(result.tiebreak).toEqual([8, 14, 13]);
            });
        });

        describe("Two Pair", () => {
            it("should detect two pair", () => {
                const cards: Card[] = [
                    parseCard("10h"),
                    parseCard("10d"),
                    parseCard("7c"),
                    parseCard("7s"),
                    parseCard("5h"),
                    parseCard("2c"),
                    parseCard("3d"),
                ];
                const result = hand.evaluate7(cards);
                expect(result.category).toBe(2);
                expect(result.tiebreak).toEqual([10, 7, 5]);
            });

            it("should use highest pairs and kicker", () => {
                const cards: Card[] = [
                    parseCard("14h"),
                    parseCard("14d"),
                    parseCard("13c"),
                    parseCard("13s"),
                    parseCard("12h"),
                    parseCard("11c"),
                    parseCard("2d"),
                ];
                const result = hand.evaluate7(cards);
                expect(result.category).toBe(2);
                expect(result.tiebreak).toEqual([14, 13, 12]);
            });
        });

        describe("Pair", () => {
            it("should detect pair", () => {
                const cards: Card[] = [
                    parseCard("10h"),
                    parseCard("10d"),
                    parseCard("7c"),
                    parseCard("5s"),
                    parseCard("3h"),
                    parseCard("2c"),
                    parseCard("14d"),
                ];
                const result = hand.evaluate7(cards);
                expect(result.category).toBe(1);
                expect(result.tiebreak).toEqual([10, 14, 7, 5]);
            });

            it("should use highest kickers for pair", () => {
                const cards: Card[] = [
                    parseCard("8h"),
                    parseCard("8d"),
                    parseCard("14c"),
                    parseCard("13s"),
                    parseCard("12h"),
                    parseCard("11c"),
                    parseCard("2d"),
                ];
                const result = hand.evaluate7(cards);
                expect(result.category).toBe(1);
                expect(result.tiebreak).toEqual([8, 14, 13, 12]);
            });
        });

        describe("High Card", () => {
            it("should detect high card", () => {
                const cards: Card[] = [
                    parseCard("14h"),
                    parseCard("10d"),
                    parseCard("7c"),
                    parseCard("5s"),
                    parseCard("3h"),
                    parseCard("2c"),
                    parseCard("8d"), // Changed from 4 to avoid wheel straight
                ];
                const result = hand.evaluate7(cards);
                expect(result.category).toBe(0);
                expect(result.tiebreak).toEqual([14, 10, 8, 7, 5]);
            });

            it("should use highest 5 cards for high card", () => {
                const cards: Card[] = [
                    parseCard("14h"),
                    parseCard("13d"),
                    parseCard("12c"),
                    parseCard("9s"), // Changed from 11 to break the straight
                    parseCard("8h"), // Changed from 10 to break the straight
                    parseCard("7c"),
                    parseCard("2d"),
                ];
                const result = hand.evaluate7(cards);
                expect(result.category).toBe(0);
                expect(result.tiebreak).toEqual([14, 13, 12, 9, 8]);
            });
        });

        describe("Edge cases", () => {
            it("should handle case where best hand is not obvious (multiple possibilities)", () => {
                // Hand that could be flush or straight - should pick best combination
                const cards: Card[] = [
                    parseCard("9h"),
                    parseCard("8h"),
                    parseCard("7h"),
                    parseCard("6h"),
                    parseCard("5h"),
                    parseCard("4h"),
                    parseCard("2c"),
                ];
                const result = hand.evaluate7(cards);
                // Should be straight flush (9-high), not just flush
                expect(result.category).toBe(8);
                expect(result.tiebreak).toEqual([9]);
            });

            it("should handle case with multiple pairs where best 5-card hand uses specific pairs", () => {
                const cards: Card[] = [
                    parseCard("14h"),
                    parseCard("14d"),
                    parseCard("13c"),
                    parseCard("13s"),
                    parseCard("12h"),
                    parseCard("12d"),
                    parseCard("11c"),
                ];
                const result = hand.evaluate7(cards);
                // Should pick highest two pair: Aces and Kings with Queen kicker
                expect(result.category).toBe(2);
                expect(result.tiebreak).toEqual([14, 13, 12]);
            });

            it("should handle case where full house is possible with different three-of-a-kinds", () => {
                const cards: Card[] = [
                    parseCard("14h"),
                    parseCard("14d"),
                    parseCard("14c"),
                    parseCard("13h"),
                    parseCard("13d"),
                    parseCard("12c"),
                    parseCard("12d"),
                ];
                const result = hand.evaluate7(cards);
                // Should pick Aces over Kings (not Aces over Queens)
                expect(result.category).toBe(6);
                expect(result.tiebreak).toEqual([14, 13]);
            });
        });
    });

    describe("compareRanks", () => {
        it("should return 1 when first hand has higher category", () => {
            const hand1: HandRank = { category: 8, tiebreak: [9] }; // Straight Flush
            const hand2: HandRank = { category: 7, tiebreak: [13, 7] }; // Four of a Kind
            expect(hand.compareRanks(hand1, hand2)).toBe(1);
        });

        it("should return -1 when second hand has higher category", () => {
            const hand1: HandRank = { category: 1, tiebreak: [10, 14, 7, 5] }; // Pair
            const hand2: HandRank = { category: 6, tiebreak: [14, 13] }; // Full House
            expect(hand.compareRanks(hand1, hand2)).toBe(-1);
        });

        it("should return 0 for identical royal flushes", () => {
            const hand1: HandRank = { category: 9, tiebreak: [] };
            const hand2: HandRank = { category: 9, tiebreak: [] };
            expect(hand.compareRanks(hand1, hand2)).toBe(0);
        });

        describe("Same category comparisons", () => {
            it("should compare straight flush by high card", () => {
                const hand1: HandRank = { category: 8, tiebreak: [10] }; // 10-high straight flush
                const hand2: HandRank = { category: 8, tiebreak: [9] }; // 9-high straight flush
                expect(hand.compareRanks(hand1, hand2)).toBe(1);
                expect(hand.compareRanks(hand2, hand1)).toBe(-1);
            });

            it("should compare four of a kind by rank then kicker", () => {
                const hand1: HandRank = { category: 7, tiebreak: [13, 14] }; // Kings with Ace
                const hand2: HandRank = { category: 7, tiebreak: [13, 12] }; // Kings with Queen
                expect(hand.compareRanks(hand1, hand2)).toBe(1);

                const hand3: HandRank = { category: 7, tiebreak: [14, 13] }; // Aces with King
                expect(hand.compareRanks(hand3, hand1)).toBe(1);
            });

            it("should compare full house by three of a kind then pair", () => {
                const hand1: HandRank = { category: 6, tiebreak: [14, 13] }; // Aces over Kings
                const hand2: HandRank = { category: 6, tiebreak: [14, 12] }; // Aces over Queens
                expect(hand.compareRanks(hand1, hand2)).toBe(1);

                const hand3: HandRank = { category: 6, tiebreak: [13, 14] }; // Kings over Aces
                expect(hand.compareRanks(hand1, hand3)).toBe(1); // Aces over Kings beats Kings over Aces
            });

            it("should compare flush by highest cards", () => {
                const hand1: HandRank = {
                    category: 5,
                    tiebreak: [14, 13, 12, 11, 9],
                };
                const hand2: HandRank = {
                    category: 5,
                    tiebreak: [14, 13, 12, 11, 8],
                };
                expect(hand.compareRanks(hand1, hand2)).toBe(1);

                const hand3: HandRank = {
                    category: 5,
                    tiebreak: [14, 13, 12, 10, 9],
                };
                expect(hand.compareRanks(hand1, hand3)).toBe(1); // 11 beats 10
            });

            it("should compare straight by high card", () => {
                const hand1: HandRank = { category: 4, tiebreak: [10] }; // 10-high
                const hand2: HandRank = { category: 4, tiebreak: [9] }; // 9-high
                expect(hand.compareRanks(hand1, hand2)).toBe(1);

                const hand3: HandRank = { category: 4, tiebreak: [5] }; // Wheel
                expect(hand.compareRanks(hand1, hand3)).toBe(1); // 10-high beats wheel
            });

            it("should compare three of a kind by rank then kickers", () => {
                const hand1: HandRank = { category: 3, tiebreak: [10, 14, 13] }; // Tens with A-K
                const hand2: HandRank = { category: 3, tiebreak: [10, 14, 12] }; // Tens with A-Q
                expect(hand.compareRanks(hand1, hand2)).toBe(1);

                const hand3: HandRank = { category: 3, tiebreak: [14, 13, 12] }; // Aces
                expect(hand.compareRanks(hand3, hand1)).toBe(1);
            });

            it("should compare two pair by higher pair, then lower pair, then kicker", () => {
                const hand1: HandRank = { category: 2, tiebreak: [14, 13, 12] }; // A-K with Q
                const hand2: HandRank = { category: 2, tiebreak: [14, 13, 11] }; // A-K with J
                expect(hand.compareRanks(hand1, hand2)).toBe(1);

                const hand3: HandRank = { category: 2, tiebreak: [14, 12, 13] }; // A-Q with K
                expect(hand.compareRanks(hand1, hand3)).toBe(1); // A-K beats A-Q

                const hand4: HandRank = { category: 2, tiebreak: [13, 12, 14] }; // K-Q with A
                expect(hand.compareRanks(hand1, hand4)).toBe(1); // A-K beats K-Q
            });

            it("should compare pair by rank then kickers", () => {
                const hand1: HandRank = {
                    category: 1,
                    tiebreak: [10, 14, 13, 12],
                }; // Tens with A-K-Q
                const hand2: HandRank = {
                    category: 1,
                    tiebreak: [10, 14, 13, 11],
                }; // Tens with A-K-J
                expect(hand.compareRanks(hand1, hand2)).toBe(1);

                const hand3: HandRank = {
                    category: 1,
                    tiebreak: [14, 13, 12, 11],
                }; // Aces
                expect(hand.compareRanks(hand3, hand1)).toBe(1);
            });

            it("should compare high card by highest cards", () => {
                const hand1: HandRank = {
                    category: 0,
                    tiebreak: [14, 13, 12, 11, 9],
                };
                const hand2: HandRank = {
                    category: 0,
                    tiebreak: [14, 13, 12, 11, 8],
                };
                expect(hand.compareRanks(hand1, hand2)).toBe(1);

                const hand3: HandRank = {
                    category: 0,
                    tiebreak: [14, 13, 12, 10, 9],
                };
                expect(hand.compareRanks(hand1, hand3)).toBe(1);
            });
        });

        it("should return 0 for identical hands", () => {
            const hand1: HandRank = { category: 7, tiebreak: [13, 7] };
            const hand2: HandRank = { category: 7, tiebreak: [13, 7] };
            expect(hand.compareRanks(hand1, hand2)).toBe(0);
        });
    });

    describe("Symmetry Reduction (Memoization)", () => {
        beforeEach(() => {
            // Clear cache before each test
            hand.clearCache();
        });

        it("should cache evaluations of isomorphic hands", () => {
            // These hands are isomorphic (same ranks, different suits)
            // Using 9-8-7-6-5-4-3 to get a 9-high straight flush (not royal flush)
            const hand1: Card[] = [
                parseCard("9h"),
                parseCard("8h"),
                parseCard("7h"),
                parseCard("6h"),
                parseCard("5h"),
                parseCard("4h"),
                parseCard("3h"),
            ];

            const hand2: Card[] = [
                parseCard("9s"),
                parseCard("8s"),
                parseCard("7s"),
                parseCard("6s"),
                parseCard("5s"),
                parseCard("4s"),
                parseCard("3s"),
            ];

            // Both should evaluate to the same result
            const result1 = hand.evaluate7(hand1);
            const result2 = hand.evaluate7(hand2);

            expect(result1).toEqual(result2);
            expect(result1.category).toBe(8); // Straight flush

            // Cache should have been used (check stats)
            const stats = hand.getCacheStats();
            // Should have cached at least one evaluation
            expect(stats.size).toBeGreaterThan(0);
        });

        it("should return cached result for identical hand", () => {
            // Using 9-8-7-6-5-4-3 to get a 9-high straight flush (not royal flush)
            const cards: Card[] = [
                parseCard("9h"),
                parseCard("8h"),
                parseCard("7h"),
                parseCard("6h"),
                parseCard("5h"),
                parseCard("4h"),
                parseCard("3h"),
            ];

            const result1 = hand.evaluate7(cards);
            const result2 = hand.evaluate7([...cards]); // Same cards, new array

            expect(result1).toEqual(result2);
            expect(result1.category).toBe(8); // Straight flush
        });

        it("should handle cache clearing", () => {
            const cards: Card[] = [
                parseCard("14h"),
                parseCard("13h"),
                parseCard("12h"),
                parseCard("11h"),
                parseCard("10h"),
                parseCard("9h"),
                parseCard("8h"),
            ];

            hand.evaluate7(cards);
            expect(hand.getCacheStats().size).toBeGreaterThan(0);

            hand.clearCache();
            expect(hand.getCacheStats().size).toBe(0);
        });
    });
});
