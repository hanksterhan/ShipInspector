import { describe, it, expect } from "vitest";
import {
  cardToString,
  holeToString,
  boardToString,
  getRankLabel,
  formatHandRank,
} from "./formatting";
import type { HandRank } from "@common/interfaces";

describe("cardToString", () => {
  it("converts a card to string format", () => {
    expect(cardToString({ rank: 14, suit: "h" })).toBe("14h");
    expect(cardToString({ rank: 2, suit: "c" })).toBe("2c");
    expect(cardToString({ rank: 13, suit: "s" })).toBe("13s");
  });
});

describe("holeToString", () => {
  it("converts a hole to string format", () => {
    expect(
      holeToString({
        cards: [
          { rank: 14, suit: "h" },
          { rank: 14, suit: "d" },
        ],
      }),
    ).toBe("14h 14d");
  });
});

describe("boardToString", () => {
  it("converts board cards to string format", () => {
    expect(
      boardToString({
        cards: [
          { rank: 13, suit: "d" },
          { rank: 9, suit: "h" },
          { rank: 2, suit: "c" },
        ],
      }),
    ).toBe("13d 9h 2c");
  });

  it("handles empty board", () => {
    expect(boardToString({ cards: [] })).toBe("");
  });
});

describe("getRankLabel", () => {
  it("returns labels for face cards", () => {
    expect(getRankLabel(11)).toBe("J");
    expect(getRankLabel(12)).toBe("Q");
    expect(getRankLabel(13)).toBe("K");
    expect(getRankLabel(14)).toBe("A");
  });

  it("returns number labels for pip cards", () => {
    expect(getRankLabel(2)).toBe("2");
    expect(getRankLabel(10)).toBe("10");
  });
});

describe("formatHandRank", () => {
  const cases: [HandRank, string][] = [
    [{ category: 9, tiebreak: [] }, "Royal flush"],
    [{ category: 8, tiebreak: [13] }, "K high straight flush"],
    [{ category: 7, tiebreak: [14, 13] }, "Four of a kind (As)"],
    [{ category: 6, tiebreak: [13, 6] }, "Full house (Ks over 6s)"],
    [{ category: 5, tiebreak: [13] }, "K high flush"],
    [{ category: 4, tiebreak: [10] }, "10 high straight"],
    [{ category: 3, tiebreak: [7] }, "Three of a kind (7s)"],
    [{ category: 2, tiebreak: [13, 6] }, "Two pair (Ks and 6s)"],
    [{ category: 1, tiebreak: [6] }, "Pair of 6s"],
    [{ category: 0, tiebreak: [13] }, "K high"],
  ];

  cases.forEach(([handRank, expected]) => {
    it(`formats category ${handRank.category} correctly`, () => {
      expect(formatHandRank(handRank)).toBe(expected);
    });
  });
});
