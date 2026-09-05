import { randomInt } from "node:crypto";
import type { Card, CardRank } from "@common/interfaces";
import type { BotStyle, LegalActions } from "@common/interfaces/tableInterfaces";
import { hand } from "@lib/poker/evaluate";
import { compareRanks } from "@lib/poker/compare";
import { act, expireTurn, inHand, legalActions, type TableState } from "./engine";

// This is the full policy boundary: no deck, opponent cards, credentials, or
// event text. The policy never receives TableState or a human's private view.
export interface BotObservation {
  cards: Card[];
  board: Card[];
  opponents: number;
  pot: number;
  bigBlind: number;
  currentBet: number;
  bet: number;
  stack: number;
  position: number;
  legal: LegalActions;
}
type Random = () => number;
export type BotAction = { action: "check" | "call" | "fold" | "raise"; raiseTo?: number };
const random: Random = () => randomInt(0x1000000) / 0x1000000;
const styles = {
  aggressive: { aggression: 0.76, bluff: 0.13, loose: 0.07, entry: 0.25, sizing: 0.85 },
  passive: { aggression: 0.07, bluff: 0.01, loose: 0.10, entry: 0.20, sizing: 0.45 },
  balanced: { aggression: 0.48, bluff: 0.045, loose: 0, entry: 0.40, sizing: 0.60 },
};
export function botObservation(t: TableState): BotObservation {
  const bot = t.seats.find(s => s.seat === t.actor && s.kind === "cpu");
  if (!bot) throw new Error("A CPU must have the turn.");
  const players = t.seats.filter(s => s.status === "active" || s.status === "all-in");
  const order = [...players].sort((a, b) => ((a.seat - t.button - 1 + t.settings.maxPlayers) % t.settings.maxPlayers) - ((b.seat - t.button - 1 + t.settings.maxPlayers) % t.settings.maxPlayers));
  return { cards: bot.cards.map(c => ({ ...c })), board: t.board.map(c => ({ ...c })),
    opponents: players.length - 1, pot: t.seats.reduce((sum, s) => sum + s.committed, 0),
    bigBlind: t.settings.bigBlind, currentBet: t.currentBet, bet: bot.bet, stack: bot.stack,
    position: order.findIndex(s => s === bot) / Math.max(1, order.length - 1),
    legal: { ...legalActions(t, bot.principal)! } };
}
// Bounded sampling against unknown hands. This estimates pot share, not an
// optimal strategy or opponent range. Folded cards remain unknown as in real play.
export function estimateBotEquity(view: BotObservation, rng: Random): number {
  const known = new Set([...view.cards, ...view.board].map(c => `${c.rank}${c.suit}`));
  const unseen: Card[] = [];
  for (const suit of ["s", "h", "d", "c"] as const) for (let rank = 2; rank <= 14; rank++) {
    if (!known.has(`${rank}${suit}`)) unseen.push({ rank: rank as CardRank, suit });
  }
  const samples = 96;
  const count = 5 - view.board.length + view.opponents * 2;
  let share = 0;
  try {
    for (let sample = 0; sample < samples; sample++) {
      const deck = [...unseen];
      for (let i = 0; i < count; i++) {
        const index = i + Math.floor(rng() * (deck.length - i));
        [deck[i], deck[index]] = [deck[index], deck[i]];
      }
      const missing = 5 - view.board.length;
      const board = [...view.board, ...deck.slice(0, missing)];
      const hero = hand.evaluate7([...view.cards, ...board]);
      let ties = 1; let beaten = false;
      for (let i = 0; i < view.opponents; i++) {
        const start = missing + i * 2;
        const comparison = compareRanks(hero, hand.evaluate7([...deck.slice(start, start + 2), ...board]));
        if (comparison < 0) { beaten = true; break; }
        if (comparison === 0) ties++;
      }
      if (!beaten) share += 1 / ties;
    }
  } finally { hand.clearCache(); }
  return share / samples;
}
function startingHand(cards: Card[]): number {
  const [high, low] = cards.map(c => c.rank).sort((a, b) => b - a);
  if (high === low) return 0.55 + high / 14 * 0.4;
  return high / 14 * 0.35 + low / 14 * 0.25 + (cards[0].suit === cards[1].suit ? 0.10 : 0) + (high - low <= 2 ? 0.08 : 0) - (high - low >= 5 ? 0.12 : 0);
}
export function chooseBotAction(view: BotObservation, style: BotStyle, rng: Random = random): BotAction {
  const legal = view.legal;
  const passive: BotAction = { action: legal.check ? "check" : "call" };
  const raise = (size: number): BotAction => ({ action: "raise", raiseTo: Math.max(legal.minRaiseTo!, Math.min(legal.maxRaiseTo, Math.round(size))) });
  if (style === "random") {
    const choices: BotAction[] = [passive];
    if (!legal.check) choices.push({ action: "fold" });
    if (legal.minRaiseTo !== null) {
      const sizes = [legal.minRaiseTo, view.currentBet + (view.pot + legal.call) / 2, view.currentBet + view.pot + legal.call, legal.maxRaiseTo];
      choices.push(raise(sizes[Math.floor(rng() * sizes.length)]));
    }
    return choices[Math.floor(rng() * choices.length)];
  }
  const profile = styles[style];
  const equity = estimateBotEquity(view, rng);
  const odds = legal.call / Math.max(1, view.pot + legal.call);
  const fairShare = 1 / (view.opponents + 1);
  const weakStart = view.board.length === 0 && startingHand(view.cards) < profile.entry + (1 - view.position) * 0.08 - (view.opponents === 1 ? 0.08 : 0);
  if (!legal.check && (equity + profile.loose < odds + 0.025 || (weakStart && legal.call >= view.bigBlind))) return { action: "fold" };
  const value = equity > Math.max(fairShare + 0.12, odds + 0.15);
  const bluff = legal.call <= view.stack * 0.12 && rng() < profile.bluff / Math.max(1, view.opponents);
  if (legal.minRaiseTo !== null && ((value && rng() < profile.aggression) || bluff)) {
    const size = view.board.length === 0 && view.currentBet <= view.bigBlind
      ? view.bigBlind * (2.5 + rng())
      : view.currentBet + (view.pot + legal.call) * profile.sizing * (0.85 + rng() * 0.3);
    return raise(size);
  }
  return passive;
}
// One persisted action per request. A due time survives cold starts and polling
// races; TableService saves it with the same CAS used for every human action.
export function progressTable(t: TableState, now: number): boolean {
  if (t.closed || !inHand(t)) return false;
  const actor = t.seats.find(s => s.seat === t.actor);
  if (actor?.kind !== "cpu") return expireTurn(t, now);
  if (t.botActionAt == null) { t.botActionAt = now + 1400; return true; }
  if (now < t.botActionAt) return false;
  const choice = chooseBotAction(botObservation(t), actor.botStyle || "balanced");
  act(t, actor.principal, choice.action, choice.raiseTo, now);
  return true;
}
