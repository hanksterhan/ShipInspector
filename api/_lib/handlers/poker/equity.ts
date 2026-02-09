/**
 * POST /poker/equity/calculate
 * Calculate poker equity for multiple players
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { createHandler } from "../../api-utils/createHandler";
import { parseHole, parseBoard, parseCard } from "@common/interfaces/handInterfaces";
import { computeEquity } from "@lib/poker/equity";

const equitySchema = z.object({
    players: z.array(z.string().min(1)).min(2, "At least 2 players required"),
    board: z.string().optional(),
    options: z
        .object({
            mode: z.enum(["rust"]).optional(),
        })
        .optional(),
    dead: z.array(z.string()).optional(),
});

const handler_POST = createHandler(
    { method: "POST", rateLimit: "global" },
    async (req, res, { userId, logger }) => {
        const parseResult = equitySchema.safeParse(
            typeof req.body === "object" ? req.body : undefined
        );

        if (!parseResult.success) {
            res.status(400).json({
                error: "Validation failed",
                details: parseResult.error.flatten(),
            });
            return;
        }

        const body = parseResult.data;

        // Parse cards with error handling
        let players, board, dead;
        try {
            players = body.players.map((holeStr) => parseHole(holeStr));
            board = body.board ? parseBoard(body.board) : { cards: [] };
            dead = body.dead ? body.dead.map((cardStr) => parseCard(cardStr)) : [];
        } catch (e: any) {
            res.status(400).json({
                error: "Invalid card format",
                details: e.message,
            });
            return;
        }

        // computeEquity validates duplicates internally
        const equityResult = await computeEquity(
            players,
            board,
            body.options || {},
            dead
        );

        logger?.logComplete();
        res.status(200).json({
            equity: {
                win: equityResult.win,
                tie: equityResult.tie,
                lose: equityResult.lose,
                samples: equityResult.samples,
            },
            players: players.map((p) => p.cards),
            board: board.cards,
            dead,
        });
    }
);

export const handler = handler_POST;
