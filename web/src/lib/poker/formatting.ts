import type { CardRank, HandRank } from "@common/interfaces";
import { RANKS } from "./constants";

export function cardToString(card: { rank: number; suit: string }): string {
  return `${card.rank}${card.suit}`;
}

export function holeToString(hole: {
  cards: [{ rank: number; suit: string }, { rank: number; suit: string }];
}): string {
  return `${cardToString(hole.cards[0])} ${cardToString(hole.cards[1])}`;
}

export function boardToString(board: {
  cards: Array<{ rank: number; suit: string }>;
}): string {
  return board.cards.map(cardToString).join(" ");
}

export function getRankLabel(rank: CardRank): string {
  const rankData = RANKS.find((r) => r.rank === rank);
  return rankData?.label || rank.toString();
}

export function formatHandRank(handRank: HandRank): string {
  const { category, tiebreak } = handRank;

  switch (category) {
    case 9:
      return "Royal flush";
    case 8: {
      if (tiebreak.length > 0) {
        return `${getRankLabel(tiebreak[0])} high straight flush`;
      }
      return "Straight flush";
    }
    case 7: {
      if (tiebreak.length > 0) {
        return `Four of a kind (${getRankLabel(tiebreak[0])}s)`;
      }
      return "Four of a kind";
    }
    case 6: {
      if (tiebreak.length >= 2) {
        return `Full house (${getRankLabel(tiebreak[0])}s over ${getRankLabel(tiebreak[1])}s)`;
      }
      return "Full house";
    }
    case 5: {
      if (tiebreak.length > 0) {
        return `${getRankLabel(tiebreak[0])} high flush`;
      }
      return "Flush";
    }
    case 4: {
      if (tiebreak.length > 0) {
        return `${getRankLabel(tiebreak[0])} high straight`;
      }
      return "Straight";
    }
    case 3: {
      if (tiebreak.length > 0) {
        return `Three of a kind (${getRankLabel(tiebreak[0])}s)`;
      }
      return "Three of a kind";
    }
    case 2: {
      if (tiebreak.length >= 2) {
        return `Two pair (${getRankLabel(tiebreak[0])}s and ${getRankLabel(tiebreak[1])}s)`;
      }
      return "Two pair";
    }
    case 1: {
      if (tiebreak.length > 0) {
        return `Pair of ${getRankLabel(tiebreak[0])}s`;
      }
      return "Pair";
    }
    case 0: {
      if (tiebreak.length > 0) {
        return `${getRankLabel(tiebreak[0])} high`;
      }
      return "High card";
    }
    default:
      return "Unknown hand";
  }
}
