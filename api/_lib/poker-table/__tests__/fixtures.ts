import { parseCard, type Card } from "@common/interfaces";

export function eightSeatExhaustionDeck() {
  const all = ["c", "d", "h", "s"].flatMap(suit => Array.from({ length: 13 }, (_, i) => parseCard(`${i + 2}${suit}`)));
  const black = all.filter(c => c.suit === "c" || c.suit === "s");
  const red = all.filter(c => c.suit === "h" || c.suit === "d");
  const deck = [...black.splice(0, 16), black.shift()!, ...red.splice(0, 3), black.shift()!, red.shift()!, black.shift()!, red.shift()!];
  while (red.length >= 2) deck.push(black.shift() || red.shift()!, red.shift()!);
  return [...deck, ...black, ...red];
}

const cards = (text: string) => text.trim().split(/\s+/).map(parseCard);
const key = (c: Card) => `${c.rank}${c.suit}`;
// players: hole cards in deal order (left of the button first). The ghost's
// two cards follow; burns use spare cards.
export function stackedDeck(players: string[], ghost: string, board: string): Card[] {
  const hands = players.map(cards); const shown = cards(board);
  const head: (Card | null)[] = [...hands.map(h => h[0]), ...hands.map(h => h[1]), ...(ghost ? cards(ghost) : []), null, ...shown.slice(0, 3)];
  for (const c of shown.slice(3)) head.push(null, c);
  const seen = new Set(head.filter((c): c is Card => !!c).map(key));
  const rest = ["c", "d", "h", "s"].flatMap(suit => Array.from({ length: 13 }, (_, i) => parseCard(`${i + 2}${suit}`))).filter(c => !seen.has(key(c)));
  return [...head.map(c => c ?? rest.shift()!), ...rest];
}
