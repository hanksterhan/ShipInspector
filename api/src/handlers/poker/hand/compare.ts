import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
    CompareHandsRequest,
    CompareHandsResponse,
    ApiErrorResponse,
    parseHole,
    parseBoard,
} from "@common/interfaces";
import { hand } from "../../../../../server/src/integrations/hand";
import { createHandler } from "../../../../utils/createHandler";

/**
 * POST /poker/hand/compare
 * Compare two poker hands
 */
export const handler = createHandler(
    { method: "POST", rateLimit: "strict" },
    async (req, res, { logger }) => {
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
    }
);
