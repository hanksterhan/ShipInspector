import { IRouter, Router as defineRouter } from "express";
import { calculateOutsHandler } from "../handlers";
import { requireAuth, strictRateLimiter } from "../middlewares";

/**
 * @swagger
 * tags:
 *   - name: Poker Outs Calculation
 *     description: Endpoints for calculating outs (cards needed to win) on the turn
 */

function createRouter(): IRouter {
    const router = defineRouter();

    /**
     * @swagger
     * /poker/outs/calculate:
     *   post:
     *     tags:
     *       - Poker Outs Calculation
     *     summary: Calculate outs for heads-up turn scenario
     *     description: Calculates which cards (outs) the hero needs on the river to win or tie against the villain. Requires exactly 4 cards on the board (turn).
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CalculateOutsRequest'
     *           examples:
     *             flushDraw:
     *               summary: Flush draw example
     *               value:
     *                 hero: "14h 13h"
     *                 villain: "9d 9c"
     *                 board: "8h 7h 6h 2c"
     *     responses:
     *       '200':
     *         description: Outs calculated successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/CalculateOutsResponse'
     *       '400':
     *         description: Bad request (invalid input, missing required fields, etc.)
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ApiErrorResponse'
     */
    router.post(
        "/poker/outs/calculate",
        requireAuth(),
        strictRateLimiter,
        calculateOutsHandler
    );

    return router;
}

export const outsRouter = createRouter();

