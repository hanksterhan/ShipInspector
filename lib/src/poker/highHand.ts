import type { Card, CardRank, HandCategory, HandRank } from "@common/interfaces";
import { compareRanks } from "./compare";

export interface HighHand { rank: HandRank; cards: Card[] }
const suits = ["c", "d", "h", "s"] as const;

function straight(ranks: number[]): CardRank[] | null {
  const seen = new Set(ranks);
  for (let high = 14; high >= 5; high--) {
    const run = Array.from({ length: 5 }, (_, i) => high - i === 1 ? 14 : high - i);
    if (run.every(rank => seen.has(rank))) return run as CardRank[];
  }
  return null;
}

// Exact standard-high ranking. Work depends on card count, not C(N, 5).
// Legal hole-card selection belongs to the mode, separate from this evaluator.
export function bestHighHand(input: readonly Card[]): HighHand {
  if (input.length < 5 || input.length > 52) throw new Error("A high hand needs 5 to 52 cards.");
  const seen = new Set<string>();
  for (const card of input) {
    if (!Number.isInteger(card.rank) || card.rank < 2 || card.rank > 14 || !suits.includes(card.suit)) {
      throw new Error("Invalid card in high hand.");
    }
    const key = `${card.rank}${card.suit}`;
    if (seen.has(key)) throw new Error("Duplicate card in high hand.");
    seen.add(key);
  }
  const cards = [...input].sort((a, b) => b.rank - a.rank || suits.indexOf(a.suit) - suits.indexOf(b.suit));
  const groups = new Map<CardRank, Card[]>();
  for (const card of cards) groups.set(card.rank, [...(groups.get(card.rank) || []), card]);
  const ranks = [...groups.keys()];
  const make = (category: HandCategory, tiebreak: CardRank[], selected: Card[]): HighHand => ({ rank: { category, tiebreak }, cards: selected });
  const select = (values: CardRank[]) => values.map(rank => groups.get(rank)![0]);
  const better = (candidate: HighHand, current: HighHand | null) => !current || compareRanks(candidate.rank, current.rank) > 0 ? candidate : current;
  let flush: HighHand | null = null;
  let straightFlush: HighHand | null = null;
  for (const suit of suits) {
    const suited = cards.filter(card => card.suit === suit);
    if (suited.length < 5) continue;
    flush = better(make(5, suited.slice(0, 5).map(c => c.rank), suited.slice(0, 5)), flush);
    const run = straight(suited.map(card => card.rank));
    if (run) straightFlush = better(make(run[0] === 14 ? 9 : 8, run[0] === 14 ? [] : [run[0]],
      run.map(rank => suited.find(card => card.rank === rank)!)), straightFlush);
  }
  if (straightFlush) return straightFlush;
  const quad = ranks.find(rank => groups.get(rank)!.length === 4);
  if (quad) {
    const kicker = ranks.find(rank => rank !== quad)!;
    return make(7, [quad, kicker], [...groups.get(quad)!, groups.get(kicker)![0]]);
  }
  const trip = ranks.find(rank => groups.get(rank)!.length >= 3);
  const pairForHouse = trip && ranks.find(rank => rank !== trip && groups.get(rank)!.length >= 2);
  if (trip && pairForHouse) return make(6, [trip, pairForHouse], [...groups.get(trip)!.slice(0, 3), ...groups.get(pairForHouse)!.slice(0, 2)]);
  if (flush) return flush;
  const run = straight(ranks);
  if (run) return make(4, [run[0]], select(run));
  if (trip) {
    const kickers = ranks.filter(rank => rank !== trip).slice(0, 2);
    return make(3, [trip, ...kickers], [...groups.get(trip)!.slice(0, 3), ...select(kickers)]);
  }
  const pairs = ranks.filter(rank => groups.get(rank)!.length >= 2);
  if (pairs.length >= 2) {
    const top = pairs.slice(0, 2);
    const kicker = ranks.find(rank => !top.includes(rank))!;
    return make(2, [...top, kicker], [...top.flatMap(rank => groups.get(rank)!.slice(0, 2)), groups.get(kicker)![0]]);
  }
  if (pairs.length) {
    const pair = pairs[0];
    const kickers = ranks.filter(rank => rank !== pair).slice(0, 3);
    return make(1, [pair, ...kickers], [...groups.get(pair)!.slice(0, 2), ...select(kickers)]);
  }
  return make(0, ranks.slice(0, 5), select(ranks.slice(0, 5)));
}
