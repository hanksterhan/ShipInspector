// Register path aliases first (before any @common/* imports)
import "../../_helpers";

import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
    EvaluateHandRequest,
    EvaluateHandResponse,
    ApiErrorResponse,
    parseHole,
    parseBoard,
} from "@common/interfaces";
import { hand } from "../../../server/src/integrations/hand";
import { requireAuth } from "../../utils/auth";
import { handleCors } from "../../utils/cors";
import { strictRateLimiter } from "../../utils/rateLimit";
import { logRequest } from "../../utils/logger";
import { handleError } from "../../utils/errorHandler";

/**
 * POST /poker/hand/evaluate
 * Evaluate a poker hand
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

        const { hole, board = "" }: EvaluateHandRequest = req.body;

        if (!hole) {
            const errorResponse: ApiErrorResponse = {
                error: "Hole cards are required",
            };
            res.status(400).json(errorResponse);
            return;
        }

        const holeCards = parseHole(hole);
        const boardCards = parseBoard(board || "");

        // Combine hole and board cards
        const allCards = [...holeCards.cards, ...boardCards.cards];

        if (allCards.length < 2) {
            const errorResponse: ApiErrorResponse = {
                error: "Need at least 2 cards (hole cards) to evaluate",
            };
            res.status(400).json(errorResponse);
            return;
        }

        if (allCards.length > 7) {
            const errorResponse: ApiErrorResponse = {
                error: "Cannot evaluate more than 7 cards",
            };
            res.status(400).json(errorResponse);
            return;
        }

        // evaluate7 requires exactly 7 cards
        let handRank;
        if (allCards.length === 7) {
            handRank = hand.evaluate7(allCards);
        } else if (allCards.length === 5) {
            res.status(400).json({
                error: "Please provide exactly 7 cards (2 hole + 5 board) for accurate evaluation",
            });
            return;
        } else {
            const errorResponse: ApiErrorResponse = {
                error: `Currently requires exactly 7 cards for evaluation. You provided ${allCards.length} cards (2 hole + ${boardCards.cards.length} board).`,
            };
            res.status(400).json(errorResponse);
            return;
        }

        const response: EvaluateHandResponse = {
            handRank,
            hole: holeCards.cards,
            board: boardCards.cards,
        };

        logger?.logComplete();
        res.status(200).json(response);
    } catch (error: any) {
        if (error.message === "Not authenticated") {
            res.status(401).json({
                error: "Not authenticated",
            });
            return;
        }
        const errorResponse: ApiErrorResponse = {
            error: error.message || "Failed to evaluate hand",
        };
        res.status(400).json(errorResponse);
    }
}

