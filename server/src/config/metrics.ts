import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("ship-inspector-server", "1.0.0");

/**
 * Counter for equity calculation requests
 * Tags:
 * - players: number of players
 * - board_state: preflop, river
 * - calculation_mode: rust
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
 * Counter for user registrations (signups)
 * Tags:
 * - status: success, failure
 * - failure_reason: invalid_invite_code, email_exists, invalid_email, etc.
 */
export const userRegistrationCounter = meter.createCounter(
    "auth.registrations",
    {
        description: "Total number of user registration attempts",
    }
);

/**
 * Counter for user logins
 * Tags:
 * - status: success, failure
 * - failure_reason: invalid_credentials, user_not_found, etc.
 */
export const userLoginCounter = meter.createCounter("auth.logins", {
    description: "Total number of user login attempts",
});

/**
 * Gauge for total number of registered users
 */
export const totalUsersGauge = meter.createUpDownCounter("auth.users.total", {
    description: "Total number of registered users",
});

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
