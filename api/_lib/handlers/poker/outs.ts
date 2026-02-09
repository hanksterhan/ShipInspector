/**
 * POST /poker/outs/calculate
 * Calculate turn outs for a heads-up scenario
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { createHandler } from "../../api-utils/createHandler";
import { parseHole, parseBoard, Card } from "@common/interfaces/handInterfaces";
import { calculateTurnOuts } from "@lib/poker/outs";

const outsSchema = z.object({
    hero: z.string().min(1, "hero is required"),
    villain: z.string().min(1, "villain is required"),
    board: z.string().min(1, "board is required"),
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
        const parseResult = outsSchema.safeParse(
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
        let hero, villain, board;
        try {
            hero = parseHole(body.hero);
            villain = parseHole(body.villain);
            board = parseBoard(body.board);
        } catch (e: any) {
            res.status(400).json({
                error: "Invalid card format",
                details: e.message,
            });
            return;
        }

        // Check for duplicate cards across all inputs
        const allCards: Card[] = [
            ...hero.cards,
            ...villain.cards,
            ...board.cards,
        ];
        const dup = findDuplicate(allCards);
        if (dup) {
            res.status(400).json({
                error: `Duplicate card found: ${dup}`,
            });
            return;
        }

        // calculateTurnOuts requires exactly 4 board cards (turn)
        if (board.cards.length !== 4) {
            res.status(400).json({
                error: "Outs calculation requires exactly 4 board cards (turn)",
                details: {
                    boardCards: board.cards.length,
                },
            });
            return;
        }

        // Calculate outs
        const outsResult = await calculateTurnOuts(hero, villain, board);

        logger?.logComplete();
        res.status(200).json(outsResult);
    }
);

export const handler = handler_POST;
