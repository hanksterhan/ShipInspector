import { Request, Response } from "express";
import { calculateTurnOuts } from "../integrations/hand/equity";
import { parseHole, parseBoard } from "@common/interfaces";
import {
    CalculateOutsRequest,
    CalculateOutsResponse,
} from "@common/interfaces/apiInterfaces";

/**
 * Handler for calculating outs on the turn
 * POST /api/poker/outs/calculate
 */
export async function calculateOutsHandler(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const { hero, villain, board } = req.body as CalculateOutsRequest;

        // Validate required fields
        if (!hero || !villain || !board) {
            res.status(400).json({
                error: "Missing required fields: hero, villain, and board are required",
            });
            return;
        }

        // Parse hero cards
        const heroCards = parseHole(hero);
        if (heroCards.cards.length !== 2) {
            res.status(400).json({
                error: "Hero must have exactly 2 cards (e.g., 'Ah Kh')",
            });
            return;
        }

        // Parse villain cards
        const villainCards = parseHole(villain);
        if (villainCards.cards.length !== 2) {
            res.status(400).json({
                error: "Villain must have exactly 2 cards (e.g., '9d 9c')",
            });
            return;
        }

        // Parse board cards (must be exactly 4 for turn)
        const boardCards = parseBoard(board);
        if (boardCards.cards.length !== 4) {
            res.status(400).json({
                error: "Board must have exactly 4 cards (turn) (e.g., 'Qh Jh 3d 2c')",
            });
            return;
        }

        // Calculate outs
        const result = await calculateTurnOuts(
            heroCards,
            villainCards,
            boardCards
        );

        // Send response
        res.json(result as CalculateOutsResponse);
    } catch (error: any) {
        console.error("Error calculating outs:", error);
        res.status(500).json({
            error: error.message || "Failed to calculate outs",
        });
    }
}

