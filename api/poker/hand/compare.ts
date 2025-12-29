// Register path aliases first (before any @common/* imports)
import "../../_helpers";

import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
    CompareHandsRequest,
    CompareHandsResponse,
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
 * POST /poker/hand/compare
 * Compare two poker hands
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

        const { hole1, hole2, board = "" }: CompareHandsRequest = req.body;

        if (!hole1 || !hole2) {
            const errorResponse: ApiErrorResponse = {
                error: "Both hole1 and hole2 are required",
            };
            res.status(400).json(errorResponse);
            return;
        }

        const holeCards1 = parseHole(hole1);
        const holeCards2 = parseHole(hole2);
        const boardCards = parseBoard(board || "");

        // Combine cards for each player
        const allCards1 = [...holeCards1.cards, ...boardCards.cards];
        const allCards2 = [...holeCards2.cards, ...boardCards.cards];

        if (allCards1.length !== 7 || allCards2.length !== 7) {
            const errorResponse: ApiErrorResponse = {
                error: "Both players need exactly 7 cards (2 hole + 5 board)",
            };
            res.status(400).json(errorResponse);
            return;
        }

        const handRank1 = hand.evaluate7(allCards1);
        const handRank2 = hand.evaluate7(allCards2);
        const comparison = hand.compareRanks(handRank1, handRank2);

        const result =
            comparison > 0
                ? "hand1_wins"
                : comparison < 0
                  ? "hand2_wins"
                  : "tie";

        const response: CompareHandsResponse = {
            hand1: {
                hole: holeCards1.cards,
                rank: handRank1,
            },
            hand2: {
                hole: holeCards2.cards,
                rank: handRank2,
            },
            comparison: {
                result: result,
                value: comparison,
            },
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
            error: error.message || "Failed to compare hands",
        };
        res.status(400).json(errorResponse);
    }
}

