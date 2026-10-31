import type { TableHandRecord } from "./tableHandInterfaces";
import type { GameMode, TerminalReason } from "../pokerModes";
import type { Card } from "./handInterfaces";

export type TableStreet = "waiting" | "preflop" | "flop" | "turn" | "river" | "complete";
export type BotStyle = "aggressive" | "passive" | "balanced" | "random";
export type SeatStatus = "waiting" | "active" | "folded" | "all-in";
export interface TableSettings {
  gameMode?: GameMode;
  /** Ghost modifier: a hidden two-card hand that contests showdown pots. Fixed at creation. */
  ghost?: boolean;
  name: string;
  maxPlayers: number;
  smallBlind: number;
  bigBlind: number;
  startingStack: number;
  turnSeconds: number;
}
export interface TableSeatView {
  seat: number;
  name: string;
  kind: "human" | "agent" | "cpu";
  botStyle?: BotStyle;
  stack: number;
  bet: number;
  committed: number;
  status: SeatStatus;
  ready: boolean;
  sittingOut: boolean;
  isYou: boolean;
  cards: Card[];
  hasCards: boolean;
  lastAction: string;
}
export interface LegalActions {
  fold: boolean;
  check: boolean;
  call: number;
  minRaiseTo: number | null;
  maxRaiseTo: number;
}
export interface TableEvent {
  id: number;
  hand: number;
  text: string;
}
export interface PotAward {
  amount: number;
  winners: { seat: number; amount: number; hand: string }[];
  /** The ghost's share of this pot. It carries to the next hand's main pot. */
  ghost?: { amount: number; hand: string };
}
export interface GhostView {
  /** Chips the ghost won, waiting for the next hand's main pot. */
  carry: number;
  /** Carryover in this hand's main pot. It is not part of any player's contribution. */
  deadMoney: number;
  hasCards: boolean;
  /** Empty until a showdown. */
  cards: Card[];
}
export interface TableView {
  handRecord?: TableHandRecord | null;
  rulesVersion?: number;
  roundId?: number;
  riverNumber?: number;
  terminalReason?: TerminalReason | null;
  dealtPlayerCount?: number;
  burnCount?: number;
  drawCapacity?: number;
  id: string;
  version: number;
  settings: TableSettings;
  isOwner: boolean;
  yourSeat: number | null;
  street: TableStreet;
  handNumber: number;
  button: number;
  smallBlindSeat: number | null;
  bigBlindSeat: number | null;
  actor: number | null;
  deadline: number | null;
  serverTime: number;
  board: Card[];
  pot: number;
  currentBet: number;
  seats: TableSeatView[];
  legal: LegalActions | null;
  awards: PotAward[];
  ghost?: GhostView;
  events: TableEvent[];
  canDeal: boolean;
  closed: boolean;
  agents: { id: string; name: string; seat: number; expiresAt: number; revoked: boolean; seated: boolean }[];
}
export interface TableSummary {
  gameMode?: GameMode;
  ghost?: boolean;
  id: string;
  name: string;
  seats: number;
  maxPlayers: number;
  smallBlind: number;
  bigBlind: number;
  street: TableStreet;
}
export type TableCommand =
  | { type: "join"; name: string }
  | { type: "ready"; ready: boolean }
  | { type: "deal" }
  | { type: "act"; action: "fold" | "check" | "call" | "raise"; raiseTo?: number }
  | { type: "leave" }
  | { type: "rebuy" }
  | { type: "close" }
  | { type: "add-bots"; styles: BotStyle[] }
  | { type: "remove-bot"; seat: number };
export interface TableCommandRequest {
  version: number;
  requestId: string;
  command: TableCommand;
}
