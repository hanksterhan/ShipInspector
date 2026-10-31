import type { Card } from "./handInterfaces";
import type { GameMode, TerminalReason } from "../pokerModes";
import type { PotAward, TableSettings, TableStreet } from "./tableInterfaces";

export type HandEventBody =
  | { type: "start" }
  /** Ghost carryover from the previous hand, added to this main pot. */
  | { type: "dead-money"; amount: number }
  | { type: "blind"; seat: number; blind: "small" | "big"; amount: number }
  | { type: "deal"; cards: Card[]; riverNumber: number }
  | { type: "action"; seat: number; action: "fold" | "check" | "call" | "raise"; amount: number; raiseTo?: number }
  | { type: "refund"; seat: number; amount: number }
  /** Showdown only: the ghost hand. A fold-out never records it. */
  | { type: "ghost"; cards: Card[] }
  | { type: "award"; award: PotAward }
  | { type: "end"; reason: TerminalReason; revealedSeats: number[]; ghostCarry?: number };
export type HandEvent = HandEventBody & { sequence: number; roundId: number; street: TableStreet };
export interface HandPlayer {
  seat: number;
  name: string;
  kind: "human" | "agent" | "cpu";
  startingStack: number;
  cards: Card[];
  isYou: boolean;
}
export interface TableHandRecord {
  formatVersion: 1;
  handNumber: number;
  gameMode: GameMode;
  rulesVersion: number;
  settings: TableSettings;
  button: number;
  smallBlindSeat: number | null;
  bigBlindSeat: number | null;
  players: HandPlayer[];
  events: HandEvent[];
}
