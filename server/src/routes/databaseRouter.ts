import { IRouter, Router as defineRouter } from "express";
import { databaseHandler } from "../handlers/databaseHandler";

/**
 * @swagger
 * tags:
 *   - name: Database
 *     description: Database management and seeding endpoints
 */

function createRouter(): IRouter {
    const router = defineRouter();

    /**
     * @swagger
     * /db/equity-cache/seed:
     *   post:
     *     tags:
     *       - Database
     *     summary: Seed the equity cache database
     *     description: |
     *       Starts seeding the equity cache database with pre-computed equity values for common pre-flop matchups.
     *       This is a long-running operation that runs in the background. The endpoint returns immediately with a 202 status.
     *       Check server logs for progress updates.
     *     parameters:
     *       - in: query
     *         name: handCount
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 169
     *           default: 50
     *         description: |
     *           Number of top starting hands to seed (default: 50).
     *           Each hand will be matched against all other hands,
     *           creating handCount times (handCount minus 1) divided by 2 unique matchups.
     *     responses:
     *       '202':
     *         description: Seeding started successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Equity cache seeding started"
     *                 handCount:
     *                   type: integer
     *                   example: 50
     *                 estimatedMatchups:
     *                   type: integer
     *                   example: 1225
     *                 status:
     *                   type: string
     *                   example: "processing"
     *                 note:
     *                   type: string
     *                   example: "Check server logs for progress updates"
     *       '400':
     *         description: Bad request (invalid handCount)
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ApiErrorResponse'
     *       '500':
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ApiErrorResponse'
     */
    router.post("/db/equity-cache/seed", databaseHandler.seedEquityCache);

    /**
     * @swagger
     * /db/equity-cache/stats:
     *   get:
     *     tags:
     *       - Database
     *     summary: Get equity cache statistics
     *     description: Returns statistics about the equity cache database including total entries, access counts, and most accessed entries.
     *     responses:
     *       '200':
     *         description: Statistics retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 size:
     *                   type: integer
     *                   description: Total number of entries in the cache
     *                   example: 1225
     *                 totalAccesses:
     *                   type: integer
     *                   description: Total number of cache accesses
     *                   example: 5432
     *                 mostAccessed:
     *                   type: array
     *                   description: Top 10 most accessed cache entries
     *                   items:
     *                     type: object
     *                     properties:
     *                       key:
     *                         type: string
     *                         example: "2p:14h14d|13h13d:b::mode=exact"
     *                       count:
     *                         type: integer
     *                         example: 42
     *       '500':
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ApiErrorResponse'
     */
    router.get("/db/equity-cache/stats", databaseHandler.getEquityCacheStats);

    return router;
}

export const databaseRouter = createRouter();
