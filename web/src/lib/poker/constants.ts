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

export const SUITS: SuitData[] = [
  { suit: "c", Icon: ClubsIcon, label: "Clubs", color: "#4b5563", isDark: true },
  {
    suit: "d",
    Icon: DiamondsIcon,
    label: "Diamonds",
    color: "#ef4444",
    isDark: false,
  },
  {
    suit: "h",
    Icon: HeartsIcon,
    label: "Hearts",
    color: "#ef4444",
    isDark: false,
  },
  { suit: "s", Icon: SpadesIcon, label: "Spades", color: "#4b5563", isDark: true },
];

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

export const ALL_SUITS: CardSuit[] = ["c", "d", "h", "s"];
export const ALL_RANKS: CardRank[] = [
  2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
];
