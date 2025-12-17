import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("ship-inspector-server", "1.0.0");

/**
 * Counter for equity calculation requests
 * Tags:
 * - players: number of players
 * - board_state: preflop, flop, turn, river, complete
 * - calculation_mode: exact, mc, auto
 */
export const equityCalculationCounter = meter.createCounter(
    "poker.equity.calculations",
    {
        description: "Total number of equity calculation requests",
    }
);

/**
 * Counter for hand comparison requests
 * Tags:
 * - board_state: preflop, flop, turn, river, complete
 * - result: hand1_wins, hand2_wins, tie
 */
export const handComparisonCounter = meter.createCounter(
    "poker.hand.comparisons",
    {
        description: "Total number of hand comparison requests",
    }
);

/**
 * Helper function to determine board state from number of board cards
 */
export function getBoardState(boardLength: number): string {
    if (boardLength === 0) return "preflop";
    if (boardLength === 3) return "flop";
    if (boardLength === 4) return "turn";
    if (boardLength === 5) return "river";
    return "complete";
}

