import type { Card, CardRank, HandRank } from "@common/interfaces";

function isStraight(ranks: CardRank[]): boolean {
  // Check for A-2-3-4-5 (wheel)
  if (
    ranks[0] === 14 &&
    ranks[1] === 5 &&
    ranks[2] === 4 &&
    ranks[3] === 3 &&
    ranks[4] === 2
  ) {
    return true;
  }
  for (let i = 0; i < ranks.length - 1; i++) {
    if (ranks[i] - ranks[i + 1] !== 1) {
      return false;
    }
  }
  return true;
}

function getStraightHigh(ranks: CardRank[]): CardRank {
  if (
    ranks[0] === 14 &&
    ranks[1] === 5 &&
    ranks[2] === 4 &&
    ranks[3] === 3 &&
    ranks[4] === 2
  ) {
    return 5;
  }
  return ranks[0];
}

export function evaluate5CardHand(cards5: Card[]): HandRank {
  const ranks = cards5.map((c) => c.rank).sort((a, b) => b - a) as CardRank[];
  const suits = cards5.map((c) => c.suit);

  const rankCounts = new Map<CardRank, number>();
  ranks.forEach((rank) => {
    rankCounts.set(rank, (rankCounts.get(rank) || 0) + 1);
  });

  const counts = Array.from(rankCounts.values()).sort((a, b) => b - a);
  const isFlush = suits.every((suit) => suit === suits[0]);
  const isStraightHand = isStraight(ranks);

  if (isFlush && isStraightHand && ranks[0] === 14 && ranks[4] === 10) {
    return { category: 9, tiebreak: [] };
  }
  if (isFlush && isStraightHand) {
    return { category: 8, tiebreak: [getStraightHigh(ranks)] };
  }
  if (counts[0] === 4) {
    const fourOfAKind = Array.from(rankCounts.entries()).find(
      ([, count]) => count === 4,
    )![0];
    const kicker = Array.from(rankCounts.entries()).find(
      ([, count]) => count === 1,
    )![0];
    return { category: 7, tiebreak: [fourOfAKind, kicker] };
  }
  if (counts[0] === 3 && counts[1] === 2) {
    const threeOfAKind = Array.from(rankCounts.entries()).find(
      ([, count]) => count === 3,
    )![0];
    const pair = Array.from(rankCounts.entries()).find(
      ([, count]) => count === 2,
    )![0];
    return { category: 6, tiebreak: [threeOfAKind, pair] };
  }
  if (isFlush) {
    return { category: 5, tiebreak: ranks };
  }
  if (isStraightHand) {
    return { category: 4, tiebreak: [getStraightHigh(ranks)] };
  }
  if (counts[0] === 3) {
    const threeOfAKind = Array.from(rankCounts.entries()).find(
      ([, count]) => count === 3,
    )![0];
    const kickers = Array.from(rankCounts.entries())
      .filter(([, count]) => count === 1)
      .map(([rank]) => rank)
      .sort((a, b) => b - a);
    return { category: 3, tiebreak: [threeOfAKind, ...kickers] };
  }
  if (counts[0] === 2 && counts[1] === 2) {
    const pairs = Array.from(rankCounts.entries())
      .filter(([, count]) => count === 2)
      .map(([rank]) => rank)
      .sort((a, b) => b - a);
    const kicker = Array.from(rankCounts.entries()).find(
      ([, count]) => count === 1,
    )![0];
    return { category: 2, tiebreak: [...pairs, kicker] };
  }
  if (counts[0] === 2) {
    const pair = Array.from(rankCounts.entries()).find(
      ([, count]) => count === 2,
    )![0];
    const kickers = Array.from(rankCounts.entries())
      .filter(([, count]) => count === 1)
      .map(([rank]) => rank)
      .sort((a, b) => b - a);
    return { category: 1, tiebreak: [pair, ...kickers] };
  }
  return { category: 0, tiebreak: ranks };
}

export function compareHandRanks(rank1: HandRank, rank2: HandRank): number {
  if (rank1.category !== rank2.category) {
    return rank1.category - rank2.category;
  }
  for (
    let i = 0;
    i < Math.max(rank1.tiebreak.length, rank2.tiebreak.length);
    i++
  ) {
    const val1 = rank1.tiebreak[i] || 0;
    const val2 = rank2.tiebreak[i] || 0;
    if (val1 !== val2) {
      return val1 - val2;
    }
  }
  return 0;
}

export function cardsEqual(card1: Card, card2: Card): boolean {
  return card1.rank === card2.rank && card1.suit === card2.suit;
}

/**
 * Find the best 5-card hand from 7 cards that matches the given hand rank.
 * When multiple combinations have the same rank, prefers hole cards (indices 0 and 1).
 */
export function findBest5CardHand(cards7: Card[], targetRank: HandRank): Card[] {
  let bestHand: Card[] | null = null;
  let bestRank: HandRank | null = null;
  let bestHoleCardCount = -1;

  for (let i = 0; i < 7; i++) {
    for (let j = i + 1; j < 7; j++) {
      const cards5: Card[] = [];
      const excludedIndices = new Set([i, j]);
      for (let k = 0; k < 7; k++) {
        if (!excludedIndices.has(k)) {
          cards5.push(cards7[k]);
        }
      }

      const handRank = evaluate5CardHand(cards5);
      const excludedHoleCards = (i < 2 ? 1 : 0) + (j < 2 ? 1 : 0);
      const holeCardsInHand = 2 - excludedHoleCards;

      const comparison =
        bestRank === null ? 1 : compareHandRanks(handRank, bestRank);

      if (comparison > 0) {
        bestRank = handRank;
        bestHand = cards5;
        bestHoleCardCount = holeCardsInHand;
      } else if (comparison === 0 && holeCardsInHand > bestHoleCardCount) {
        bestRank = handRank;
        bestHand = cards5;
        bestHoleCardCount = holeCardsInHand;
      }
    }
  }

  if (
    bestRank &&
    compareHandRanks(bestRank, targetRank) === 0 &&
    bestHand
  ) {
    return bestHand;
  }
  return bestHand || [];
}
