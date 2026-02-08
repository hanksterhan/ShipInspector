import { describe, it, expect } from "vitest";
import type { Card } from "@common/interfaces";
import {
  evaluate5CardHand,
  compareHandRanks,
  cardsEqual,
  findBest5CardHand,
} from "./handEvaluator";

function card(rank: number, suit: string): Card {
  return { rank, suit } as Card;
}

describe("evaluate5CardHand", () => {
  it("detects royal flush", () => {
    const hand = [
      card(14, "h"),
      card(13, "h"),
      card(12, "h"),
      card(11, "h"),
      card(10, "h"),
    ];
    expect(evaluate5CardHand(hand).category).toBe(9);
  });

  it("detects straight flush", () => {
    const hand = [
      card(9, "s"),
      card(8, "s"),
      card(7, "s"),
      card(6, "s"),
      card(5, "s"),
    ];
    const result = evaluate5CardHand(hand);
    expect(result.category).toBe(8);
    expect(result.tiebreak[0]).toBe(9);
  });

  it("detects four of a kind", () => {
    const hand = [
      card(7, "h"),
      card(7, "d"),
      card(7, "c"),
      card(7, "s"),
      card(2, "h"),
    ];
    const result = evaluate5CardHand(hand);
    expect(result.category).toBe(7);
    expect(result.tiebreak[0]).toBe(7);
  });

  it("detects full house", () => {
    const hand = [
      card(10, "h"),
      card(10, "d"),
      card(10, "c"),
      card(5, "s"),
      card(5, "h"),
    ];
    const result = evaluate5CardHand(hand);
    expect(result.category).toBe(6);
    expect(result.tiebreak).toEqual([10, 5]);
  });

  it("detects flush", () => {
    const hand = [
      card(14, "d"),
      card(10, "d"),
      card(8, "d"),
      card(5, "d"),
      card(3, "d"),
    ];
    expect(evaluate5CardHand(hand).category).toBe(5);
  });

  it("detects straight", () => {
    const hand = [
      card(10, "h"),
      card(9, "d"),
      card(8, "c"),
      card(7, "s"),
      card(6, "h"),
    ];
    const result = evaluate5CardHand(hand);
    expect(result.category).toBe(4);
    expect(result.tiebreak[0]).toBe(10);
  });

  it("detects wheel straight (A-2-3-4-5)", () => {
    const hand = [
      card(14, "h"),
      card(5, "d"),
      card(4, "c"),
      card(3, "s"),
      card(2, "h"),
    ];
    const result = evaluate5CardHand(hand);
    expect(result.category).toBe(4);
    expect(result.tiebreak[0]).toBe(5);
  });

  it("detects three of a kind", () => {
    const hand = [
      card(8, "h"),
      card(8, "d"),
      card(8, "c"),
      card(13, "s"),
      card(2, "h"),
    ];
    expect(evaluate5CardHand(hand).category).toBe(3);
  });

  it("detects two pair", () => {
    const hand = [
      card(13, "h"),
      card(13, "d"),
      card(6, "c"),
      card(6, "s"),
      card(2, "h"),
    ];
    expect(evaluate5CardHand(hand).category).toBe(2);
  });

  it("detects pair", () => {
    const hand = [
      card(9, "h"),
      card(9, "d"),
      card(14, "c"),
      card(7, "s"),
      card(3, "h"),
    ];
    expect(evaluate5CardHand(hand).category).toBe(1);
  });

  it("detects high card", () => {
    const hand = [
      card(14, "h"),
      card(10, "d"),
      card(8, "c"),
      card(5, "s"),
      card(3, "h"),
    ];
    expect(evaluate5CardHand(hand).category).toBe(0);
  });
});

describe("compareHandRanks", () => {
  it("higher category wins", () => {
    expect(
      compareHandRanks(
        { category: 5, tiebreak: [14] },
        { category: 4, tiebreak: [14] },
      ),
    ).toBeGreaterThan(0);
  });

  it("same category uses tiebreak", () => {
    expect(
      compareHandRanks(
        { category: 1, tiebreak: [14, 13, 10, 5] },
        { category: 1, tiebreak: [14, 13, 9, 5] },
      ),
    ).toBeGreaterThan(0);
  });

  it("equal hands return 0", () => {
    expect(
      compareHandRanks(
        { category: 4, tiebreak: [10] },
        { category: 4, tiebreak: [10] },
      ),
    ).toBe(0);
  });
});

describe("cardsEqual", () => {
  it("returns true for same card", () => {
    expect(cardsEqual(card(14, "h"), card(14, "h"))).toBe(true);
  });

  it("returns false for different cards", () => {
    expect(cardsEqual(card(14, "h"), card(14, "d"))).toBe(false);
    expect(cardsEqual(card(14, "h"), card(13, "h"))).toBe(false);
  });
});

describe("findBest5CardHand", () => {
  it("finds the best 5-card hand from 7 cards", () => {
    const cards7 = [
      card(14, "h"),
      card(13, "h"), // hole cards
      card(12, "h"),
      card(11, "h"),
      card(10, "h"), // board makes royal flush
      card(2, "c"),
      card(3, "d"),
    ];
    const targetRank = evaluate5CardHand(cards7.slice(0, 5));
    const best5 = findBest5CardHand(cards7, targetRank);
    expect(best5).toHaveLength(5);
    expect(evaluate5CardHand(best5).category).toBe(9);
  });
});
