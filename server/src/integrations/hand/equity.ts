import {
    Board,
    Hole,
    EquityOptions,
    EquityResult,
    Card,
    CardRank,
    CardSuit,
    HandRank,
} from "@common/interfaces";
import { hand } from "./hand";
import { trace } from "@opentelemetry/api";
import { getBoardState } from "../../config/metrics";

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
 * Optimized to reduce array allocations
 * Note: boardCards should always be 5 cards (complete board)
 */
function evaluateBoard(
    players: readonly Hole[],
    boardCards: Card[]
): { winners: number[]; ties: boolean } {
    const numPlayers = players.length;
    const boardLength = boardCards.length;

    // Pre-allocate array for 7 cards to avoid repeated allocations
    const all7Cards: Card[] = new Array(7);

    // Evaluate each player's best 7-card hand
    const playerRanks: HandRank[] = new Array(numPlayers);
    for (let i = 0; i < numPlayers; i++) {
        // Build 7-card hand without creating new array (2 hole + 5 board)
        const hole = players[i].cards;
        all7Cards[0] = hole[0];
        all7Cards[1] = hole[1];
        for (let j = 0; j < boardLength; j++) {
            all7Cards[2 + j] = boardCards[j];
        }

        playerRanks[i] = hand.evaluate7(all7Cards);
    }

    // Find the best hand and winners in a single pass
    let bestHand = playerRanks[0];
    const winners: number[] = [0];

    for (let i = 1; i < numPlayers; i++) {
        const comparison = hand.compareRanks(playerRanks[i], bestHand);
        if (comparison > 0) {
            // New best hand found
            bestHand = playerRanks[i];
            winners.length = 0; // Clear winners
            winners.push(i);
        } else if (comparison === 0) {
            // Tie with best hand
            winners.push(i);
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
 *
 * This function iterates through all possible board completions and evaluates
 * each one. The hand evaluation itself uses memoization (via hand.evaluate7())
 * which provides caching for isomorphic hand evaluations, giving us some
 * performance benefit without the complexity of board-level symmetry reduction.
 *
 * Performance optimizations:
 * - Hand evaluation caching (hand.evaluate7() memoization) - automatically handles
 *   isomorphic hand evaluations
 * - Efficient combination iteration (no memory overhead)
 */
function exactEnumeration(
    players: readonly Hole[],
    board: Board,
    remainingDeck: Card[],
    missing: number
): EquityResult {
    const numPlayers = players.length;
    const wins = new Array(numPlayers).fill(0);
    const ties = new Array(numPlayers).fill(0);
    let totalCombos = 0;

    // Evaluate all board combinations
    iterateCombinations(remainingDeck, missing, (combo) => {
        const completeBoard = [...board.cards, ...combo];
        const { winners, ties: isTie } = evaluateBoard(players, completeBoard);
        totalCombos++;

        if (isTie) {
            const tieValue = 1 / winners.length;
            for (const winnerIndex of winners) {
                ties[winnerIndex] += tieValue;
            }
        } else {
            wins[winners[0]] += 1;
        }
    });

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
 * Optimized to reduce array allocations
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

    // Pre-allocate arrays to avoid repeated allocations
    const boardBase = board.cards;
    const boardBaseLength = boardBase.length;
    const completeBoard: Card[] = new Array(5); // Complete board is always 5 cards

    // Sample iterations - use reservoir sampling for better performance
    for (let iter = 0; iter < iterations; iter++) {
        // Use reservoir sampling (much faster than shuffle for small k)
        const sampled = sampleWithoutReplacement(
            remainingDeck,
            missing,
            random
        );

        // Build complete board without creating new array
        for (let i = 0; i < boardBaseLength; i++) {
            completeBoard[i] = boardBase[i];
        }
        for (let i = 0; i < missing; i++) {
            completeBoard[boardBaseLength + i] = sampled[i];
        }

        const { winners, ties: isTie } = evaluateBoard(players, completeBoard);

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
        const tracer = trace.getTracer("equity-calculator");
        const boardState = getBoardState(boardLength);
        const span = tracer.startSpan("equity.calculate", {
            attributes: {
                "equity.method": "complete",
                "equity.players": numPlayers,
                "equity.board_state": boardState,
            },
        });

        try {
            const { winners, ties: isTie } = evaluateBoard(
                players,
                board.cards
            );

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

            span.setAttribute("equity.samples", result.samples);
            return result;
        } finally {
            span.end();
        }
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

    // Create trace span for equity calculation
    const tracer = trace.getTracer("equity-calculator");
    const boardState = getBoardState(boardLength);
    const actualMethod = useExact ? "exact" : "mc";
    const span = tracer.startSpan("equity.calculate", {
        attributes: {
            "equity.method": actualMethod,
            "equity.players": numPlayers,
            "equity.board_state": boardState,
            "equity.mode": mode,
            "equity.combinations": combos,
        },
    });

    try {
        // Run calculation
        let result: EquityResult;
        if (useExact) {
            result = exactEnumeration(players, board, remainingDeck, missing);
        } else {
            const iterations = opts.iterations ?? 10_000;
            span.setAttribute("equity.monte_carlo.iterations", iterations);
            result = monteCarlo(
                players,
                board,
                remainingDeck,
                missing,
                iterations,
                opts.seed
            );
        }

        span.setAttribute("equity.samples", result.samples);
        return result;
    } finally {
        span.end();
    }
}
