import { Card, HandRank, CardRank } from "@common/interfaces";

class Hand {
    /**
     * Evaluate a 7-card hand to determine the best 5-card hand
     * @param cards7 - The 7 cards to evaluate
     * @returns The HandRank object for the best 5-card hand
     */
    evaluate7(cards7: Card[]): HandRank {
        if (cards7.length !== 7) {
            throw new Error("evaluate7 requires exactly 7 cards");
        }

        // Generate all combinations of 5 cards from 7
        const combinations = this.getCombinations(cards7, 5);
        
        // Evaluate each combination and find the best
        let bestHand = this.evaluate5(combinations[0]);
        for (let i = 1; i < combinations.length; i++) {
            const hand = this.evaluate5(combinations[i]);
            if (this.compareRanks(hand, bestHand) > 0) {
                bestHand = hand;
            }
        }
        
        return bestHand;
    }

    /**
     * Evaluate a 5-card hand
     * @param cards5 - The 5 cards to evaluate
     * @returns The HandRank object
     */
    private evaluate5(cards5: Card[]): HandRank {
        const ranks = cards5.map(c => c.rank).sort((a, b) => b - a);
        const suits = cards5.map(c => c.suit);
        
        // Count occurrences of each rank
        const rankCounts = new Map<CardRank, number>();
        ranks.forEach(rank => {
            rankCounts.set(rank, (rankCounts.get(rank) || 0) + 1);
        });
        
        const counts = Array.from(rankCounts.values()).sort((a, b) => b - a);
        const isFlush = suits.every(suit => suit === suits[0]);
        const isStraight = this.isStraight(ranks);
        
        // Check for Royal Flush (A-K-Q-J-10, all same suit)
        if (isFlush && isStraight && ranks[0] === 14 && ranks[4] === 10) {
            return { category: 9, tiebreak: [] };
        }
        
        // Check for Straight Flush
        if (isFlush && isStraight) {
            return { category: 8, tiebreak: [this.getStraightHigh(ranks)] };
        }
        
        // Check for Four of a Kind
        if (counts[0] === 4) {
            const fourOfAKind = Array.from(rankCounts.entries()).find(([_, count]) => count === 4)?.[0]!;
            const kicker = Array.from(rankCounts.entries()).find(([_, count]) => count === 1)?.[0]!;
            return { category: 7, tiebreak: [fourOfAKind, kicker] };
        }
        
        // Check for Full House
        if (counts[0] === 3 && counts[1] === 2) {
            const threeOfAKind = Array.from(rankCounts.entries()).find(([_, count]) => count === 3)?.[0]!;
            const pair = Array.from(rankCounts.entries()).find(([_, count]) => count === 2)?.[0]!;
            return { category: 6, tiebreak: [threeOfAKind, pair] };
        }
        
        // Check for Flush
        if (isFlush) {
            return { category: 5, tiebreak: ranks };
        }
        
        // Check for Straight
        if (isStraight) {
            return { category: 4, tiebreak: [this.getStraightHigh(ranks)] };
        }
        
        // Check for Three of a Kind
        if (counts[0] === 3) {
            const threeOfAKind = Array.from(rankCounts.entries()).find(([_, count]) => count === 3)?.[0]!;
            const kickers = Array.from(rankCounts.entries())
                .filter(([_, count]) => count === 1)
                .map(([rank, _]) => rank)
                .sort((a, b) => b - a);
            return { category: 3, tiebreak: [threeOfAKind, ...kickers] };
        }
        
        // Check for Two Pair
        if (counts[0] === 2 && counts[1] === 2) {
            const pairs = Array.from(rankCounts.entries())
                .filter(([_, count]) => count === 2)
                .map(([rank, _]) => rank)
                .sort((a, b) => b - a);
            const kicker = Array.from(rankCounts.entries()).find(([_, count]) => count === 1)?.[0]!;
            return { category: 2, tiebreak: [pairs[0], pairs[1], kicker] };
        }
        
        // Check for Pair
        if (counts[0] === 2) {
            const pair = Array.from(rankCounts.entries()).find(([_, count]) => count === 2)?.[0]!;
            const kickers = Array.from(rankCounts.entries())
                .filter(([_, count]) => count === 1)
                .map(([rank, _]) => rank)
                .sort((a, b) => b - a);
            return { category: 1, tiebreak: [pair, ...kickers] };
        }
        
        // High Card
        return { category: 0, tiebreak: ranks };
    }

    /**
     * Check if ranks form a straight (accounting for A-2-3-4-5 low straight)
     */
    private isStraight(ranks: CardRank[]): boolean {
        const uniqueRanks = Array.from(new Set(ranks)).sort((a, b) => a - b);
        
        if (uniqueRanks.length !== 5) return false;
        
        // Check for normal straight
        if (uniqueRanks[4] - uniqueRanks[0] === 4) {
            return true;
        }
        
        // Check for A-2-3-4-5 low straight (wheel)
        if (uniqueRanks[0] === 2 && uniqueRanks[1] === 3 && uniqueRanks[2] === 4 && 
            uniqueRanks[3] === 5 && uniqueRanks[4] === 14) {
            return true;
        }
        
        return false;
    }

    /**
     * Get the high card of a straight (5 for wheel, highest card otherwise)
     */
    private getStraightHigh(ranks: CardRank[]): CardRank {
        const uniqueRanks = Array.from(new Set(ranks)).sort((a, b) => a - b);
        
        // Check for wheel (A-2-3-4-5)
        if (uniqueRanks[0] === 2 && uniqueRanks[4] === 14) {
            return 5;
        }
        
        return uniqueRanks[4];
    }

    /**
     * Generate all combinations of k elements from array
     */
    private getCombinations<T>(array: T[], k: number): T[][] {
        if (k === 0) return [[]];
        if (k === array.length) return [array];
        if (k > array.length) return [];
        
        const combinations: T[][] = [];
        
        for (let i = 0; i <= array.length - k; i++) {
            const head = array[i];
            const tailCombinations = this.getCombinations(array.slice(i + 1), k - 1);
            for (const tailCombo of tailCombinations) {
                combinations.push([head, ...tailCombo]);
            }
        }
        
        return combinations;
    }

    /**
     * Compare two hand ranks to determine which is better
     * @param a - First hand rank
     * @param b - Second hand rank
     * @returns -1 if a < b, 0 if a === b, 1 if a > b
     */
    compareRanks(a: HandRank, b: HandRank): number {
        // First compare categories
        if (a.category > b.category) return 1;
        if (a.category < b.category) return -1;
        
        // Categories are equal, compare tiebreakers
        for (let i = 0; i < Math.max(a.tiebreak.length, b.tiebreak.length); i++) {
            const aRank = a.tiebreak[i] ?? 0;
            const bRank = b.tiebreak[i] ?? 0;
            
            if (aRank > bRank) return 1;
            if (aRank < bRank) return -1;
        }
        
        // Hands are equal
        return 0;
    }
}

export const hand = new Hand();