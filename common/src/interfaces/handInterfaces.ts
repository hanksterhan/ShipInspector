/**
 * Card rank values (2-14)
 * 2-10: numbered cards
 * 11: Jack
 * 12: Queen
 * 13: King
 * 14: Ace
 */
export type CardRank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

/**
 * Card suit values
 */
export type CardSuit = "c" | "d" | "h" | "s";

export interface Card {
    rank: CardRank;
    suit: CardSuit;
}

/**
 * A hole represents a player's private cards (exactly 2 cards in Texas Hold'em)
 */
export interface Hole {
    cards: [Card, Card];
}

/**
 * A deck of 52 cards
 */
export interface Deck {
    cards: Card[];
}

/**
 * The board (community cards) can have 0-5 cards
 * - Pre-flop: 0 cards
 * - Flop: 3 cards
 * - Turn: 4 cards
 * - River: 5 cards
 */
export interface Board {
    cards: Card[];
}

/**
 * Parse a card string into a Card object
 * @param card - The card string to parse
 * @returns The Card object
 */
export function parseCard(card: string): Card {
    const rank = card.slice(0, -1);
    const suit = card.slice(-1);
    return { rank: parseInt(rank) as CardRank, suit: suit as CardSuit };
}

/**
 * Parse a hole string into a Hole object
 * @param hole - The hole string to parse "Ah 2c" (Ace of Hearts and 2 of Clubs)
 * @returns The Hole object
 */
export function parseHole(hole: string): Hole {
    const cards = hole.split(" ");
    return { cards: [parseCard(cards[0]), parseCard(cards[1])] };
}

/**
 * Parse a board string into a Board object
 * @param board - The board string to parse "Kd 9h 2c" (King of Diamonds, 9 of Hearts, and 2 of Clubs)
 * @returns The Board object
 */
export function parseBoard(board: string): Board {
    const cards = board.split(" ").filter(card => card.trim() !== "");
    return { cards: cards.map(parseCard) };
}

/**
 * The category of a hand
 * - 0: High Card
 * - 1: Pair
 * - 2: Two Pair
 * - 3: Three of a Kind
 * - 4: Straight
 * - 5: Flush
 * - 6: Full House
 * - 7: Four of a Kind
 * - 8: Straight Flush
 * - 9: Royal Flush
 */
export type HandCategory = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/**
 * The rank of a hand
 * @param category - The category of the hand
 * @param tiebreak - The tiebreak cards
 * @returns The HandRank object
 */
export interface HandRank {
    category: HandCategory;
    tiebreak: CardRank[];
}
