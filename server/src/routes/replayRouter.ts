import { IRouter, Router as defineRouter } from "express";
import { replayHandler } from "../handlers/replayHandler";

/**
 * @swagger
 * tags:
 *   - name: Hand Replay
 *     description: Endpoints for saving, loading, and managing poker hand replays
 */

function createRouter(): IRouter {
    const router = defineRouter();

    /**
     * @swagger
     * /poker/replay/save:
     *   post:
     *     tags:
     *       - Hand Replay
     *     summary: Save a hand replay
     *     description: Saves a new hand replay or updates an existing one if an ID is provided
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/SaveHandReplayRequest'
     *     responses:
     *       '200':
     *         description: Hand replay saved successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SaveHandReplayResponse'
     *       '400':
     *         description: Bad request (invalid input, missing required fields, etc.)
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ApiErrorResponse'
     */
    router.post("/poker/replay/save", replayHandler.saveHandReplay);

    /**
     * @swagger
     * /poker/replay/{id}:
     *   get:
     *     tags:
     *       - Hand Replay
     *     summary: Load a hand replay by ID
     *     description: Retrieves a saved hand replay by its ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: The replay ID
     *     responses:
     *       '200':
     *         description: Hand replay loaded successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/LoadHandReplayResponse'
     *       '404':
     *         description: Replay not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ApiErrorResponse'
     */
    router.get("/poker/replay/:id", replayHandler.loadHandReplay);

    /**
     * @swagger
     * /poker/replay/list:
     *   get:
     *     tags:
     *       - Hand Replay
     *     summary: List hand replays
     *     description: Lists saved hand replays with optional pagination and search
     *     parameters:
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 50
     *         description: Maximum number of replays to return
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *           default: 0
     *         description: Number of replays to skip
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *         description: Search term to filter by title
     *     responses:
     *       '200':
     *         description: List of hand replays
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ListHandReplaysResponse'
     */
    router.get("/poker/replay/list", replayHandler.listHandReplays);

    /**
     * @swagger
     * /poker/replay/{id}:
     *   delete:
     *     tags:
     *       - Hand Replay
     *     summary: Delete a hand replay
     *     description: Deletes a hand replay by its ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: The replay ID
     *     responses:
     *       '200':
     *         description: Hand replay deleted successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/DeleteHandReplayResponse'
     *       '404':
     *         description: Replay not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ApiErrorResponse'
     */
    router.delete("/poker/replay/:id", replayHandler.deleteHandReplay);

    return router;
}

export const replayRouter = createRouter();
