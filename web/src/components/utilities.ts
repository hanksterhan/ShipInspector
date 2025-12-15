import { TemplateResult } from "lit";
import { CardRank, CardSuit } from "@common/interfaces";
import { clubsIcon, diamondsIcon, heartsIcon, spadesIcon } from "../assets";

/**
 * Suit data with icons and colors for display
 */
export interface SuitData {
    suit: CardSuit;
    icon: TemplateResult;
    label: string;
    color: string;
}

/**
 * All card suits with their display icons, labels, and colors
 */
export const SUITS: SuitData[] = [
    { suit: "c", icon: clubsIcon, label: "Clubs", color: "#000000" },
    { suit: "d", icon: diamondsIcon, label: "Diamonds", color: "#E60000" },
    { suit: "h", icon: heartsIcon, label: "Hearts", color: "#E60000" },
    { suit: "s", icon: spadesIcon, label: "Spades", color: "#000000" },
];

/**
 * Rank data with labels for display
 */
export interface RankData {
    rank: CardRank;
    label: string;
}

/**
 * All card ranks with their display labels
 */
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
