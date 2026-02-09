/**
 * POST /poker/hand/evaluate
 * Evaluate a poker hand (hole + board) to determine the best 5-card hand
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { createHandler } from "../../api-utils/createHandler";
import { parseHole, parseBoard, Card } from "@common/interfaces/handInterfaces";
import { hand } from "@lib/poker/evaluate";

const evaluateSchema = z.object({
    hole: z.string().min(1, "hole is required"),
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
        const parseResult = evaluateSchema.safeParse(
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
        let holeCards, boardCards;
        try {
            holeCards = parseHole(body.hole);
            boardCards = body.board ? parseBoard(body.board) : { cards: [] as Card[] };
        } catch (e: any) {
            res.status(400).json({
                error: "Invalid card format",
                details: e.message,
            });
            return;
        }

        // Combine hole + board to get total cards
        const allCards: Card[] = [...holeCards.cards, ...boardCards.cards];

        // Check for duplicate cards
        const dup = findDuplicate(allCards);
        if (dup) {
            res.status(400).json({
                error: `Duplicate card found: ${dup}`,
            });
            return;
        }

        // evaluate7 requires exactly 7 cards (2 hole + 5 board)
        if (allCards.length !== 7) {
            res.status(400).json({
                error: "Evaluation requires exactly 7 cards (2 hole + 5 board)",
                details: {
                    holeCards: holeCards.cards.length,
                    boardCards: boardCards.cards.length,
                    total: allCards.length,
                },
            });
            return;
        }

        // Evaluate the hand
        const handRank = hand.evaluate7(allCards);

        logger.logComplete(200);
        res.status(200).json({
            handRank,
            hole: holeCards.cards,
            board: boardCards.cards,
        });
    }
);

export const handler = handler_POST;
