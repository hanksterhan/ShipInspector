import { Card, CardRank, CardSuit, Hole, Board } from "@common/interfaces";

/**
 * Symmetry reduction for poker hand evaluation
 *
 * The key insight is that many hands are isomorphic (equivalent) due to:
 * 1. Suit symmetry: Suits are equivalent when they don't affect the hand strength
 * 2. Rank symmetry: Many board combinations are equivalent
 *
 * This module provides canonicalization functions to reduce the search space.
 */

/**
 * Canonical representation of a card (using normalized suit mapping)
 */
interface CanonicalCard {
    rank: CardRank;
    suitIndex: number; // 0-3, mapped from original suit
}

/**
 * Canonical representation of a hand or board
 */
interface CanonicalHand {
    cards: CanonicalCard[];
    suitMapping: Map<CardSuit, number>; // Original suit -> canonical suit index
}

/**
 * Create a canonical representation of cards by normalizing suits
 *
 * Strategy:
 * - Group cards by rank, then assign suit indices based on frequency
 * - This ensures isomorphic hands get the same canonical form
 * - For example: As Ks Qs and Ah Kh Qh both become rank groups with suit index 0
 *
 * @param cards - Cards to canonicalize
 * @returns Canonical representation with suit mapping
 */
export function canonicalizeCards(cards: Card[]): CanonicalHand {
    // Group cards by rank to ensure consistent suit assignment
    const rankGroups = new Map<CardRank, Card[]>();
    for (const card of cards) {
        if (!rankGroups.has(card.rank)) {
            rankGroups.set(card.rank, []);
        }
        rankGroups.get(card.rank)!.push(card);
    }

    // Create suit mapping: assign indices based on which ranks use which suits
    // This ensures that isomorphic hands (same ranks, different suits) get same mapping
    const suitMapping = new Map<CardSuit, number>();
    let nextSuitIndex = 0;

    // Process ranks in sorted order for consistency
    const sortedRanks = Array.from(rankGroups.keys()).sort((a, b) => a - b);
    const canonicalCards: CanonicalCard[] = [];

    for (const rank of sortedRanks) {
        const cardsOfRank = rankGroups.get(rank)!;
        // For each card of this rank, assign suit index
        for (const card of cardsOfRank) {
            if (!suitMapping.has(card.suit)) {
                suitMapping.set(card.suit, nextSuitIndex);
                nextSuitIndex++;
            }
            canonicalCards.push({
                rank: card.rank,
                suitIndex: suitMapping.get(card.suit)!,
            });
        }
    }

    return {
        cards: canonicalCards,
        suitMapping,
    };
}

/**
 * Create a string key from canonical cards for use in maps/caches
 * Format: "rank1:suit1,rank2:suit2,..." with suits as indices
 * Cards are sorted by rank first, then by suit index for consistency
 */
function canonicalKey(cards: CanonicalCard[]): string {
    // Sort by rank (descending), then by suit index for consistent ordering
    const sorted = [...cards].sort((a, b) => {
        if (a.rank !== b.rank) {
            return b.rank - a.rank; // Higher ranks first
        }
        return a.suitIndex - b.suitIndex; // Then by suit index
    });
    return sorted.map((c) => `${c.rank}:${c.suitIndex}`).join(",");
}

/**
 * Create a canonical key for a set of cards
 * This key is the same for isomorphic hands (hands equivalent up to suit permutation)
 *
 * Example: getCanonicalKey([As, Ks, Qs]) === getCanonicalKey([Ah, Kh, Qh])
 */
export function getCanonicalKey(cards: Card[]): string {
    const canonical = canonicalizeCards(cards);
    return canonicalKey(canonical.cards);
}

/**
 * Check if two sets of cards are isomorphic (equivalent up to suit permutation)
 *
 * This is useful for detecting when we've already evaluated an equivalent hand.
 */
export function areIsomorphic(cards1: Card[], cards2: Card[]): boolean {
    if (cards1.length !== cards2.length) return false;

    const key1 = getCanonicalKey(cards1);
    const key2 = getCanonicalKey(cards2);
    return key1 === key2;
}

/**
 * Canonicalize a hole (2 cards) for symmetry reduction
 *
 * For holes, we also sort by rank to ensure consistent ordering
 */
export function canonicalizeHole(hole: Hole): string {
    const cards = [...hole.cards];
    // Sort by rank (descending) for consistency
    cards.sort((a, b) => b.rank - a.rank);
    return getCanonicalKey(cards);
}

/**
 * Canonicalize a board for symmetry reduction
 */
export function canonicalizeBoard(board: Board): string {
    return getCanonicalKey(board.cards);
}

/**
 * Group board combinations by their canonical form
 *
 * This allows us to evaluate each unique board pattern once and multiply
 * by the number of isomorphic combinations.
 *
 * @param boards - Array of board combinations
 * @returns Map from canonical key to array of isomorphic boards
 */
export function groupIsomorphicBoards(boards: Card[][]): Map<string, Card[][]> {
    const groups = new Map<string, Card[][]>();

    for (const board of boards) {
        const key = getCanonicalKey(board);
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(board);
    }

    return groups;
}

/**
 * Count the number of isomorphic combinations for a canonical board
 *
 * This calculates how many distinct board combinations map to the same
 * canonical form. For example, if we have a canonical board with 3 different
 * suits, there are 4!/(4-3)! = 24 isomorphic combinations.
 *
 * @param canonicalBoard - The canonical board representation
 * @param availableSuits - Number of available suits (usually 4)
 * @returns Number of isomorphic combinations
 */
export function countIsomorphicCombinations(
    canonicalBoard: CanonicalHand,
    availableSuits: number = 4
): number {
    const uniqueSuitIndices = new Set(
        canonicalBoard.cards.map((c) => c.suitIndex)
    );
    const numUniqueSuits = uniqueSuitIndices.size;

    if (numUniqueSuits === 0) return 1;

    // Calculate permutations: P(availableSuits, numUniqueSuits)
    // This is the number of ways to assign suits to the canonical form
    let result = 1;
    for (let i = 0; i < numUniqueSuits; i++) {
        result *= availableSuits - i;
    }

    return result;
}

/**
 * Advanced canonicalization that considers suit conflicts
 *
 * When hole cards have specific suits, we need to be more careful.
 * This version creates a canonical form that respects suit constraints
 * from known cards (hole cards, board cards).
 *
 * @param cards - Cards to canonicalize
 * @param knownCards - Known cards that constrain suit assignments (hole cards, board)
 * @returns Canonical representation
 */
export function canonicalizeWithConstraints(
    cards: Card[],
    knownCards: Card[]
): CanonicalHand {
    // First, establish suit mapping from known cards
    const suitMapping = new Map<CardSuit, number>();
    let nextSuitIndex = 0;

    // Process known cards first to establish constraints
    for (const card of knownCards) {
        if (!suitMapping.has(card.suit)) {
            suitMapping.set(card.suit, nextSuitIndex);
            nextSuitIndex++;
        }
    }

    // Now process the cards to canonicalize
    const canonicalCards: CanonicalCard[] = [];
    for (const card of cards) {
        if (!suitMapping.has(card.suit)) {
            suitMapping.set(card.suit, nextSuitIndex);
            nextSuitIndex++;
        }
        canonicalCards.push({
            rank: card.rank,
            suitIndex: suitMapping.get(card.suit)!,
        });
    }

    return {
        cards: canonicalCards,
        suitMapping,
    };
}

/**
 * Check if a board combination is valid given hole cards
 * (i.e., no duplicate cards)
 */
export function isValidBoardCombination(
    board: Card[],
    holes: readonly Hole[]
): boolean {
    const allKnownCards: Card[] = [];
    for (const hole of holes) {
        allKnownCards.push(...hole.cards);
    }
    allKnownCards.push(...board);

    // Check for duplicates
    const seen = new Set<string>();
    for (const card of allKnownCards) {
        const key = `${card.rank},${card.suit}`;
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
    }

    return true;
}

/**
 * Create a canonical key for a board completion that respects hole card constraints
 *
 * This function creates a canonical representation of a board completion by:
 * 1. Considering all players' hole cards to establish suit constraints
 * 2. Canonicalizing the board cards relative to these constraints
 * 3. Producing a key that groups isomorphic board combinations
 *
 * Two board combinations are isomorphic if they produce equivalent hand evaluations
 * for all players, accounting for suit constraints from hole cards.
 *
 * Strategy:
 * - Group board cards by rank
 * - For each rank, assign suit indices based on whether the suit matches hole cards
 * - This ensures boards with same ranks and same suit pattern (relative to holes) get same key
 *
 * @param boardCompletion - The complete board (5 cards)
 * @param holes - All players' hole cards
 * @returns Canonical key string
 */
export function getCanonicalBoardKey(
    boardCompletion: Card[],
    holes: readonly Hole[]
): string {
    // Collect all hole cards to check for suit matches
    const holeCards: Card[] = [];
    for (const hole of holes) {
        holeCards.push(...hole.cards);
    }

    // Create a set of hole card suits for fast lookup
    const holeSuits = new Set<CardSuit>();
    for (const card of holeCards) {
        holeSuits.add(card.suit);
    }

    // Group board cards by rank
    const rankGroups = new Map<CardRank, Card[]>();
    for (const card of boardCompletion) {
        if (!rankGroups.has(card.rank)) {
            rankGroups.set(card.rank, []);
        }
        rankGroups.get(card.rank)!.push(card);
    }

    // Create canonical representation
    // Strategy: For each rank, create a pattern that identifies isomorphic boards.
    // Two boards are isomorphic if they have:
    // 1. Same ranks
    // 2. Same pattern of suit relationships to hole cards (matching vs non-matching)
    // 3. Same counts of matching/non-matching suits per rank
    //
    // We assign suit indices based on the pattern position, not the actual suit value.
    // Matching suits get indices 0-3, non-matching suits get indices 4-7.
    const canonicalCards: Array<{ rank: CardRank; suitIndex: number }> = [];
    const suitMapping = new Map<CardSuit, number>();
    let nextMatchingIndex = 0;
    let nextNonMatchingIndex = 4;

    // Process ranks in sorted order for consistency
    const sortedRanks = Array.from(rankGroups.keys()).sort((a, b) => a - b);

    for (const rank of sortedRanks) {
        const cardsOfRank = rankGroups.get(rank)!;

        // Separate cards into matching and non-matching groups
        const matchingCards: Card[] = [];
        const nonMatchingCards: Card[] = [];

        for (const card of cardsOfRank) {
            if (holeSuits.has(card.suit)) {
                matchingCards.push(card);
            } else {
                nonMatchingCards.push(card);
            }
        }

        // Sort each group by suit for consistency (ensures deterministic ordering)
        matchingCards.sort((a, b) => a.suit.localeCompare(b.suit));
        nonMatchingCards.sort((a, b) => a.suit.localeCompare(b.suit));

        // Assign suit indices based on pattern position
        // Matching suits: assign indices 0, 1, 2, 3 based on order in pattern
        // Non-matching suits: assign indices 4, 5, 6, 7 based on order in pattern
        for (let i = 0; i < matchingCards.length; i++) {
            const card = matchingCards[i];
            if (!suitMapping.has(card.suit)) {
                suitMapping.set(card.suit, nextMatchingIndex);
                nextMatchingIndex++;
            }
        }

        for (let i = 0; i < nonMatchingCards.length; i++) {
            const card = nonMatchingCards[i];
            if (!suitMapping.has(card.suit)) {
                suitMapping.set(card.suit, nextNonMatchingIndex);
                nextNonMatchingIndex++;
            }
        }

        // Create canonical cards: for each card, use its assigned suit index
        // But we need to preserve the pattern: matching suits first, then non-matching
        for (const card of matchingCards) {
            canonicalCards.push({
                rank: card.rank,
                suitIndex: suitMapping.get(card.suit)!,
            });
        }
        for (const card of nonMatchingCards) {
            canonicalCards.push({
                rank: card.rank,
                suitIndex: suitMapping.get(card.suit)!,
            });
        }
    }

    // Create key from canonical cards, sorted by rank then suit index
    return canonicalKey(canonicalCards);
}

/**
 * Count isomorphic board combinations for a given canonical board pattern
 *
 * This calculates how many distinct board combinations map to the same canonical form,
 * considering the constraints from hole cards.
 *
 * The count depends on:
 * - How many unique suits are in the canonical form
 * - How many suits are already "used" by hole cards
 * - How many ways we can assign the remaining suits
 *
 * @param canonicalBoard - The canonical board representation
 * @param holes - All players' hole cards (to determine used suits)
 * @param remainingDeckSize - Size of remaining deck
 * @returns Number of isomorphic combinations (approximate, for optimization purposes)
 */
export function estimateIsomorphicCount(
    canonicalBoard: CanonicalHand,
    holes: readonly Hole[],
    remainingDeckSize: number
): number {
    // Count unique suits in canonical form
    const uniqueSuitIndices = new Set(
        canonicalBoard.cards.map((c) => c.suitIndex)
    );
    const numUniqueSuitsInBoard = uniqueSuitIndices.size;

    // Count suits used by hole cards
    const suitsUsedByHoles = new Set<CardSuit>();
    for (const hole of holes) {
        for (const card of hole.cards) {
            suitsUsedByHoles.add(card.suit);
        }
    }
    const numSuitsUsed = suitsUsedByHoles.size;

    // Available suits for board (4 total suits)
    const availableSuits = 4;
    const remainingSuits = availableSuits - numSuitsUsed;

    // If board uses more unique suits than available, count is 1 (no symmetry)
    if (numUniqueSuitsInBoard > remainingSuits) {
        return 1;
    }

    // Calculate permutations: P(remainingSuits, numUniqueSuitsInBoard)
    // This is an approximation - actual count depends on deck composition
    let result = 1;
    for (let i = 0; i < numUniqueSuitsInBoard; i++) {
        result *= Math.max(1, remainingSuits - i);
    }

    // This is a conservative estimate - actual symmetry reduction may be higher
    // but this ensures correctness (we may evaluate slightly more than necessary)
    return Math.max(1, result);
}
