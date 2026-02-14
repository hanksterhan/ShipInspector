import type { ComponentType, SVGProps } from "react";
import type { CardRank, CardSuit } from "@common/interfaces";
import {
  ClubsIcon,
  DiamondsIcon,
  HeartsIcon,
  SpadesIcon,
} from "@/assets/icons";

export interface SuitData {
  suit: CardSuit;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  color: string;
  isDark: boolean;
}

export interface RankData {
  rank: CardRank;
  label: string;
}

// Standard 2-color palette (WCAG AA compliant against dark backgrounds)
// Black suits use slate-400 (#94a3b8) for ~6.8:1 contrast on dark bg
export const SUITS: SuitData[] = [
  {
    suit: "c",
    Icon: ClubsIcon,
    label: "Clubs",
    color: "#94a3b8",
    isDark: false,
  },
  {
    suit: "d",
    Icon: DiamondsIcon,
    label: "Diamonds",
    color: "#f87171",
    isDark: false,
  },
  {
    suit: "h",
    Icon: HeartsIcon,
    label: "Hearts",
    color: "#fb7185",
    isDark: false,
  },
  {
    suit: "s",
    Icon: SpadesIcon,
    label: "Spades",
    color: "#94a3b8",
    isDark: false,
  },
];

// 4-color deck overrides (diamonds = blue, clubs = green)
const FOUR_COLOR_OVERRIDES: Partial<
  Record<CardSuit, { color: string; isDark: boolean }>
> = {
  d: { color: "#60a5fa", isDark: false },
  c: { color: "#22c55e", isDark: false },
};

export const RANKS: RankData[] = [
  { rank: 2, label: "2" },
  { rank: 3, label: "3" },
  { rank: 4, label: "4" },
  { rank: 5, label: "5" },
  { rank: 6, label: "6" },
  { rank: 7, label: "7" },
  { rank: 8, label: "8" },
  { rank: 9, label: "9" },
  { rank: 10, label: "10" },
  { rank: 11, label: "J" },
  { rank: 12, label: "Q" },
  { rank: 13, label: "K" },
  { rank: 14, label: "A" },
];

export const SUIT_MAP: Record<CardSuit, SuitData> = Object.fromEntries(
  SUITS.map((s) => [s.suit, s]),
) as Record<CardSuit, SuitData>;

/** Get suit data respecting the 4-color deck setting. */
export function getSuitData(
  suit: CardSuit,
  fourColorDeck: boolean,
): SuitData {
  const base = SUIT_MAP[suit];
  if (!fourColorDeck) return base;
  const override = FOUR_COLOR_OVERRIDES[suit];
  if (!override) return base;
  return { ...base, ...override };
}

export const ALL_SUITS: CardSuit[] = ["c", "d", "h", "s"];
export const ALL_RANKS: CardRank[] = [
  2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
];
