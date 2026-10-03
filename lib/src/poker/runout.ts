import type { Card, CardRank } from "@common/interfaces";
import type { GameDefinition } from "@common/pokerModes";
import { nextBoardDeal, terminalBoard } from "./rules";

export interface RunoutInput {
  cards: readonly Card[];
  board: readonly Card[];
  opponents: number;
  dealtPlayerCount: number;
  burnCount: number;
  drawCapacity: number;
}
// Unknown dealt and burned cards occupy slots in this simulated deck. No real
// deck or opponent card identities enter this sampler.
export function sampleRunout(view: RunoutInput, rules: GameDefinition, rng: () => number) {
  const known = new Set([...view.cards, ...view.board].map(c => `${c.rank}${c.suit}`));
  if (view.cards.length !== 2 || known.size !== view.cards.length + view.board.length ||
      !Number.isInteger(view.dealtPlayerCount) || view.dealtPlayerCount < 2 || view.dealtPlayerCount > 8 ||
      view.opponents < 1 || view.opponents >= view.dealtPlayerCount ||
      !Number.isInteger(view.burnCount) || view.burnCount < 0 ||
      view.drawCapacity !== 52 - 2 * view.dealtPlayerCount - view.board.length - view.burnCount) {
    throw new Error("Invalid public card counts.");
  }
  const deck: Card[] = [];
  for (const suit of ["c", "d", "h", "s"] as const) for (let rank = 2; rank <= 14; rank++) {
    if (!known.has(`${rank}${suit}`)) deck.push({ rank: rank as CardRank, suit });
  }
  for (let i = 0; i < deck.length; i++) {
    const value = rng();
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new Error("Invalid random sample.");
    const index = i + Math.floor(value * (deck.length - i));
    [deck[i], deck[index]] = [deck[index], deck[i]];
  }
  const hands = Array.from({ length: view.opponents }, (_, i) => deck.slice(i * 2, i * 2 + 2));
  let cursor = 2 * (view.dealtPlayerCount - 1) + view.burnCount;
  if (cursor > deck.length) throw new Error("Invalid draw capacity.");
  const board = view.board.map(c => ({ ...c }));
  while (!terminalBoard(rules, board, deck.length - cursor)) {
    const count = nextBoardDeal(board.length);
    if (deck.length - cursor < rules.burnCards + count) throw new Error("Cannot finish the sampled board.");
    cursor += rules.burnCards;
    board.push(...deck.slice(cursor, cursor + count)); cursor += count;
  }
  return { board, hands, remainingCards: deck.length - cursor };
}
