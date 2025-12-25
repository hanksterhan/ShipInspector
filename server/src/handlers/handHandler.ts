import { Request, Response } from "express";
import {
    Card,
    Hole,
    HandRank,
    parseCard,
    parseHole,
    parseBoard,
    EvaluateHandRequest,
    EvaluateHandResponse,
    CompareHandsRequest,
    CompareHandsResponse,
    CalculateEquityRequest,
    CalculateEquityResponse,
    ApiErrorResponse,
} from "@common/interfaces";
import { hand } from "../integrations/hand";
import { computeEquity } from "../integrations/hand/equity";
import {
    equityCalculationCounter,
    handComparisonCounter,
    getBoardState,
} from "../config/metrics";

class HandHandler {
    /**
     * Evaluate a hand (hole cards + board)
     * POST /poker/hand/evaluate
     *
     * Body: { hole: "14h 14d", board?: "12h 11h 10h 9h 8h" }
     *
     * Note: For best results, provide 7 cards total (2 hole + 5 board).
     * If fewer cards are provided, the function will evaluate the best hand
     * from the available cards, but results may not be accurate for incomplete boards.
     */
    evaluateHand = async (req: Request, res: Response) => {
        try {
            const { hole, board = "" }: EvaluateHandRequest = req.body;

            if (!hole) {
                const errorResponse: ApiErrorResponse = {
                    error: "Hole cards are required",
                };
                return res.status(400).json(errorResponse);
            }

            const holeCards = parseHole(hole);
            const boardCards = parseBoard(board || "");

            // Combine hole and board cards
            const allCards = [...holeCards.cards, ...boardCards.cards];

            if (allCards.length < 2) {
                const errorResponse: ApiErrorResponse = {
                    error: "Need at least 2 cards (hole cards) to evaluate",
                };
                return res.status(400).json(errorResponse);
            }

            if (allCards.length > 7) {
                const errorResponse: ApiErrorResponse = {
                    error: "Cannot evaluate more than 7 cards",
                };
                return res.status(400).json(errorResponse);
            }

            // evaluate7 requires exactly 7 cards
            // If we have fewer, we need to handle it differently
            let handRank: HandRank;
            if (allCards.length === 7) {
                handRank = hand.evaluate7(allCards);
            } else if (allCards.length === 5) {
                // For 5 cards, we can evaluate directly by creating a dummy 7-card hand
                // But actually, we should just evaluate the 5-card hand
                // Since evaluate7 requires 7 cards, we'll pad with dummy cards that won't affect the result
                // Actually, this is complex. Let's just require 7 cards for now.
                return res.status(400).json({
                    error: "Please provide exactly 7 cards (2 hole + 5 board) for accurate evaluation",
                });
            } else {
                const errorResponse: ApiErrorResponse = {
                    error: `Currently requires exactly 7 cards for evaluation. You provided ${allCards.length} cards (2 hole + ${boardCards.cards.length} board).`,
                };
                return res.status(400).json(errorResponse);
            }

            const response: EvaluateHandResponse = {
                handRank,
                hole: holeCards.cards,
                board: boardCards.cards,
            };
            res.status(200).json(response);
        } catch (error: any) {
            const errorResponse: ApiErrorResponse = {
                error: error.message || "Failed to evaluate hand",
            };
            res.status(400).json(errorResponse);
        }
    };

    /**
     * Compare two hands
     * POST /poker/hand/compare
     */
    compareHands = async (req: Request, res: Response) => {
        try {
            const { hole1, hole2, board = "" }: CompareHandsRequest = req.body;

            if (!hole1 || !hole2) {
                const errorResponse: ApiErrorResponse = {
                    error: "Both hole1 and hole2 are required",
                };
                return res.status(400).json(errorResponse);
            }

            const holeCards1 = parseHole(hole1);
            const holeCards2 = parseHole(hole2);
            const boardCards = parseBoard(board || "");

            // Combine cards for each player
            const allCards1 = [...holeCards1.cards, ...boardCards.cards];
            const allCards2 = [...holeCards2.cards, ...boardCards.cards];

            if (allCards1.length !== 7 || allCards2.length !== 7) {
                const errorResponse: ApiErrorResponse = {
                    error: "Both players need exactly 7 cards (2 hole + 5 board)",
                };
                return res.status(400).json(errorResponse);
            }

            const handRank1 = hand.evaluate7(allCards1);
            const handRank2 = hand.evaluate7(allCards2);
            const comparison = hand.compareRanks(handRank1, handRank2);

            const result =
                comparison > 0
                    ? "hand1_wins"
                    : comparison < 0
                      ? "hand2_wins"
                      : "tie";

            // Record metric for hand comparison
            const boardState = getBoardState(boardCards.cards.length);
            handComparisonCounter.add(1, {
                board_state: boardState,
                result: result,
            });

            const response: CompareHandsResponse = {
                hand1: {
                    hole: holeCards1.cards,
                    rank: handRank1,
                },
                hand2: {
                    hole: holeCards2.cards,
                    rank: handRank2,
                },
                comparison: {
                    result: result,
                    value: comparison,
                },
            };
            res.status(200).json(response);
        } catch (error: any) {
            const errorResponse: ApiErrorResponse = {
                error: error.message || "Failed to compare hands",
            };
            res.status(400).json(errorResponse);
        }
    };

    /**
     * Calculate equity for multiple players
     * POST /poker/equity/calculate
     */
    calculateEquity = async (req: Request, res: Response) => {
        try {
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
                return res.status(400).json(errorResponse);
            }

            // Parse all inputs
            const parsedPlayers: Hole[] = players.map((holeStr) =>
                parseHole(holeStr)
            );
            const parsedBoard = parseBoard(board || "");
            const parsedDead: Card[] = dead.map((cardStr) =>
                parseCard(cardStr)
            );

            // Calculate equity using Rust WASM implementation
            const equityResult = await computeEquity(
                parsedPlayers,
                parsedBoard,
                options,
                parsedDead
            );

            // Record metric for equity calculation
            const boardState = getBoardState(parsedBoard.cards.length);
            const calculationMode = options.mode || "auto";
            equityCalculationCounter.add(1, {
                players: parsedPlayers.length.toString(),
                board_state: boardState,
                calculation_mode: calculationMode,
            });

            const response: CalculateEquityResponse = {
                equity: equityResult,
                players: parsedPlayers.map((p) => p.cards),
                board: parsedBoard.cards,
                dead: parsedDead,
                fromCache: false,
            };
            res.status(200).json(response);
        } catch (error: any) {
            const errorResponse: ApiErrorResponse = {
                error: error.message || "Failed to calculate equity",
            };
            res.status(400).json(errorResponse);
        }
    };
}

export const handHandler = new HandHandler();
