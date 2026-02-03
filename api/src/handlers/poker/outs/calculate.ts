import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
    CalculateOutsRequest,
    CalculateOutsResponse,
    ApiErrorResponse,
    parseHole,
    parseBoard,
} from "@common/interfaces";
import { calculateTurnOuts } from "../../../../../server/src/integrations/hand/equity";
import { createHandler } from "../../../../utils/createHandler";
import { handleError } from "../../../../utils/errorHandler";

/**
 * POST /poker/outs/calculate
 * Calculate outs for heads-up turn scenario
 */
export const handler = createHandler(
    { method: "POST", rateLimit: "strict" },
    async (req, res, { logger }) => {
        const { hero, villain, board }: CalculateOutsRequest = req.body;

        if (!hero || !villain || !board) {
            const errorResponse: ApiErrorResponse = {
                error: "Missing required fields: hero, villain, and board are required",
            };
            res.status(400).json(errorResponse);
            return;
        }

        // Parse hero cards
        const heroCards = parseHole(hero);
        if (heroCards.cards.length !== 2) {
            const errorResponse: ApiErrorResponse = {
                error: "Hero must have exactly 2 cards (e.g., 'Ah Kh')",
            };
            res.status(400).json(errorResponse);
            return;
        }

        // Parse villain cards
        const villainCards = parseHole(villain);
        if (villainCards.cards.length !== 2) {
            const errorResponse: ApiErrorResponse = {
                error: "Villain must have exactly 2 cards (e.g., '9d 9c')",
            };
            res.status(400).json(errorResponse);
            return;
        }

        // Parse board cards (must be exactly 4 for turn)
        const boardCards = parseBoard(board);
        if (boardCards.cards.length !== 4) {
            const errorResponse: ApiErrorResponse = {
                error: "Board must have exactly 4 cards (turn) (e.g., 'Qh Jh 3d 2c')",
            };
            res.status(400).json(errorResponse);
            return;
        }

        try {
            // Calculate outs
            const result = await calculateTurnOuts(
                heroCards,
                villainCards,
                boardCards
            );

            const response: CalculateOutsResponse = result;

            logger?.logComplete();
            res.status(200).json(response);
        } catch (error: any) {
            handleError(error, res, 500);
        }
    }
);
