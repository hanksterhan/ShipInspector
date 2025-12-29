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
import { calculateEquityRust, calculateTurnOuts } from "./equityRust";

// Re-export for convenience
export { calculateTurnOuts };

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
 * Evaluate a single board completion and determine winners
 * Used for complete board (river) showdowns
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
 * Compute equity for given players, board, and options
 * Uses Rust WASM implementation for high-performance calculations
 */
export async function computeEquity(
    players: readonly Hole[],
    board: Board,
    opts: EquityOptions = {},
    dead: readonly Card[] = []
): Promise<EquityResult> {
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

    // For incomplete boards, use Rust WASM implementation
    const missing = 5 - boardLength;
    const remainingDeck = getRemainingDeck(players, board, dead);

    if (remainingDeck.length < missing) {
        throw new Error(
            `Not enough cards in deck: need ${missing}, have ${remainingDeck.length}`
        );
    }

    // Rust implementation currently only supports preflop (empty board)
    if (boardLength !== 0) {
        throw new Error(
            "Equity calculation currently only supports preflop (empty board) or complete board (river showdown)"
        );
    }

    // Use Rust WASM implementation for preflop equity calculation
    const result = await calculateEquityRust(players, board, remainingDeck);
    return result;
}
