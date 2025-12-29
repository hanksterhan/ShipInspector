// Register path aliases first (before any @common/* imports)
import "../../_helpers";

import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
    CalculateOutsRequest,
    CalculateOutsResponse,
    ApiErrorResponse,
    parseHole,
    parseBoard,
} from "@common/interfaces";
import { calculateTurnOuts } from "../../../server/src/integrations/hand/equity";
import { requireAuth } from "../../utils/auth";
import { handleCors } from "../../utils/cors";
import { strictRateLimiter } from "../../utils/rateLimit";
import { logRequest } from "../../utils/logger";
import { handleError } from "../../utils/errorHandler";

/**
 * POST /poker/outs/calculate
 * Calculate outs for heads-up turn scenario
 */
export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    const startTime = Date.now();
    const logger = logRequest(req, startTime);

    // Handle CORS
    if (!handleCors(req, res)) {
        return;
    }

    // Only allow POST
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    // Rate limiting
    if (!strictRateLimiter(req, res)) {
        return;
    }

    try {
        // Check authentication
        requireAuth(req);

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
        if (error.message === "Not authenticated") {
            res.status(401).json({
                error: "Not authenticated",
            });
            return;
        }
        handleError(error, req, res, logger);
    }
}

