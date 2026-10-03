import { parseCard } from "@common/interfaces";

export function eightSeatExhaustionDeck() {
  const all = ["c", "d", "h", "s"].flatMap(suit => Array.from({ length: 13 }, (_, i) => parseCard(`${i + 2}${suit}`)));
  const black = all.filter(c => c.suit === "c" || c.suit === "s");
  const red = all.filter(c => c.suit === "h" || c.suit === "d");
  const deck = [...black.splice(0, 16), black.shift()!, ...red.splice(0, 3), black.shift()!, red.shift()!, black.shift()!, red.shift()!];
  while (red.length >= 2) deck.push(black.shift() || red.shift()!, red.shift()!);
  return [...deck, ...black, ...red];
}
