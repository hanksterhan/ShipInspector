import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
    CalculateEquityRequest,
    CalculateEquityResponse,
    ApiErrorResponse,
    Card,
    Hole,
    parseHole,
    parseBoard,
    parseCard,
} from "@common/interfaces";
import { computeEquity } from "../../../../../server/src/integrations/hand/equity";
import { createHandler } from "../../../../utils/createHandler";

/**
 * POST /poker/equity/calculate
 * Calculate equity for multiple players
 */
export const handler = createHandler(
    { method: "POST", rateLimit: "strict" },
    async (req, res, { logger }) => {
        const {
            players,
            board = "",
            options = {},
            dead = [],
        }: CalculateEquityRequest = req.body;

        if (!players || players.length < 2) {
            const errorResponse: ApiErrorResponse = {
                error: "At least 2 players are required",
            };
            res.status(400).json(errorResponse);
            return;
        }

        // Parse all inputs
        const parsedPlayers: Hole[] = players.map((holeStr) =>
            parseHole(holeStr)
        );
        const parsedBoard = parseBoard(board || "");
        const parsedDead: Card[] = dead.map((cardStr) => parseCard(cardStr));

        // Calculate equity using Rust WASM implementation
        const equityResult = await computeEquity(
            parsedPlayers,
            parsedBoard,
            options,
            parsedDead
        );

        const response: CalculateEquityResponse = {
            equity: equityResult,
            players: parsedPlayers.map((p) => p.cards),
            board: parsedBoard.cards,
            dead: parsedDead,
            fromCache: false,
        };

        logger?.logComplete();
        res.status(200).json(response);
    }
);
