import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
    EvaluateHandRequest,
    EvaluateHandResponse,
    ApiErrorResponse,
    parseHole,
    parseBoard,
} from "@common/interfaces";
import { hand } from "../../../../../server/src/integrations/hand";
import { createHandler } from "../../../../utils/createHandler";

/**
 * POST /poker/hand/evaluate
 * Evaluate a poker hand
 */
export const handler = createHandler(
    { method: "POST", rateLimit: "strict" },
    async (req, res, { logger }) => {
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
    }
);
