/**
 * POST /poker/hand/compare
 * Compare two poker hands to determine which is better
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { createHandler } from "../../api-utils/createHandler";
import { parseHole, parseBoard, Card } from "@common/interfaces/handInterfaces";
import { hand } from "@lib/poker/evaluate";
import { compareRanks } from "@lib/poker/compare";

const compareSchema = z.object({
    hand1: z.string().min(1, "hand1 is required"),
    hand2: z.string().min(1, "hand2 is required"),
    board: z.string().optional(),
});

/**
 * Check for duplicate cards in an array
 */
function findDuplicate(cards: Card[]): string | null {
    const seen = new Set<string>();
    for (const card of cards) {
        const key = `${card.rank}${card.suit}`;
        if (seen.has(key)) return key;
        seen.add(key);
    }
    return null;
}

const handler_POST = createHandler(
    { method: "POST", rateLimit: "global" },
    async (req, res, { userId, logger }) => {
        const parseResult = compareSchema.safeParse(
            typeof req.body === "object" ? req.body : undefined
        );

        if (!parseResult.success) {
            res.status(400).json({
                error: "Validation failed",
                details: parseResult.error.flatten(),
            });
            return;
        }

        const body = parseResult.data;

        // Parse cards with error handling
        let hole1Cards, hole2Cards, boardCards;
        try {
            hole1Cards = parseHole(body.hand1);
            hole2Cards = parseHole(body.hand2);
            boardCards = body.board ? parseBoard(body.board) : { cards: [] as Card[] };
        } catch (e: any) {
            res.status(400).json({
                error: "Invalid card format",
                details: e.message,
            });
            return;
        }

        // Check for duplicate cards across all inputs
        const allInputCards: Card[] = [
            ...hole1Cards.cards,
            ...hole2Cards.cards,
            ...boardCards.cards,
        ];
        const dup = findDuplicate(allInputCards);
        if (dup) {
            res.status(400).json({
                error: `Duplicate card found: ${dup}`,
            });
            return;
        }

        // Combine hole + board to get total cards for each player
        const allCards1: Card[] = [...hole1Cards.cards, ...boardCards.cards];
        const allCards2: Card[] = [...hole2Cards.cards, ...boardCards.cards];

        // evaluate7 requires exactly 7 cards (2 hole + 5 board)
        if (allCards1.length !== 7 || allCards2.length !== 7) {
            res.status(400).json({
                error: "Comparison requires exactly 7 cards (2 hole + 5 board) for each player",
                details: {
                    hand1Total: allCards1.length,
                    hand2Total: allCards2.length,
                },
            });
            return;
        }

        // Evaluate both hands
        const rank1 = hand.evaluate7(allCards1);
        const rank2 = hand.evaluate7(allCards2);

        // Compare the hands
        const comparisonValue = compareRanks(rank1, rank2);

        // Determine the result
        let result: "hand1_wins" | "hand2_wins" | "tie";
        if (comparisonValue > 0) {
            result = "hand1_wins";
        } else if (comparisonValue < 0) {
            result = "hand2_wins";
        } else {
            result = "tie";
        }

        logger?.logComplete();
        res.status(200).json({
            hand1: {
                hole: hole1Cards.cards,
                rank: rank1,
            },
            hand2: {
                hole: hole2Cards.cards,
                rank: rank2,
            },
            comparison: {
                result,
                value: comparisonValue,
            },
        });
    }
);

export const handler = handler_POST;
