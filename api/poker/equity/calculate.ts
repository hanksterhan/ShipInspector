// Register path aliases first (before any @common/* imports)
import "../../_helpers";

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
import { computeEquity } from "../../../server/src/integrations/hand/equity";
import { requireAuth } from "../../utils/auth";
import { handleCors } from "../../utils/cors";
import { strictRateLimiter } from "../../utils/rateLimit";
import { logRequest } from "../../utils/logger";
import { handleError } from "../../utils/errorHandler";

/**
 * POST /poker/equity/calculate
 * Calculate equity for multiple players
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
    } catch (error: any) {
        if (error.message === "Not authenticated") {
            res.status(401).json({
                error: "Not authenticated",
            });
            return;
        }
        const errorResponse: ApiErrorResponse = {
            error: error.message || "Failed to calculate equity",
        };
        res.status(400).json(errorResponse);
    }
}

