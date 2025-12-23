import { Request, Response } from "express";
import {
    HandReplay,
    SaveHandReplayRequest,
    SaveHandReplayResponse,
    LoadHandReplayRequest,
    LoadHandReplayResponse,
    ListHandReplaysRequest,
    ListHandReplaysResponse,
    DeleteHandReplayRequest,
    DeleteHandReplayResponse,
    ApiErrorResponse,
} from "@common/interfaces";
import { replayRepository } from "../integrations/replay/replayRepository";

class ReplayHandler {
    /**
     * Save a hand replay
     * POST /poker/replay/save
     */
    saveHandReplay = async (req: Request, res: Response) => {
        try {
            const { replay }: SaveHandReplayRequest = req.body;

            if (!replay) {
                const errorResponse: ApiErrorResponse = {
                    error: "Replay data is required",
                };
                return res.status(400).json(errorResponse);
            }

            // Validate required fields
            if (
                !replay.tableSize ||
                replay.buttonPosition === undefined ||
                !replay.smallBlind ||
                !replay.bigBlind ||
                !replay.players ||
                !replay.streets ||
                !replay.board ||
                !replay.deadCards
            ) {
                const errorResponse: ApiErrorResponse = {
                    error: "Missing required replay fields",
                };
                return res.status(400).json(errorResponse);
            }

            // Validate table size
            if (replay.tableSize < 2 || replay.tableSize > 10) {
                const errorResponse: ApiErrorResponse = {
                    error: "Table size must be between 2 and 10",
                };
                return res.status(400).json(errorResponse);
            }

            // Validate button position
            if (
                replay.buttonPosition < 0 ||
                replay.buttonPosition >= replay.tableSize
            ) {
                const errorResponse: ApiErrorResponse = {
                    error: "Button position must be within table size",
                };
                return res.status(400).json(errorResponse);
            }

            // If replay has an ID, update it; otherwise create new
            let id: string;
            if (replay.id) {
                const updated = await replayRepository.updateReplay(
                    replay.id,
                    replay
                );
                if (!updated) {
                    const errorResponse: ApiErrorResponse = {
                        error: "Replay not found",
                    };
                    return res.status(404).json(errorResponse);
                }
                id = replay.id;
            } else {
                id = await replayRepository.saveReplay(replay);
            }

            // Load the saved replay to return
            const savedReplay = await replayRepository.loadReplay(id);
            if (!savedReplay) {
                const errorResponse: ApiErrorResponse = {
                    error: "Failed to load saved replay",
                };
                return res.status(500).json(errorResponse);
            }

            const response: SaveHandReplayResponse = {
                id,
                replay: savedReplay,
            };
            res.status(200).json(response);
        } catch (error: any) {
            const errorResponse: ApiErrorResponse = {
                error: error.message || "Failed to save hand replay",
            };
            res.status(500).json(errorResponse);
        }
    };

    /**
     * Load a hand replay by ID
     * GET /poker/replay/:id
     */
    loadHandReplay = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            if (!id) {
                const errorResponse: ApiErrorResponse = {
                    error: "Replay ID is required",
                };
                return res.status(400).json(errorResponse);
            }

            const replay = await replayRepository.loadReplay(id);

            if (!replay) {
                const errorResponse: ApiErrorResponse = {
                    error: "Replay not found",
                };
                return res.status(404).json(errorResponse);
            }

            const response: LoadHandReplayResponse = {
                replay,
            };
            res.status(200).json(response);
        } catch (error: any) {
            const errorResponse: ApiErrorResponse = {
                error: error.message || "Failed to load hand replay",
            };
            res.status(500).json(errorResponse);
        }
    };

    /**
     * List hand replays with pagination and optional search
     * GET /poker/replay/list
     */
    listHandReplays = async (req: Request, res: Response) => {
        try {
            const limit = req.query.limit
                ? parseInt(req.query.limit as string)
                : undefined;
            const offset = req.query.offset
                ? parseInt(req.query.offset as string)
                : undefined;
            const search = req.query.search as string | undefined;

            const options: ListHandReplaysRequest = {
                limit,
                offset,
                search,
            };

            const result = await replayRepository.listReplays(options);

            const response: ListHandReplaysResponse = {
                replays: result.replays,
                total: result.total,
            };
            res.status(200).json(response);
        } catch (error: any) {
            const errorResponse: ApiErrorResponse = {
                error: error.message || "Failed to list hand replays",
            };
            res.status(500).json(errorResponse);
        }
    };

    /**
     * Delete a hand replay by ID
     * DELETE /poker/replay/:id
     */
    deleteHandReplay = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            if (!id) {
                const errorResponse: ApiErrorResponse = {
                    error: "Replay ID is required",
                };
                return res.status(400).json(errorResponse);
            }

            const deleted = await replayRepository.deleteReplay(id);

            if (!deleted) {
                const errorResponse: ApiErrorResponse = {
                    error: "Replay not found",
                };
                return res.status(404).json(errorResponse);
            }

            const response: DeleteHandReplayResponse = {
                success: true,
            };
            res.status(200).json(response);
        } catch (error: any) {
            const errorResponse: ApiErrorResponse = {
                error: error.message || "Failed to delete hand replay",
            };
            res.status(500).json(errorResponse);
        }
    };
}

export const replayHandler = new ReplayHandler();
