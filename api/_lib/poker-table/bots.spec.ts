import { parseCard } from "@common/interfaces";
import { BOT_STYLES } from "@common/pokerBots";
import { act, applyCommand, deal, joinSeat, legalActions, makeTable, tableView } from "./engine";
import { gameDefinition, type GameMode } from "@common/pokerModes";
import { sampleRunout } from "@lib/poker/runout";
import { eightSeatExhaustionDeck } from "./__tests__/fixtures";
import { estimateBotEquity, botObservation, chooseBotAction, progressTable, type BotObservation } from "./bots";
const settings = { name: "CPU practice", maxPlayers: 8, smallBlind: 5, bigBlind: 10, startingStack: 1000, turnSeconds: 30 };
const seeded = (seed: number) => () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
function game(bots = 1, gameMode: GameMode = "holdem") {
  const t = makeTable("cpu-test", "owner", { ...settings, gameMode }); joinSeat(t, "owner", "Player");
  applyCommand(t, "owner", { type: "add-bots", styles: Array.from({ length: bots }, (_, i) => BOT_STYLES[i % 4]) }, 0);
  applyCommand(t, "owner", { type: "ready", ready: true }, 0); return t;
}
function observation(): BotObservation {
  return { gameMode: "holdem", rulesVersion: 1, roundId: 1, dealtPlayerCount: 2, burnCount: 0, drawCapacity: 48, seat: 0,
    players: [{ seat: 0, committed: 10, eligible: true }, { seat: 1, committed: 20, eligible: true }], cards: [parseCard("14s"), parseCard("14h")], board: [], opponents: 1, pot: 30, bigBlind: 10, currentBet: 10, bet: 0, stack: 1000, position: 0.5,
    legal: { fold: true, check: false, call: 10, minRaiseTo: 20, maxRaiseTo: 1000 } };
}
describe("CPU policy and lifecycle", () => {
  it("adds ready profiles and permits only host changes between hands", () => {
    const t = game(3);
    expect(t.seats.slice(1).map(s => [s.name, s.kind, s.ready])).toEqual([["Rico", "cpu", true], ["Marina", "cpu", true], ["Vega", "cpu", true]]);
    expect(() => applyCommand(t, "guest", { type: "add-bots", styles: ["random"] }, 0)).toThrow("host");
    expect(() => applyCommand(t, "guest", { type: "remove-bot", seat: 1 }, 0)).toThrow("host");
    expect(() => applyCommand(t, "owner", { type: "remove-bot", seat: 0 }, 0)).toThrow("CPU player not found");
    expect(() => applyCommand(t, "owner", { type: "add-bots", styles: Array(7).fill("random") }, 0)).toThrow("open seats");
    expect(t.seats).toHaveLength(4); deal(t, 0);
    expect(() => applyCommand(t, "owner", { type: "remove-bot", seat: 1 }, 1)).toThrow("between hands");
  });
  it.each(["holdem", "red-river-holdem"] as const)("%s ignores real hidden cards and deck order in seeded decisions", gameMode => {
    const t = game(1, gameMode); deal(t, 0); act(t, "owner", "call", undefined, 1);
    const before = botObservation(t);
    expect(before).toMatchObject({ gameMode, rulesVersion: 1, dealtPlayerCount: 2, burnCount: 0, drawCapacity: 48 });
    expect(JSON.stringify(before)).not.toMatch(/principal|credential|hash|events|"deck"/);
    t.seats[0].cards = [parseCard("2c"), parseCard("3c")]; t.deck.reverse();
    expect(botObservation(t)).toEqual(before);
    expect(chooseBotAction(before, "balanced", seeded(7))).toEqual(chooseBotAction(botObservation(t), "balanced", seeded(7)));
    expect(tableView(t, "owner", 1).seats[1].cards).toEqual([]);
  });
  it("paces CPU turns and does not skip a human decision", () => {
    const t = game(); deal(t, 100); expect(progressTable(t, 1000)).toBe(false);
    act(t, "owner", "call", undefined, 1000);
    expect(progressTable(t, 2399)).toBe(false); expect(progressTable(t, 2400)).toBe(true);
    expect(t.events.some(e => e.text.startsWith("Rico: "))).toBe(true);
    const version = t.eventId; expect(progressTable(t, 2400)).toBe(false); expect(t.eventId).toBe(version);
  });
  it("produces distinct aggression and passive calling frequencies, with varied random actions", () => {
    const choices = Object.fromEntries(BOT_STYLES.map(style => [style, Array.from({ length: 60 }, (_, i) => chooseBotAction(observation(), style, seeded(i + 1)).action)]));
    expect(choices.aggressive.filter(a => a === "raise").length).toBeGreaterThan(choices.passive.filter(a => a === "raise").length + 15);
    expect(choices.passive.filter(a => a === "call").length).toBeGreaterThan(35);
    expect(new Set(choices.random).size).toBe(3);
  });
  it("respects locked betting, free checks, and short all-in limits", () => {
    for (const style of BOT_STYLES) for (const legal of [
      { fold: true, check: true, call: 0, minRaiseTo: null, maxRaiseTo: 10 },
      { fold: true, check: false, call: 8, minRaiseTo: null, maxRaiseTo: 8 },
      { fold: true, check: false, call: 10, minRaiseTo: 15, maxRaiseTo: 15 },
    ]) for (let seed = 0; seed < 5; seed++) {
      const choice = chooseBotAction({ ...observation(), legal }, style, seeded(seed));
      if (choice.action === "raise") { expect(legal.minRaiseTo).not.toBeNull(); expect(choice.raiseTo).toBeGreaterThanOrEqual(legal.minRaiseTo!); expect(choice.raiseTo).toBeLessThanOrEqual(legal.maxRaiseTo); }
      if (choice.action === "check") expect(legal.check).toBe(true);
      if (choice.action === "call") expect(legal.call).toBeGreaterThan(0);
    }
  });
  it("completes one human versus one through seven CPUs with no lost or created chips", () => {
    for (let count = 1; count <= 7; count++) {
      const t = game(count); deal(t, 0); let turns = 0;
      while (t.street !== "complete" && turns++ < 120) {
        const actor = t.seats.find(s => s.seat === t.actor)!; const now = turns * 2000;
        if (actor.kind === "cpu") expect(progressTable(t, now)).toBe(true);
        else { const legal = legalActions(t, "owner")!; act(t, "owner", legal.check ? "check" : "call", undefined, now); }
        expect(t.seats.reduce((sum, s) => sum + s.stack + (t.street === "complete" ? 0 : s.committed), 0)).toBe(1000 * (count + 1));
      }
      expect(t.street).toBe("complete"); expect(t.seats.filter(s => s.kind === "cpu").every(s => s.ready)).toBe(true); expect(t.seats[0].ready).toBe(false);
    }
  }, 30000);
  it("refills empty CPUs on the next deal and removes them only after the hand", () => {
    const t = game(); t.seats[1].stack = 0; deal(t, 0);
    expect(t.events.some(e => e.text.includes("refilled"))).toBe(true);
    act(t, "owner", "fold", undefined, 1); applyCommand(t, "owner", { type: "remove-bot", seat: 1 }, 2);
    expect(t.seats).toHaveLength(1); expect(t.awards).toEqual([]); expect(t.members).toEqual(["owner"]);
  });
  it("fills all eight open seats when the host chooses to watch, without exposing CPU cards", () => {
    const t = makeTable("cpu-spectator", "owner", settings);
    applyCommand(t, "owner", { type: "add-bots", styles: Array.from({ length: 8 }, (_, i) => BOT_STYLES[i % 4]) }, 0);
    expect(t.seats).toHaveLength(8); expect(tableView(t, "owner", 0).canDeal).toBe(true);
    deal(t, 0);
    const view = tableView(t, "owner", 0);
    expect(view.yourSeat).toBeNull(); expect(view.seats.every(s => s.cards.length === 0)).toBe(true);
    let turns = 0;
    while (t.street !== "complete" && turns++ < 120) expect(progressTable(t, turns * 2000)).toBe(true);
    expect(t.street).toBe("complete"); expect(t.seats.reduce((sum, s) => sum + s.stack, 0)).toBe(8000);
  });

  it("samples dealt and burned slots, appends a black river, and excludes late seats from capacity", () => {
    const view = { ...observation(), gameMode: "red-river-holdem" as const, board: "2h 3d 4c 9s 11h".split(" ").map(parseCard), burnCount: 3, drawCapacity: 40 };
    const trial = sampleRunout(view, gameDefinition(view.gameMode), () => 0);
    expect(trial.hands[0]).toEqual([parseCard("2c"), parseCard("3c")]);
    expect(trial.board).toEqual([...view.board, parseCard("9c")]);
    expect(trial.remainingCards).toBe(38);
    const t = game(2, "red-river-holdem"); deal(t, 0); act(t, "owner", "fold", undefined, 1);
    joinSeat(t, "late", "Late arrival");
    const publicView = botObservation(t);
    expect(publicView).toMatchObject({ dealtPlayerCount: 3, drawCapacity: 46, opponents: 1 });
    expect(publicView.players.map(p => p.eligible)).toEqual([false, true, true]);
    const exhausted = game(7, "red-river-holdem"); deal(exhausted, 0, eightSeatExhaustionDeck());
    let steps = 0;
    while (exhausted.board.length < 19 && steps++ < 160) {
      const actor = exhausted.seats.find(s => s.seat === exhausted.actor)!;
      act(exhausted, actor.principal, legalActions(exhausted, actor.principal)!.check ? "check" : "call", undefined, 0);
    }
    const last = botObservation(exhausted);
    const terminal = sampleRunout(last, gameDefinition(last.gameMode), seeded(8));
    expect(terminal.board).toEqual(last.board); expect(terminal.remainingCards).toBe(0);
    const visible = [...last.cards, ...terminal.board, ...terminal.hands.flat()];
    expect(new Set(visible.map(c => `${c.rank}${c.suit}`)).size).toBe(visible.length);
  });
  it("divides a board-only royal flush and caps completed work", () => {
    const view = { ...observation(), board: "10c 11c 12c 13c 14c".split(" ").map(parseCard), burnCount: 3, drawCapacity: 40, gameMode: "red-river-holdem" as const };
    const estimate = estimateBotEquity(view, seeded(5));
    expect(estimate).toMatchObject({ equity: 0.5, samples: 96, rankEvaluations: 192 });
    expect(estimate.reason).toBeUndefined();
    const sidePot = { ...view, dealtPlayerCount: 3, drawCapacity: 38, opponents: 2,
      players: [{ seat: 0, committed: 0, eligible: true }, { seat: 1, committed: 10, eligible: true }, { seat: 2, committed: 1000, eligible: true }] };
    // Hero can win only the 30-chip main pot after calling ten.
    const sideEstimate = estimateBotEquity(sidePot, seeded(5));
    expect(sideEstimate.equity).toBeCloseTo(1 / 3, 12); expect(sideEstimate.eligiblePot).toBe(30);
    const fullTable = { ...view, dealtPlayerCount: 8, drawCapacity: 28, opponents: 7,
      players: Array.from({ length: 8 }, (_, seat) => ({ seat, committed: 10, eligible: true })),
      legal: { ...view.legal, check: true, call: 0 } };
    expect(estimateBotEquity(fullTable, seeded(5))).toMatchObject({ equity: 0.125, samples: 96, rankEvaluations: 768 });
  });
  it("uses a legal fallback on estimator errors or an exhausted compute deadline", () => {
    const warning = jest.spyOn(console, "warn").mockImplementation(() => {});
    const broken = { ...observation(), cards: [parseCard("14s"), parseCard("14s")] };
    expect(chooseBotAction(broken, "balanced", seeded(1))).toEqual({ action: "fold" });
    expect(chooseBotAction({ ...broken, legal: { ...broken.legal, check: true, call: 0 } }, "balanced", seeded(1))).toEqual({ action: "check" });
    const now = jest.spyOn(Date, "now").mockReturnValueOnce(0).mockReturnValue(101);
    expect(chooseBotAction(observation(), "balanced", seeded(1))).toEqual({ action: "fold" });
    expect(warning.mock.calls.some(call => (call[1] as any).reason === "work-budget")).toBe(true);
    expect(JSON.stringify(warning.mock.calls)).not.toMatch(/cards|deck|principal/);
    now.mockRestore(); warning.mockRestore();
  });
  it("completes a bounded Red River CPU table with exact chip conservation", () => {
    const t = game(7, "red-river-holdem"); deal(t, 0, eightSeatExhaustionDeck());
    let turns = 0;
    while (t.street !== "complete" && turns++ < 160) {
      const actor = t.seats.find(s => s.seat === t.actor)!;
      if (actor.kind === "cpu") expect(progressTable(t, turns * 2000)).toBe(true);
      else act(t, "owner", legalActions(t, "owner")!.check ? "check" : "call", undefined, turns * 2000);
      expect(t.seats.reduce((n, s) => n + s.stack + (t.street === "complete" ? 0 : s.committed), 0)).toBe(8000);
    }
    expect(t.street).toBe("complete"); expect(t.terminalReason).not.toBeNull();
  });
});
