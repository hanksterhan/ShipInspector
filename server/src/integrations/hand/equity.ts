import {
    Board,
    Hole,
    EquityOptions,
    EquityResult,
    Card,
    CardRank,
    CardSuit,
} from "@common/interfaces";
import { hand } from "./hand";
import { getCanonicalBoardKey } from "./symmetry";

/**
 * Create a full 52-card deck
 */
function createFullDeck(): Card[] {
    const deck: Card[] = [];
    const suits: CardSuit[] = ["c", "d", "h", "s"];
    const ranks: CardRank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push({ rank, suit });
        }
    }

    return deck;
}

/**
 * Check if two cards are equal
 */
function cardsEqual(a: Card, b: Card): boolean {
    return a.rank === b.rank && a.suit === b.suit;
}

/**
 * Create a Set of cards for fast lookup (using string representation)
 */
function createCardSet(cards: readonly Card[]): Set<string> {
    return new Set(cards.map((c) => `${c.rank},${c.suit}`));
}

/**
 * Check if a card exists in a set (optimized lookup)
 */
function cardInSet(card: Card, cardSet: Set<string>): boolean {
    return cardSet.has(`${card.rank},${card.suit}`);
}

/**
 * Validate inputs and check for duplicate cards
 */
function validateInputs(
    players: readonly Hole[],
    board: Board,
    dead: readonly Card[]
): void {
    if (players.length < 2) {
        throw new Error("At least 2 players required");
    }

    if (board.cards.length > 5) {
        throw new Error("Board cannot have more than 5 cards");
    }

    // Collect all known cards
    const allCards: Card[] = [];

    // Add hole cards
    for (const player of players) {
        allCards.push(...player.cards);
    }

    // Add board cards
    allCards.push(...board.cards);

    // Add dead cards
    allCards.push(...dead);

    // Check for duplicates
    for (let i = 0; i < allCards.length; i++) {
        for (let j = i + 1; j < allCards.length; j++) {
            if (cardsEqual(allCards[i], allCards[j])) {
                throw new Error(
                    `Duplicate card found: ${allCards[i].rank}${allCards[i].suit}`
                );
            }
        }
    }
}

/**
 * Get remaining deck (full deck minus known cards)
 */
function getRemainingDeck(
    players: readonly Hole[],
    board: Board,
    dead: readonly Card[]
): Card[] {
    const fullDeck = createFullDeck();
    const knownCards: Card[] = [];

    // Collect all known cards
    for (const player of players) {
        knownCards.push(...player.cards);
    }
    knownCards.push(...board.cards);
    knownCards.push(...dead);

    // Use Set for faster lookup
    const knownCardSet = createCardSet(knownCards);

    // Filter out known cards
    return fullDeck.filter((card) => !cardInSet(card, knownCardSet));
}

/**
 * Calculate nCk (combinations)
 */
function combinations(n: number, k: number): number {
    if (k > n || k < 0) return 0;
    if (k === 0 || k === n) return 1;

    // Use iterative approach to avoid overflow
    let result = 1;
    for (let i = 0; i < k; i++) {
        result = (result * (n - i)) / (i + 1);
    }

    return Math.round(result);
}

/**
 * Create a seeded random number generator
 */
function createSeededRandom(seed: number): () => number {
    let state = seed;
    return () => {
        state = (state * 1103515245 + 12345) & 0x7fffffff;
        return state / 0x7fffffff;
    };
}

/**
 * Evaluate a single board completion and determine winners
 */
function evaluateBoard(
    players: readonly Hole[],
    boardCards: Card[]
): { winners: number[]; ties: boolean } {
    const playerHands: {
        rank: import("@common/interfaces").HandRank;
        index: number;
    }[] = [];

    // Evaluate each player's best 7-card hand
    for (let i = 0; i < players.length; i++) {
        const all7Cards = [...players[i].cards, ...boardCards];
        const rank = hand.evaluate7(all7Cards);
        playerHands.push({ rank, index: i });
    }

    // Find the best hand(s)
    let bestHand = playerHands[0].rank;
    for (const { rank } of playerHands) {
        if (hand.compareRanks(rank, bestHand) > 0) {
            bestHand = rank;
        }
    }

    // Find all players with the best hand
    const winners: number[] = [];
    for (const { rank, index } of playerHands) {
        if (hand.compareRanks(rank, bestHand) === 0) {
            winners.push(index);
        }
    }

    return { winners, ties: winners.length > 1 };
}

/**
 * Iteratively enumerate all combinations without storing them all in memory
 * This is much more memory-efficient for large combination counts
 * Uses a recursive approach with callback to avoid storing all combinations
 */
function iterateCombinations<T>(
    array: T[],
    k: number,
    callback: (combo: T[]) => void
): void {
    if (k === 0) {
        callback([]);
        return;
    }
    if (k === array.length) {
        callback([...array]);
        return;
    }
    if (k > array.length) {
        return;
    }

    // Recursive helper that builds combinations incrementally
    function helper(start: number, combo: T[]): void {
        if (combo.length === k) {
            callback(combo);
            return;
        }

        // Number of remaining elements needed
        const remaining = k - combo.length;
        const maxStart = array.length - remaining;

        for (let i = start; i <= maxStart; i++) {
            combo.push(array[i]);
            helper(i + 1, combo);
            combo.pop();
        }
    }

    helper(0, []);
}

/**
 * Exact enumeration: evaluate all possible board completions
 * Uses symmetry reduction to group isomorphic board combinations
 * 
 * Strategy:
 * 1. First pass: Group board combinations by canonical key (symmetry reduction)
 * 2. Second pass: Evaluate each unique canonical board once, multiply by count
 * 
 * This provides significant speedup, especially for pre-flop calculations where
 * many board combinations are isomorphic (equivalent up to suit permutation).
 * 
 * Symmetry reduction is applied at two levels:
 * - Board combination grouping (this function)
 * - Hand evaluation caching (hand.evaluate7() memoization)
 */
function exactEnumeration(
    players: readonly Hole[],
    board: Board,
    remainingDeck: Card[],
    missing: number
): EquityResult {
    const numPlayers = players.length;
    
    // Group board combinations by canonical key
    // Map: canonicalKey -> { representative board, count }
    const canonicalGroups = new Map<
        string,
        { board: Card[]; count: number }
    >();

    // First pass: group all board combinations by canonical form
    iterateCombinations(remainingDeck, missing, (combo) => {
        const completeBoard = [...board.cards, ...combo];
        const canonicalKey = getCanonicalBoardKey(completeBoard, players);

        if (!canonicalGroups.has(canonicalKey)) {
            canonicalGroups.set(canonicalKey, {
                board: completeBoard,
                count: 0,
            });
        }
        canonicalGroups.get(canonicalKey)!.count++;
    });

    // Second pass: evaluate each canonical board once and multiply by count
    const wins = new Array(numPlayers).fill(0);
    const ties = new Array(numPlayers).fill(0);
    let totalCombos = 0;

    for (const { board: canonicalBoard, count } of canonicalGroups.values()) {
        totalCombos += count;
        const { winners, ties: isTie } = evaluateBoard(players, canonicalBoard);

        // Multiply results by the number of isomorphic combinations
        if (isTie) {
            const tieValue = (1 / winners.length) * count;
            for (const winnerIndex of winners) {
                ties[winnerIndex] += tieValue;
            }
        } else {
            wins[winners[0]] += count;
        }
    }

    // Convert to fractions
    const result: EquityResult = {
        win: wins.map((w) => w / totalCombos),
        tie: ties.map((t) => t / totalCombos),
        lose: new Array(numPlayers).fill(0),
        samples: totalCombos,
    };

    // Calculate losses
    for (let i = 0; i < numPlayers; i++) {
        result.lose[i] = 1 - result.win[i] - result.tie[i];
    }

    return result;
}

/**
 * Reservoir sampling - efficiently sample k items from array without shuffling
 * Much faster than shuffle for small k values
 */
function sampleWithoutReplacement<T>(
    array: readonly T[],
    k: number,
    random: () => number
): T[] {
    if (k >= array.length) {
        return [...array];
    }

    const result: T[] = [];

    // Fill reservoir with first k items
    for (let i = 0; i < k; i++) {
        result.push(array[i]);
    }

    // Replace elements with gradually decreasing probability
    for (let i = k; i < array.length; i++) {
        const j = Math.floor(random() * (i + 1));
        if (j < k) {
            result[j] = array[i];
        }
    }

    return result;
}

/**
 * Monte Carlo simulation: randomly sample board completions
 * Uses reservoir sampling for efficient random selection
 */
function monteCarlo(
    players: readonly Hole[],
    board: Board,
    remainingDeck: Card[],
    missing: number,
    iterations: number,
    seed?: number
): EquityResult {
    const numPlayers = players.length;
    const wins = new Array(numPlayers).fill(0);
    const ties = new Array(numPlayers).fill(0);

    // Create random number generator (seeded or unseeded)
    const random = seed !== undefined ? createSeededRandom(seed) : Math.random;

    // Pre-allocate array for board to avoid repeated allocations
    const boardBase = board.cards;

    // Sample iterations - use reservoir sampling for better performance
    for (let iter = 0; iter < iterations; iter++) {
        // Use reservoir sampling (much faster than shuffle for small k)
        const sampled = sampleWithoutReplacement(
            remainingDeck,
            missing,
            random
        );
        const sampledBoard = [...boardBase, ...sampled];

        const { winners, ties: isTie } = evaluateBoard(players, sampledBoard);

        if (isTie) {
            const tieValue = 1 / winners.length;
            for (const winnerIndex of winners) {
                ties[winnerIndex] += tieValue;
            }
        } else {
            wins[winners[0]] += 1;
        }
    }

    // Convert to fractions
    const result: EquityResult = {
        win: wins.map((w) => w / iterations),
        tie: ties.map((t) => t / iterations),
        lose: new Array(numPlayers).fill(0),
        samples: iterations,
    };

    // Calculate losses
    for (let i = 0; i < numPlayers; i++) {
        result.lose[i] = 1 - result.win[i] - result.tie[i];
    }

    return result;
}

/**
 * Compute equity for given players, board, and options
 */
export function computeEquity(
    players: readonly Hole[],
    board: Board,
    opts: EquityOptions = {},
    dead: readonly Card[] = []
): EquityResult {
    // Validate inputs
    validateInputs(players, board, dead);

    const numPlayers = players.length;
    const boardLength = board.cards.length;

    // If board is complete (5 cards), deterministic showdown
    if (boardLength === 5) {
        const { winners, ties: isTie } = evaluateBoard(players, board.cards);

        const result: EquityResult = {
            win: new Array(numPlayers).fill(0),
            tie: new Array(numPlayers).fill(0),
            lose: new Array(numPlayers).fill(0),
            samples: 1,
        };

        if (isTie) {
            const tieValue = 1 / winners.length;
            for (const winnerIndex of winners) {
                result.tie[winnerIndex] = tieValue;
                result.lose[winnerIndex] = 1 - tieValue;
            }
            // Non-winners lose
            for (let i = 0; i < numPlayers; i++) {
                if (!winners.includes(i)) {
                    result.lose[i] = 1;
                }
            }
        } else {
            result.win[winners[0]] = 1;
            // All others lose
            for (let i = 0; i < numPlayers; i++) {
                if (i !== winners[0]) {
                    result.lose[i] = 1;
                }
            }
        }

        return result;
    }

    // Calculate missing cards and remaining deck
    const missing = 5 - boardLength;
    const remainingDeck = getRemainingDeck(players, board, dead);

    if (remainingDeck.length < missing) {
        throw new Error(
            `Not enough cards in deck: need ${missing}, have ${remainingDeck.length}`
        );
    }

    // Calculate combinations
    const combos = combinations(remainingDeck.length, missing);

    // Determine algorithm
    const mode = opts.mode ?? "auto";
    let useExact = false;

    if (mode === "exact") {
        useExact = true;
    } else if (mode === "mc") {
        useExact = false;
    } else if (mode === "auto") {
        // Increased threshold since we optimized exact enumeration to use less memory
        // For pre-flop (5 cards missing), this will use Monte Carlo (C(48,5) = 1,712,304 > 1,000,000)
        const maxCombos = opts.exactMaxCombos ?? 1_000_000;
        useExact = combos <= maxCombos;
    }

    // Run calculation
    if (useExact) {
        return exactEnumeration(players, board, remainingDeck, missing);
    } else {
        const iterations = opts.iterations ?? 10_000;
        return monteCarlo(
            players,
            board,
            remainingDeck,
            missing,
            iterations,
            opts.seed
        );
    }
}
