import type { HandActionRecord, HandPlayerRecord } from "@common/interfaces";

export function formatActionDescription(
  action: HandActionRecord,
  players: HandPlayerRecord[],
): string {
  const actorName =
    action.actor_seat != null
      ? players.find((p) => p.seat_index === action.actor_seat)?.display_name ??
        `Seat ${action.actor_seat}`
      : "Dealer";

  const amountStr =
    action.amount != null
      ? ` $${(action.amount / 100).toFixed(2)}`
      : action.raise_to != null
        ? ` to $${(action.raise_to / 100).toFixed(2)}`
        : "";

  switch (action.action_type) {
    case "POST_SB":
      return `${actorName} posts SB${amountStr}`;
    case "POST_BB":
      return `${actorName} posts BB${amountStr}`;
    case "POST_ANTE":
      return `${actorName} posts ante${amountStr}`;
    case "STRADDLE":
      return `${actorName} straddles${amountStr}`;
    case "FOLD":
      return `${actorName} folds`;
    case "CHECK":
      return `${actorName} checks`;
    case "CALL":
      return `${actorName} calls${amountStr}`;
    case "BET":
      return `${actorName} bets${amountStr}`;
    case "RAISE":
      return `${actorName} raises${amountStr}`;
    case "ALL_IN":
      return `${actorName} is all-in${amountStr}`;
    case "REVEAL":
      return `${actorName} reveals`;
    case "DEAL_FLOP":
      return "Deal flop";
    case "DEAL_TURN":
      return "Deal turn";
    case "DEAL_RIVER":
      return "Deal river";
    case "COLLECT":
      return `${actorName} wins pot${amountStr}`;
    case "NOTE":
      return "Note";
    default:
      return `${actorName}: ${action.action_type}${amountStr}`;
  }
}
