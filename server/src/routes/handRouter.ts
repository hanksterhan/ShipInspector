import { IRouter, Router as defineRouter } from "express";
import { handHandler } from "../handlers";
import { authenticateSession, strictRateLimiter } from "../middlewares";

/**
 * @swagger
 * tags:
 *   - name: Poker Hand Evaluation
 *     description: Endpoints for evaluating and comparing poker hands
 *   - name: Poker Equity Calculation
 *     description: Endpoints for calculating poker hand equity (win/tie/lose percentages)
 */

function createRouter(): IRouter {
    const router = defineRouter();

    /**
     * @swagger
     * /poker/hand/evaluate:
     *   post:
     *     tags:
     *       - Poker Hand Evaluation
     *     summary: Evaluate a poker hand
     *     description: Evaluates a poker hand consisting of hole cards (2) and board cards (0-5). Returns the best 5-card hand rank. For best results, provide exactly 7 cards total (2 hole + 5 board).
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/EvaluateHandRequest'
     *           examples:
     *             pocketAces:
     *               summary: Pocket Aces with full board
     *               value:
     *                 hole: "14h 14d"
     *                 board: "12h 11h 10h 9h 8h"
     *             pocketKings:
     *               summary: Pocket Kings with flop
     *               value:
     *                 hole: "13h 13d"
     *                 board: "12h 11h 10h"
     *     responses:
     *       '200':
     *         description: Hand evaluated successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/EvaluateHandResponse'
     *             examples:
     *               fullHouse:
     *                 summary: Full house example
     *                 value:
     *                   handRank:
     *                     category: 6
     *                     tiebreak: [14, 13]
     *                   hole:
     *                     - rank: 14
     *                       suit: "h"
     *                     - rank: 14
     *                       suit: "d"
     *                   board:
     *                     - rank: 12
     *                       suit: "h"
     *                     - rank: 11
     *                       suit: "h"
     *                     - rank: 10
     *                       suit: "h"
     *                     - rank: 9
     *                       suit: "h"
     *                     - rank: 8
     *                       suit: "h"
     *       '400':
     *         description: Bad request (invalid input, missing required fields, etc.)
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ApiErrorResponse'
     *             example:
     *               error: "Hole cards are required"
     */
    router.post(
        "/poker/hand/evaluate",
        authenticateSession,
        strictRateLimiter,
        handHandler.evaluateHand
    );

    /**
     * @swagger
     * /poker/hand/compare:
     *   post:
     *     tags:
     *       - Poker Hand Evaluation
     *     summary: Compare two poker hands
     *     description: Compares two poker hands to determine which is better. Both players must have the same board. Returns detailed comparison results.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CompareHandsRequest'
     *           examples:
     *             acesVsKings:
     *               summary: Pocket Aces vs Pocket Kings
     *               value:
     *                 hole1: "14h 14d"
     *                 hole2: "13h 13d"
     *                 board: "12h 11h 10h 9h 8h"
     *             flushVsStraight:
     *               summary: Flush vs Straight
     *               value:
     *                 hole1: "14h 13h"
     *                 hole2: "9d 8d"
     *                 board: "12h 11h 10h 7h 2c"
     *     responses:
     *       '200':
     *         description: Hands compared successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/CompareHandsResponse'
     *             examples:
     *               comparison:
     *                 summary: Hand comparison result
     *                 value:
     *                   hand1:
     *                     hole:
     *                       - rank: 14
     *                         suit: "h"
     *                       - rank: 14
     *                         suit: "d"
     *                     rank:
     *                       category: 6
     *                       tiebreak: [14, 13]
     *                   hand2:
     *                     hole:
     *                       - rank: 13
     *                         suit: "h"
     *                       - rank: 13
     *                         suit: "d"
     *                     rank:
     *                       category: 6
     *                       tiebreak: [13, 14]
     *                   comparison:
     *                     result: "hand1_wins"
     *                     value: 1
     *       '400':
     *         description: Bad request
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ApiErrorResponse'
     */
    router.post(
        "/poker/hand/compare",
        authenticateSession,
        strictRateLimiter,
        handHandler.compareHands
    );

    /**
     * @swagger
     * /poker/equity/calculate:
     *   post:
     *     tags:
     *       - Poker Equity Calculation
     *     summary: Calculate equity for multiple players
     *     description: Calculates win/tie/lose percentages (equity) for multiple players given their hole cards and a board state. Uses high-performance Rust WASM implementation. Currently supports preflop (empty board) and river showdown (complete 5-card board).
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CalculateEquityRequest'
     *           examples:
     *             preflop:
     *               summary: Pre-flop equity (2 players)
     *               value:
     *                 players: ["14h 14d", "13h 13d"]
     *                 board: ""
     *                 options:
     *                   mode: "rust"
     *             river:
     *               summary: River showdown (complete board)
     *               value:
     *                 players: ["14h 14d", "13h 13d"]
     *                 board: "12h 11h 10h 9h 8h"
     *                 options:
     *                   mode: "rust"
     *             preflopWithDead:
     *               summary: Pre-flop equity with dead cards
     *               value:
     *                 players: ["14h 14d", "13h 13d", "12h 12d"]
     *                 board: ""
     *                 dead: ["7h", "6h"]
     *                 options:
     *                   mode: "rust"
     *     responses:
     *       '200':
     *         description: Equity calculated successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/CalculateEquityResponse'
     *             examples:
     *               equityResult:
     *                 summary: Equity calculation result
     *                 value:
     *                   equity:
     *                     win: [0.85, 0.15]
     *                     tie: [0.0, 0.0]
     *                     lose: [0.15, 0.85]
     *                     samples: 990
     *                   players:
     *                     - - rank: 14
     *                         suit: "h"
     *                       - rank: 14
     *                         suit: "d"
     *                     - - rank: 13
     *                         suit: "h"
     *                       - rank: 13
     *                         suit: "d"
     *                   board:
     *                     - rank: 12
     *                       suit: "h"
     *                     - rank: 11
     *                       suit: "h"
     *                     - rank: 10
     *                       suit: "h"
     *                   dead: []
     *       '400':
     *         description: Bad request
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ApiErrorResponse'
     *             example:
     *               error: "At least 2 players are required"
     */
    router.post(
        "/poker/equity/calculate",
        authenticateSession,
        strictRateLimiter,
        handHandler.calculateEquity
    );

    return router;
}

export const handRouter = createRouter();
