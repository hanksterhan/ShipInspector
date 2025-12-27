import { Request, Response } from "express";
import { calculateTurnOuts } from "../integrations/hand/equity";
import { parseCard, Hole, Board } from "@common/interfaces";
import {
    CalculateOutsRequest,
    CalculateOutsResponse,
} from "@common/interfaces/apiInterfaces";

/**
 * Handler for calculating outs on the turn
 * POST /api/outs/calculate
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
        const heroCardsStr = hero.trim().split(/\s+/);
        if (heroCardsStr.length !== 2) {
            res.status(400).json({
                error: "Hero must have exactly 2 cards (e.g., 'Ah Kh')",
            });
            return;
        }
        const heroCards: Hole = {
            cards: [parseCard(heroCardsStr[0]), parseCard(heroCardsStr[1])],
        };

        // Parse villain cards
        const villainCardsStr = villain.trim().split(/\s+/);
        if (villainCardsStr.length !== 2) {
            res.status(400).json({
                error: "Villain must have exactly 2 cards (e.g., '9d 9c')",
            });
            return;
        }
        const villainCards: Hole = {
            cards: [
                parseCard(villainCardsStr[0]),
                parseCard(villainCardsStr[1]),
            ],
        };

        // Parse board cards (must be exactly 4 for turn)
        const boardCardsStr = board.trim().split(/\s+/);
        if (boardCardsStr.length !== 4) {
            res.status(400).json({
                error: "Board must have exactly 4 cards (turn) (e.g., 'Qh Jh 3d 2c')",
            });
            return;
        }
        const boardCards: Board = {
            cards: boardCardsStr.map(parseCard),
        };

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
