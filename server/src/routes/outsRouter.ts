import { IRouter, Router as defineRouter } from "express";
import { calculateOutsHandler } from "../handlers/outsHandler";
import { apiLogger } from "../middlewares/apiLogger";

/**
 * @swagger
 * tags:
 *   - name: Outs
 *     description: Endpoints for calculating outs in Texas Hold'em
 */

function createRouter(): IRouter {
    const router = defineRouter();

    /**
     * @swagger
     * /api/outs/calculate:
     *   post:
     *     summary: Calculate outs for a heads-up turn scenario
     *     description: |
     *       Calculates win and tie outs for a heads-up Texas Hold'em scenario on the turn.
     *       Returns outs categorized by type (flush, straight, set, etc.).
     *
     *       Suppression rules:
     *       - If P(tie) >= 0.50 OR P(win) >= 0.45, outs will be suppressed to avoid misleading results
     *
     *       v1 constraints:
     *       - Heads-up only (2 players)
     *       - Both players' hole cards must be known
     *       - Board must have exactly 4 cards (turn)
     *       - Calculates outs to the river (one card)
     *     tags:
     *       - Outs
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - hero
     *               - villain
     *               - board
     *             properties:
     *               hero:
     *                 type: string
     *                 example: "Ah Kh"
     *                 description: Hero's hole cards (2 cards)
     *               villain:
     *                 type: string
     *                 example: "9d 9c"
     *                 description: Villain's hole cards (2 cards)
     *               board:
     *                 type: string
     *                 example: "Qh Jh 3d 2c"
     *                 description: Turn board (exactly 4 cards)
     *     responses:
     *       200:
     *         description: Outs calculation result
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 suppressed:
     *                   type: object
     *                   nullable: true
     *                   properties:
     *                     reason:
     *                       type: string
     *                     baseline_win:
     *                       type: number
     *                     baseline_tie:
     *                       type: number
     *                 win_outs:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       rank:
     *                         type: number
     *                       suit:
     *                         type: number
     *                       category:
     *                         type: number
     *                 tie_outs:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       rank:
     *                         type: number
     *                       suit:
     *                         type: number
     *                       category:
     *                         type: number
     *                 baseline_win:
     *                   type: number
     *                 baseline_tie:
     *                   type: number
     *                 baseline_lose:
     *                   type: number
     *                 total_river_cards:
     *                   type: number
     *                 win_outs_cards:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Card'
     *                 tie_outs_cards:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Card'
     *       400:
     *         description: Invalid input (missing fields, wrong number of cards, etc.)
     *       500:
     *         description: Server error
     */
    router.post("/api/outs/calculate", apiLogger, calculateOutsHandler);

    return router;
}

export const outsRouter = createRouter();
