import { randomInt, randomUUID } from "node:crypto";
import type { Card, CardRank } from "@common/interfaces";
import { BOT_PROFILES } from "@common/pokerBots";
import type { BotStyle, LegalActions, PotAward, SeatStatus, TableCommand, TableEvent, TableSettings, TableStreet, TableView } from "@common/interfaces/tableInterfaces";
import { hand } from "@lib/poker/evaluate";
import { compareRanks } from "@lib/poker/compare";

export class TableError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export interface Seat {
  seat: number;
  principal: string;
  name: string;
  kind: "human" | "agent" | "cpu";
  botStyle?: BotStyle;
  stack: number;
  bet: number;
  committed: number;
  status: SeatStatus;
  ready: boolean;
  sittingOut: boolean;
  cards: Card[];
  lastAction: string;
  actedAtBet: number | null;
}
export interface AgentGrant {
  id: string;
  hash: string;
  name: string;
  seat: number;
  expiresAt: number;
  revoked: boolean;
}
export interface TableState {
  id: string;
  owner: string;
  members: string[];
  version: number;
  settings: TableSettings;
  street: TableStreet;
  handNumber: number;
  button: number;
  actor: number | null;
  deadline: number | null;
  botActionAt?: number | null;
  board: Card[];
  deck: Card[];
  currentBet: number;
  minRaise: number;
  seats: Seat[];
  awards: PotAward[];
  events: TableEvent[];
  eventId: number;
  agents: AgentGrant[];
  receipts: { key: string; digest: string }[];
  closed: boolean;
}
export const inHand = (t: TableState) => !["waiting", "complete"].includes(t.street);
const contenders = (t: TableState) => t.seats.filter(s => s.status === "active" || s.status === "all-in");
const active = (t: TableState) => t.seats.filter(s => s.status === "active");
export function record(t: TableState, text: string) {
  t.events.push({ id: ++t.eventId, hand: t.handNumber, text });
  t.events = t.events.slice(-80);
}
export function makeTable(id: string, owner: string, settings: TableSettings): TableState {
  return { id, owner, members: [owner], version: 0, settings, street: "waiting", handNumber: 0,
    button: -1, actor: null, deadline: null, botActionAt: null, board: [], deck: [], currentBet: 0,
    minRaise: settings.bigBlind, seats: [], awards: [], events: [], eventId: 0, agents: [], receipts: [], closed: false };
}
export function shuffledDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of ["s", "h", "d", "c"] as const) for (let rank = 2; rank <= 14; rank++) deck.push({ rank: rank as CardRank, suit });
  for (let i = deck.length - 1; i > 0; i--) { const j = randomInt(i + 1); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  return deck;
}
function next(t: TableState, after: number, candidates: Seat[]): Seat {
  const sorted = [...candidates].sort((a, b) => a.seat - b.seat);
  const result = sorted.find(s => s.seat > after) || sorted[0];
  if (!result) throw new TableError("No eligible player.");
  return result;
}
function setActor(t: TableState, seat: number, now: number) {
  t.actor = seat;
  t.botActionAt = t.seats.find(s => s.seat === seat)?.kind === "cpu" ? now + 1400 : null;
  t.deadline = now + t.settings.turnSeconds * 1000;
}
function putChips(s: Seat, amount: number) {
  s.stack -= amount; s.bet += amount; s.committed += amount;
  if (s.stack === 0) s.status = "all-in";
}
export function joinSeat(t: TableState, principal: string, name: string, kind: Seat["kind"] = "human") {
  if (t.closed) throw new TableError("This table is closed.", 409);
  if (t.seats.some(s => s.principal === principal)) return;
  const seat = Array.from({ length: t.settings.maxPlayers }, (_, i) => i).find(i => !t.seats.some(s => s.seat === i));
  if (seat === undefined) throw new TableError("This table is full.", 409);
  if (!t.members.includes(principal)) t.members.push(principal);
  t.seats.push({ seat, principal, name, kind, stack: t.settings.startingStack, bet: 0, committed: 0,
    status: "waiting", ready: false, sittingOut: false, cards: [], lastAction: "Joined", actedAtBet: null });
  t.seats.sort((a, b) => a.seat - b.seat);
  record(t, `${name} joined the table.`);
}
export function legalActions(t: TableState, principal: string): LegalActions | null {
  const s = t.seats.find(s => s.principal === principal);
  if (!s || !inHand(t) || t.actor !== s.seat || s.status !== "active") return null;
  const call = Math.min(s.stack, Math.max(0, t.currentBet - s.bet));
  const max = s.bet + s.stack;
  const reopened = s.actedAtBet === null || t.currentBet - s.actedAtBet >= t.minRaise;
  // A lone player with chips can only match an all-in; no uncallable extra bet.
  const canRaise = active(t).some(p => p.seat !== s.seat) && reopened && max > t.currentBet;
  return { fold: true, check: call === 0, call,
    minRaiseTo: canRaise ? Math.min(max, t.currentBet + t.minRaise) : null, maxRaiseTo: max };
}
function refundUncalled(t: TableState) {
  const sorted = [...t.seats].sort((a, b) => b.committed - a.committed);
  if (!sorted[0]) return;
  const excess = sorted[0].committed - (sorted[1]?.committed || 0);
  if (excess > 0) {
    const s = sorted[0]; s.stack += excess; s.committed -= excess; s.bet = Math.max(0, s.bet - excess);
    if (s.status === "all-in") s.status = "active";
    record(t, `${excess} uncalled chips returned to ${s.name}.`);
  }
}
const handNames = ["High card", "One pair", "Two pair", "Three of a kind", "Straight", "Flush", "Full house", "Four of a kind", "Straight flush", "Royal flush"];
function settle(t: TableState, showdown: boolean) {
  refundUncalled(t);
  const remaining = contenders(t);
  const levels = [...new Set(t.seats.map(s => s.committed).filter(Boolean))].sort((a, b) => a - b);
  let previous = 0;
  t.awards = [];
  const ranks = new Map(remaining.map(s => [s.seat, showdown ? hand.evaluate7([...s.cards, ...t.board]) : null]));
  for (const level of levels) {
    const contributors = t.seats.filter(s => s.committed >= level);
    const amount = (level - previous) * contributors.length;
    previous = level;
    const eligible = remaining.filter(s => s.committed >= level);
    if (!eligible.length) throw new TableError("Pot has no eligible player.", 500);
    let winners = [eligible[0]];
    for (const s of eligible.slice(1)) {
      const comparison = showdown ? compareRanks(ranks.get(s.seat)!, ranks.get(winners[0].seat)!) : 0;
      if (comparison > 0) winners = [s]; else if (comparison === 0) winners.push(s);
    }
    // Odd chips go clockwise from the dealer button.
    winners.sort((a, b) => ((a.seat - t.button - 1 + t.settings.maxPlayers) % t.settings.maxPlayers) - ((b.seat - t.button - 1 + t.settings.maxPlayers) % t.settings.maxPlayers));
    const award: PotAward = { amount, winners: winners.map((s, i) => {
      const chips = Math.floor(amount / winners.length) + (i < amount % winners.length ? 1 : 0);
      s.stack += chips;
      return { seat: s.seat, amount: chips, hand: showdown ? handNames[ranks.get(s.seat)!.category] || "Winning hand" : "Uncontested" };
    }) };
    t.awards.push(award);
  }
  for (const award of t.awards) for (const w of award.winners) record(t, `${t.seats.find(s => s.seat === w.seat)!.name} wins ${w.amount} chips (${w.hand}).`);
  t.street = "complete"; t.actor = null; t.deadline = null; t.botActionAt = null; t.deck = [];
  for (const s of t.seats) { s.ready = s.kind === "cpu"; s.bet = 0; if (!showdown || s.status === "folded") s.cards = []; }
  hand.clearCache();
}
function dealBoard(t: TableState) {
  t.deck.shift(); // Burn before each street.
  const count = t.street === "preflop" ? 3 : 1;
  t.board.push(...t.deck.splice(0, count));
  t.street = t.street === "preflop" ? "flop" : t.street === "flop" ? "turn" : "river";
  record(t, `${t.street[0].toUpperCase() + t.street.slice(1)} dealt.`);
  for (const s of t.seats) { s.bet = 0; s.actedAtBet = null; s.lastAction = s.status === "folded" ? "Fold" : s.status === "all-in" ? "All-in" : ""; }
  t.currentBet = 0; t.minRaise = t.settings.bigBlind;
}
function advance(t: TableState, after: number, now: number) {
  if (contenders(t).length === 1) { settle(t, false); return; }
  const players = active(t);
  if (players.length <= 1) t.currentBet = Math.max(...t.seats.map(s => s.bet));
  const needs = players.filter(s => s.bet < t.currentBet || (s.actedAtBet === null && players.length > 1));
  if (needs.length) { setActor(t, next(t, after, needs).seat, now); return; }
  refundUncalled(t);
  if (t.street === "river") { settle(t, true); return; }
  dealBoard(t);
  if (active(t).length <= 1) {
    while (t.board.length < 5) dealBoard(t);
    settle(t, true);
  } else setActor(t, next(t, t.button, active(t)).seat, now);
}
export function deal(t: TableState, now: number, deck = shuffledDeck()) {
  if (inHand(t)) throw new TableError("Finish this hand first.", 409);
  const ready = t.seats.filter(s => s.ready && !s.sittingOut && (s.stack > 0 || s.kind === "cpu"));
  if (ready.length < 2) throw new TableError("At least two players must be ready.", 409);
  if (deck.length !== 52 || new Set(deck.map(c => `${c.rank}${c.suit}`)).size !== 52) throw new TableError("Invalid deck.", 500);
  for (const s of ready) if (s.kind === "cpu" && s.stack === 0) {
    s.stack = t.settings.startingStack;
    record(t, `${s.name} refilled with ${s.stack} play chips.`);
  }
  t.deck = [...deck]; t.board = []; t.awards = []; t.handNumber++; t.street = "preflop";
  t.currentBet = t.settings.bigBlind; t.minRaise = t.settings.bigBlind;
  t.button = next(t, t.button, ready).seat;
  for (const s of t.seats) {
    s.bet = 0; s.committed = 0; s.cards = []; s.actedAtBet = null; s.lastAction = "";
    s.status = ready.includes(s) ? "active" : "waiting";
  }
  // Deal clockwise, one card at a time, starting left of the button.
  const order = [...ready].sort((a, b) => ((a.seat - t.button - 1 + t.settings.maxPlayers) % t.settings.maxPlayers) - ((b.seat - t.button - 1 + t.settings.maxPlayers) % t.settings.maxPlayers));
  for (let round = 0; round < 2; round++) for (const s of order) s.cards.push(t.deck.shift()!);
  const sb = ready.length === 2 ? ready.find(s => s.seat === t.button)! : next(t, t.button, ready);
  const bb = next(t, sb.seat, ready);
  putChips(sb, Math.min(sb.stack, t.settings.smallBlind)); sb.lastAction = "Small blind";
  putChips(bb, Math.min(bb.stack, t.settings.bigBlind)); bb.lastAction = "Big blind";
  record(t, `Hand ${t.handNumber}. ${sb.name} posts ${sb.bet}; ${bb.name} posts ${bb.bet}.`);
  advance(t, bb.seat, now);
}
export function act(t: TableState, principal: string, action: "fold" | "check" | "call" | "raise", raiseTo: number | undefined, now: number) {
  const legal = legalActions(t, principal);
  if (!legal) throw new TableError("It is not your turn.", 409);
  const s = t.seats.find(s => s.principal === principal)!;
  if (action === "fold") { s.status = "folded"; s.lastAction = "Fold"; }
  if (action === "check") {
    if (!legal.check) throw new TableError("You must call or fold.");
    s.lastAction = "Check";
  }
  if (action === "call") {
    if (!legal.call) throw new TableError("There is no bet to call.");
    putChips(s, legal.call); s.lastAction = `Call ${legal.call}${s.stack === 0 ? " · All-in" : ""}`;
  }
  if (action === "raise") {
    if (legal.minRaiseTo === null || !Number.isSafeInteger(raiseTo) || raiseTo! < legal.minRaiseTo || raiseTo! > legal.maxRaiseTo) throw new TableError("Choose a legal raise amount.");
    const increase = raiseTo! - t.currentBet;
    if (increase >= t.minRaise) t.minRaise = increase;
    putChips(s, raiseTo! - s.bet); t.currentBet = raiseTo!;
    s.lastAction = `${raiseTo === increase ? "Bet" : "Raise to"} ${raiseTo}${s.stack === 0 ? " · All-in" : ""}`;
  }
  s.actedAtBet = t.currentBet;
  record(t, `${s.name}: ${s.lastAction}.`);
  advance(t, s.seat, now);
}
export function expireTurn(t: TableState, now: number): boolean {
  if (!inHand(t) || t.deadline === null || now < t.deadline) return false;
  const s = t.seats.find(s => s.seat === t.actor)!;
  s.sittingOut = true; s.ready = false;
  record(t, `${s.name} timed out and will sit out.`);
  act(t, s.principal, legalActions(t, s.principal)!.check ? "check" : "fold", undefined, now);
  return true;
}
export function applyCommand(t: TableState, principal: string, command: TableCommand, now: number) {
  if (t.closed) throw new TableError("This table is closed.", 409);
  const s = t.seats.find(s => s.principal === principal);
  if (command.type === "add-bots" || command.type === "remove-bot") {
    if (principal !== t.owner) throw new TableError("Only the host can manage CPU players.", 403);
    if (inHand(t)) throw new TableError("Manage CPU players between hands.", 409);
    if (command.type === "remove-bot") {
      const bot = t.seats.find(p => p.seat === command.seat && p.kind === "cpu");
      if (!bot) throw new TableError("CPU player not found.", 404);
      applyCommand(t, bot.principal, { type: "leave" }, now);
      t.members = t.members.filter(member => member !== bot.principal);
    } else {
      if (!command.styles.length || command.styles.length > 8 || command.styles.some(style => !Object.prototype.hasOwnProperty.call(BOT_PROFILES, style))) throw new TableError("Choose one to eight CPU players.");
      if (t.seats.length + command.styles.length > t.settings.maxPlayers) throw new TableError("There are not enough open seats.", 409);
      for (const style of command.styles) {
        const base = BOT_PROFILES[style].name;
        let name = base; let suffix = 2;
        while (t.seats.some(p => p.name === name)) name = `${base} ${suffix++}`;
        const botId = `cpu:${randomUUID()}`;
        joinSeat(t, botId, name, "cpu");
        const bot = t.seats.find(p => p.principal === botId)!;
        bot.botStyle = style; bot.ready = true;
      }
    }
    return;
  }
  if (command.type === "join") { joinSeat(t, principal, command.name); return; }
  if (command.type === "close") {
    if (principal !== t.owner) throw new TableError("Only the host can close the table.", 403);
    if (inHand(t)) throw new TableError("Finish this hand before closing the table.", 409);
    t.closed = true; t.agents.forEach(a => a.revoked = true); return;
  }
  if (command.type === "deal") {
    if (principal !== t.owner && !s?.ready) throw new TableError("Take a seat and mark ready first.", 403);
    deal(t, now); return;
  }
  if (!s) throw new TableError("Take a seat first.", 403);
  if (command.type === "act") { act(t, principal, command.action, command.raiseTo, now); return; }
  if (inHand(t) && s.status !== "waiting") throw new TableError("Finish this hand first. If disconnected, your turn will time out.", 409);
  if (command.type === "ready") {
    if (command.ready && s.stack <= 0) throw new TableError("Add play chips before the next hand.");
    s.ready = command.ready; s.sittingOut = !command.ready;
  }
  if (command.type === "rebuy") {
    if (s.stack > 0) throw new TableError("You can refill when your stack is empty.");
    s.stack = t.settings.startingStack; record(t, `${s.name} refilled with ${s.stack} play chips.`);
  }
  if (command.type === "leave") {
    t.seats = t.seats.filter(p => p !== s); record(t, `${s.name} left the table.`);
    // Completed-hand awards reference seat numbers; clear them before a seat is reused.
    if (t.street === "complete") { t.street = "waiting"; t.awards = []; t.board = []; for (const p of t.seats) { p.cards = []; p.committed = 0; p.status = "waiting"; } }
  }
}
export function tableView(t: TableState, principal: string, now: number): TableView {
  const you = t.seats.find(s => s.principal === principal);
  const reveal = t.street === "complete";
  return { id: t.id, version: t.version, settings: t.settings, isOwner: t.owner === principal,
    yourSeat: you?.seat ?? null, street: t.street, handNumber: t.handNumber, button: t.button,
    actor: t.actor, deadline: t.deadline, serverTime: now, board: t.board, currentBet: t.currentBet,
    pot: t.seats.reduce((sum, s) => sum + s.committed, 0),
    seats: t.seats.map(s => ({ seat: s.seat, name: s.name, kind: s.kind, ...(s.botStyle ? { botStyle: s.botStyle } : {}), stack: s.stack, bet: s.bet,
      committed: s.committed, status: s.status, ready: s.ready, sittingOut: s.sittingOut,
      isYou: s.principal === principal, cards: s.principal === principal || (reveal && s.status !== "folded") ? s.cards : [],
      hasCards: s.cards.length > 0, lastAction: s.lastAction })),
    legal: legalActions(t, principal), awards: t.awards, events: t.events, closed: t.closed,
    canDeal: !t.closed && !inHand(t) && (principal === t.owner || !!you?.ready) && t.seats.filter(s => s.ready && !s.sittingOut && (s.stack > 0 || s.kind === "cpu")).length >= 2,
    agents: principal === t.owner ? t.agents.map(({ id, name, seat, expiresAt, revoked }) => ({ id, name, seat, expiresAt, revoked, seated: t.seats.some(s => s.principal === `agent:${id}`) })) : [] };
}
