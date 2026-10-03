import type { Card } from "@common/interfaces";
import type { GameDefinition, TerminalReason } from "@common/pokerModes";

// Use after betting closes, or while running out a hand that cannot take bets.
// Callers supply draw capacity, never hidden card identities or the real deck.
export function terminalBoard(
  rules: GameDefinition, board: readonly Card[], remainingCards: number,
): Exclude<TerminalReason, "uncontested"> | null {
  if (board.length < 5) return null;
  if (rules.riverContinuation === "never") return "river-complete";
  const latest = board[board.length - 1];
  if (latest.suit === "c" || latest.suit === "s") return "black-river";
  return remainingCards < rules.burnCards + 1 ? "deck-exhausted" : null;
}

export function nextBoardDeal(boardCount: number): number {
  if (boardCount === 0) return 3;
  if (boardCount >= 3) return 1;
  throw new Error("Invalid board deal state.");
}
