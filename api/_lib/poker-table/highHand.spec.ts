import { parseCard, type Card, type HandRank } from "@common/interfaces";
import { bestHighHand } from "@lib/poker/highHand";
import { hand } from "@lib/poker/evaluate";
import { compareRanks } from "@lib/poker/compare";

const cards = (value: string) => value.split(" ").map(parseCard);
let referenceWork = 0;
// Independent five-card reference: enumerate subsets and rank by sorted multiplicities.
function referenceFive(input: Card[]): HandRank {
  if (++referenceWork > 25000) throw new Error("Reference work limit exceeded.");
  const ranks = input.map(c => c.rank).sort((a, b) => b - a);
  const distinct = [...new Set(ranks)];
  const flush = input.every(c => c.suit === input[0].suit);
  const wheel = distinct.join(",") === "14,5,4,3,2";
  const straight = distinct.length === 5 && (wheel || ranks[0] - ranks[4] === 4);
  const groups = distinct.map(rank => [rank, ranks.filter(n => n === rank).length]).sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const counts = groups.map(g => g[1]);
  const order = groups.map(g => g[0]);
  const result = (category: number, tiebreak: number[]) => ({ category, tiebreak }) as HandRank;
  if (flush && straight) return wheel ? result(8, [5]) : ranks[0] === 14 ? result(9, []) : result(8, [ranks[0]]);
  if (counts[0] === 4) return result(7, order);
  if (counts[0] === 3 && counts[1] === 2) return result(6, order);
  if (flush) return result(5, ranks);
  if (straight) return result(4, [wheel ? 5 : ranks[0]]);
  if (counts[0] === 3) return result(3, order);
  if (counts[0] === 2 && counts[1] === 2) return result(2, order);
  if (counts[0] === 2) return result(1, order);
  return result(0, ranks);
}
function reference(input: Card[]): HandRank {
  let best: HandRank | null = null;
  for (let a = 0; a < input.length - 4; a++) for (let b = a + 1; b < input.length - 3; b++)
    for (let c = b + 1; c < input.length - 2; c++) for (let d = c + 1; d < input.length - 1; d++)
      for (let e = d + 1; e < input.length; e++) {
        const rank = referenceFive([input[a], input[b], input[c], input[d], input[e]]);
        if (!best || compareRanks(rank, best) > 0) best = rank;
      }
  return best!;
}
describe("exact best five from a variable card set", () => {
  it.each([
    ["2c 3c 4c 5c 7c 10d 11d 12d 13d 14d 9s", 9, []],
    ["2c 2d 2h 2s 14c 14d 14h 14s 13c", 7, [14, 13]],
    ["9c 9d 9h 10c 10d 10h 2s", 6, [10, 9]],
    ["14s 2c 3d 4h 5c 9s 13h", 4, [5]],
    ["2c 4c 6c 8c 10c 3d 5d 7d 9d 11d", 5, [11, 9, 7, 5, 3]],
    ["14s 14h 13s 13h 12s 12h 11c", 2, [14, 13, 12]],
  ])("ranks all permitted cards in %s", (value, category, tiebreak) => {
    const input = cards(value as string); const result = bestHighHand(input);
    expect(result.rank).toEqual({ category, tiebreak });
    expect(result.rank).toEqual(reference(input));
    expect(referenceFive(result.cards)).toEqual(result.rank);
    expect(result.cards).toHaveLength(5);
    expect(new Set(result.cards.map(c => `${c.rank}${c.suit}`)).size).toBe(5);
    expect(bestHighHand([...input].reverse()).rank).toEqual(result.rank);
  });
  it("matches bounded independent subsets and the old seven-card evaluator", () => {
    const deck = ["c", "d", "h", "s"].flatMap(suit => Array.from({ length: 13 }, (_, i) => parseCard(`${i + 2}${suit}`)));
    let seed = 9;
    for (let trial = 0; trial < 24; trial++) {
      const sample = [...deck];
      for (let i = sample.length - 1; i > 0; i--) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const j = Math.floor(seed / 4294967296 * (i + 1)); [sample[i], sample[j]] = [sample[j], sample[i]];
      }
      const input = sample.slice(0, 5 + trial % 8);
      expect(bestHighHand(input).rank).toEqual(reference(input));
      expect(bestHighHand(sample.slice(0, 7)).rank).toEqual(hand.evaluate7(sample.slice(0, 7)));
    }
    hand.clearCache();
  });
  it("handles the maximum card set without subset enumeration", () => {
    const deck = ["c", "d", "h", "s"].flatMap(suit => Array.from({ length: 13 }, (_, i) => parseCard(`${i + 2}${suit}`)));
    expect(bestHighHand(deck).rank).toEqual({ category: 9, tiebreak: [] });
  });
  it("rejects duplicate, invalid, and undersized inputs", () => {
    expect(() => bestHighHand(cards("2c 2c 3h 4s 5d"))).toThrow("Duplicate");
    expect(() => bestHighHand(cards("2c 3h 4s 5d 15c"))).toThrow("Invalid");
    expect(() => bestHighHand(cards("2c 3h 4s 5d"))).toThrow("5 to 52");
  });
});
