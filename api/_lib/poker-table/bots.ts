import { randomInt } from "node:crypto";
import type { Card } from "@common/interfaces";
import type { BotStyle, LegalActions } from "@common/interfaces/tableInterfaces";
import { gameDefinition, type GameMode } from "@common/pokerModes";
import { bestHighHand } from "@lib/poker/highHand";
import { sampleRunout } from "@lib/poker/runout";
import { potLayers } from "@lib/poker/pots";
import { compareRanks } from "@lib/poker/compare";
import { act, expireTurn, inHand, legalActions, type TableState } from "./engine";

// This is the full policy boundary: no deck, opponent cards, credentials, or
// event text. The policy never receives TableState or a human's private view.
export interface BotObservation {
  gameMode: GameMode;
  rulesVersion: number;
  roundId: number;
  dealtPlayerCount: number;
  burnCount: number;
  drawCapacity: number;
  seat: number;
  players: { seat: number; committed: number; eligible: boolean }[];
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
  return { gameMode: gameDefinition(t.settings.gameMode, t.rulesVersion).id, rulesVersion: t.rulesVersion,
    roundId: t.roundId, dealtPlayerCount: t.dealtPlayerCount, burnCount: t.burnCount,
    drawCapacity: 52 - 2 * t.dealtPlayerCount - t.board.length - t.burnCount, seat: bot.seat,
    players: t.seats.filter(s => s.status !== "waiting").map(s => ({ seat: s.seat, committed: s.committed, eligible: players.includes(s) })),
    cards: bot.cards.map(c => ({ ...c })), board: t.board.map(c => ({ ...c })),
    opponents: players.length - 1, pot: t.seats.reduce((sum, s) => sum + s.committed, 0),
    bigBlind: t.settings.bigBlind, currentBet: t.currentBet, bet: bot.bet, stack: bot.stack,
    position: order.findIndex(s => s === bot) / Math.max(1, order.length - 1),
    legal: { ...legalActions(t, bot.principal)! } };
}
export interface BotEstimate {
  equity: number;
  eligiblePot: number;
  samples: number;
  rankEvaluations: number;
  elapsedMs: number;
  reason?: "work-budget" | "estimator-error";
}
// Only complete trials count. Work caps apply to every mode and profile.
export function estimateBotEquity(view: BotObservation, rng: Random): BotEstimate {
  const started = Date.now();
  let share = 0; let samples = 0; let rankEvaluations = 0; let eligiblePot = 0;
  const result = (reason?: BotEstimate["reason"]): BotEstimate => ({ equity: samples ? share / samples : 0,
    eligiblePot, samples, rankEvaluations, elapsedMs: Math.max(0, Date.now() - started), ...(reason ? { reason } : {}) });
  try {
    const rules = gameDefinition(view.gameMode, view.rulesVersion);
    const opponents = view.players.filter(p => p.eligible && p.seat !== view.seat);
    if (opponents.length !== view.opponents) throw new Error("Invalid pot eligibility.");
    const pots = potLayers(view.players.map(p => ({ ...p,
      committed: p.committed + (p.seat === view.seat ? view.legal.call : 0),
    }))).filter(p => p.eligible.includes(view.seat));
    eligiblePot = pots.reduce((n, p) => n + p.amount, 0);
    if (eligiblePot <= 0) throw new Error("No eligible pot.");
    for (; samples < 96; samples++) {
      if (Date.now() - started >= 100 || rankEvaluations + opponents.length + 1 > 768) return result("work-budget");
      const trial = sampleRunout(view, rules, rng);
      const ranks = new Map([[view.seat, bestHighHand([...view.cards, ...trial.board]).rank]]); rankEvaluations++;
      for (let i = 0; i < opponents.length; i++) {
        ranks.set(opponents[i].seat, bestHighHand([...trial.hands[i], ...trial.board]).rank); rankEvaluations++;
      }
      let award = 0;
      for (const pot of pots) {
        let ties = 1; let beaten = false;
        for (const seat of pot.eligible) {
          if (seat === view.seat) continue;
          const comparison = compareRanks(ranks.get(view.seat)!, ranks.get(seat)!);
          if (comparison < 0) { beaten = true; break; }
          if (comparison === 0) ties++;
        }
        if (!beaten) award += pot.amount / ties;
      }
      share += award / eligiblePot;
    }
    return result();
  } catch { return result("estimator-error"); }
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
  const estimate = estimateBotEquity(view, rng);
  if (estimate.reason) {
    console.warn("CPU estimate fallback", { gameMode: view.gameMode, roundId: view.roundId,
      reason: estimate.reason, samples: estimate.samples, rankEvaluations: estimate.rankEvaluations, elapsedMs: estimate.elapsedMs });
    return { action: legal.check ? "check" : "fold" };
  }
  const equity = estimate.equity;
  const odds = legal.call / Math.max(1, estimate.eligiblePot);
  const fairShare = 1 / (view.opponents + 1);
  const weakStart = view.gameMode === "holdem" && view.board.length === 0 && startingHand(view.cards) < profile.entry + (1 - view.position) * 0.08 - (view.opponents === 1 ? 0.08 : 0);
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
