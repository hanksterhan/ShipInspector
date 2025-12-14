import { Board, Hole, EquityOptions, EquityResult, Card, CardRank, CardSuit } from "@common/interfaces";
import { hand } from "./hand";

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
 * Check if a card exists in an array
 */
function cardInArray(card: Card, array: Card[]): boolean {
    return array.some(c => cardsEqual(c, card));
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
                throw new Error(`Duplicate card found: ${allCards[i].rank}${allCards[i].suit}`);
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
    
    // Filter out known cards
    return fullDeck.filter(card => !cardInArray(card, knownCards));
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
        result = result * (n - i) / (i + 1);
    }
    
    return Math.round(result);
}

/**
 * Generate all combinations of k elements from array
 */
function generateCombinations<T>(array: T[], k: number): T[][] {
    if (k === 0) return [[]];
    if (k === array.length) return [array];
    if (k > array.length) return [];
    
    const result: T[][] = [];
    
    for (let i = 0; i <= array.length - k; i++) {
        const head = array[i];
        const tailCombos = generateCombinations(array.slice(i + 1), k - 1);
        for (const tailCombo of tailCombos) {
            result.push([head, ...tailCombo]);
        }
    }
    
    return result;
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
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffle<T>(array: T[], random: () => number = Math.random): T[] {
    const shuffled = [...array];
    
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
}

/**
 * Evaluate a single board completion and determine winners
 */
function evaluateBoard(
    players: readonly Hole[],
    boardCards: Card[]
): { winners: number[]; ties: boolean } {
    const playerHands: { rank: import("@common/interfaces").HandRank; index: number }[] = [];
    
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
 * Exact enumeration: evaluate all possible board completions
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
    
    // Generate all possible board completions
    const boardCombinations = generateCombinations(remainingDeck, missing);
    const totalCombos = boardCombinations.length;
    
    // Evaluate each combination
    for (const combo of boardCombinations) {
        const completeBoard = [...board.cards, ...combo];
        const { winners, ties: isTie } = evaluateBoard(players, completeBoard);
        
        if (isTie) {
            // Split the pot equally among tied players
            const tieValue = 1 / winners.length;
            for (const winnerIndex of winners) {
                ties[winnerIndex] += tieValue;
            }
        } else {
            // Single winner
            wins[winners[0]] += 1;
        }
    }
    
    // Convert to fractions
    const result: EquityResult = {
        win: wins.map(w => w / totalCombos),
        tie: ties.map(t => t / totalCombos),
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
 * Monte Carlo simulation: randomly sample board completions
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
    
    // Sample iterations
    for (let iter = 0; iter < iterations; iter++) {
        // Randomly sample missing cards
        const shuffled = shuffle(remainingDeck, random);
        const sampledBoard = [...board.cards, ...shuffled.slice(0, missing)];
        
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
        win: wins.map(w => w / iterations),
        tie: ties.map(t => t / iterations),
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
    dead: readonly Card[] = [],
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
        throw new Error(`Not enough cards in deck: need ${missing}, have ${remainingDeck.length}`);
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
        const maxCombos = opts.exactMaxCombos ?? 200_000;
        useExact = combos <= maxCombos;
    }
    
    // Run calculation
    if (useExact) {
        return exactEnumeration(players, board, remainingDeck, missing);
    } else {
        const iterations = opts.iterations ?? 10_000;
        return monteCarlo(players, board, remainingDeck, missing, iterations, opts.seed);
    }
}