import { parseCard } from "@common/interfaces";
import { BOT_STYLES } from "@common/pokerBots";
import { act, applyCommand, deal, inHand, joinSeat, legalActions, makeTable, tableView } from "./engine";
import { gameDefinition, type GameMode } from "@common/pokerModes";
import { sampleRunout } from "@lib/poker/runout";
import { eightSeatExhaustionDeck, stackedDeck } from "./__tests__/fixtures";
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
  describe("ghost modifier", () => {
    afterEach(() => jest.restoreAllMocks());
    const ghostGame = (bots: number, gameMode: GameMode = "holdem") => {
      const t = makeTable("cpu-ghost", "owner", { ...settings, gameMode, ghost: true }); joinSeat(t, "owner", "Player");
      applyCommand(t, "owner", { type: "add-bots", styles: Array.from({ length: bots }, (_, i) => BOT_STYLES[i % 4]) }, 0);
      applyCommand(t, "owner", { type: "ready", ready: true }, 0); return t;
    };
    it("observes the ghost's presence and dead money but never its cards", () => {
      const t = ghostGame(1); t.ghostCarry = 30; deal(t, 0); act(t, "owner", "call", undefined, 1);
      const before = botObservation(t);
      expect(before).toMatchObject({ ghost: true, deadMoney: 30, pot: 50, dealtPlayerCount: 2, drawCapacity: 46 });
      expect(JSON.stringify(before)).not.toMatch(/ghostCards|"deck"|principal/);
      t.ghostCards = [parseCard("2c"), parseCard("3c")].filter(c => !t.seats.some(s => s.cards.some(h => h.rank === c.rank && h.suit === c.suit)));
      t.deck.reverse();
      expect(botObservation(t)).toEqual(before);
      expect(chooseBotAction(before, "balanced", seeded(3))).toEqual(chooseBotAction(botObservation(t), "balanced", seeded(3)));
      const plain = game(1); deal(plain, 0); act(plain, "owner", "call", undefined, 1);
      expect(botObservation(plain)).not.toHaveProperty("ghost");
      expect(botObservation(plain)).not.toHaveProperty("deadMoney");
    });
    it("reserves and samples a ghost hand from unknown cards", () => {
      const view = { ...observation(), ghost: true, drawCapacity: 46 };
      const trial = sampleRunout(view, gameDefinition("holdem"), () => 0);
      expect(trial.hands).toEqual([[parseCard("2c"), parseCard("3c")]]);
      expect(trial.ghost).toEqual([parseCard("4c"), parseCard("5c")]);
      expect(trial.board).toEqual("7c 8c 9c 11c 13c".split(" ").map(parseCard));
      expect(trial.remainingCards).toBe(46 - 8);
      expect(() => sampleRunout({ ...view, drawCapacity: 48 }, gameDefinition("holdem"), () => 0)).toThrow("Invalid public card counts");
      expect(sampleRunout(observation(), gameDefinition("holdem"), () => 0).ghost).toBeNull();
    });
    it("counts the ghost as a showdown rival and dead money as part of the main pot", () => {
      const plain = estimateBotEquity(observation(), seeded(11));
      const ghost = estimateBotEquity({ ...observation(), ghost: true, deadMoney: 30, pot: 60, drawCapacity: 46 }, seeded(11));
      expect(ghost.reason).toBeUndefined(); expect(ghost.samples).toBe(96);
      expect(ghost.eligiblePot).toBe(plain.eligiblePot + 30);
      expect(ghost.equity).toBeLessThan(plain.equity - 0.05);
      const board = { ...observation(), board: "10c 11c 12c 13c 14c".split(" ").map(parseCard), burnCount: 3, drawCapacity: 38, ghost: true };
      // Board royal flush: hero, one opponent, and the ghost share every pot.
      const chop = estimateBotEquity(board, seeded(5));
      expect(chop.equity).toBeCloseTo(1 / 3, 12); expect(chop.rankEvaluations).toBe(288);
    });
    it("counts the ghost in a showdown side pot where the hero is the only eligible player", () => {
      // Seat 1 is all-in for 40 and seat 2 folded after 100: a 120 main pot and a 120 side pot for the hero alone.
      const view = { ...observation(), board: "10c 11c 12c 13c 14c".split(" ").map(parseCard), burnCount: 3, dealtPlayerCount: 3, drawCapacity: 36,
        ghost: true, pot: 240, legal: { ...observation().legal, check: true, call: 0 },
        players: [{ seat: 0, committed: 100, eligible: true }, { seat: 1, committed: 40, eligible: true }, { seat: 2, committed: 100, eligible: false }] };
      // Board royal flush: 40 of the main pot and half the side pot.
      const estimate = estimateBotEquity(view, seeded(5));
      expect(estimate.reason).toBeUndefined(); expect(estimate.eligiblePot).toBe(240);
      expect(estimate.equity).toBeCloseTo(100 / 240, 12);
    });
    it.each(["holdem", "red-river-holdem"] as const)("%s full eight-seat ghost table: a CPU with the nuts calls a river bet", gameMode => {
      // A frozen clock removes the time bound, so only the work cap can stop sampling.
      const now = jest.spyOn(Date, "now").mockReturnValue(0);
      const warning = jest.spyOn(console, "warn").mockImplementation(() => {});
      const t = makeTable("cpu-ghost-full", "owner", { ...settings, gameMode, ghost: true }); joinSeat(t, "owner", "Player");
      applyCommand(t, "owner", { type: "add-bots", styles: Array(7).fill("balanced") }, 0);
      applyCommand(t, "owner", { type: "ready", ready: true }, 0);
      // Button on seat 0: seat 1 posts the small blind and acts first after the flop.
      // Seat 2 holds a royal flush; the black river ends a Red River hand too.
      deal(t, 0, stackedDeck(["2d 3d", "13c 14c", "4d 5d", "6d 7d", "8d 9d", "2h 3h", "4h 5h", "6h 7h"], "8h 9h", "10c 11c 12c 2s 3s"));
      for (let n = 0; t.board.length < 5 && n < 100; n++) {
        const actor = t.seats.find(s => s.seat === t.actor)!;
        act(t, actor.principal, legalActions(t, actor.principal)!.check ? "check" : "call", undefined, 0);
      }
      expect(t.street).toBe("river"); expect(t.actor).toBe(1);
      act(t, t.seats[1].principal, "raise", 40, 0);
      expect(t.actor).toBe(2);
      const view = botObservation(t);
      expect(view).toMatchObject({ dealtPlayerCount: 8, opponents: 7, ghost: true, legal: { call: 40 } });
      const estimate = estimateBotEquity(view, seeded(4));
      // Nine hands per trial: 85 complete trials fit the 768 rank cap.
      expect(estimate).toMatchObject({ equity: 1, samples: 85, rankEvaluations: 765 });
      expect(estimate.reason).toBeUndefined();
      expect(chooseBotAction(view, "balanced", seeded(4)).action).not.toBe("fold");
      t.botActionAt = 0; expect(progressTable(t, 0)).toBe(true);
      expect(t.seats[2].status).not.toBe("folded");
      expect(warning).not.toHaveBeenCalled();
      now.mockRestore(); warning.mockRestore();
    });
    it.each(["holdem", "red-river-holdem"] as const)("%s plays several CPU ghost hands with every chip owed", gameMode => {
      const warning = jest.spyOn(console, "warn").mockImplementation(() => {});
      const t = ghostGame(3, gameMode);
      const owed = () => t.seats.reduce((n, s) => n + s.stack + (inHand(t) ? s.committed : 0), 0) + (inHand(t) ? t.deadMoney : 0) + t.ghostCarry;
      let total = 4000; let carried = 0;
      for (let hand = 0; hand < 8; hand++) {
        for (const s of t.seats) if (s.kind !== "cpu" && s.stack === 0) { applyCommand(t, s.principal, { type: "rebuy" }, 0); total += 1000; }
        total += t.seats.filter(s => s.kind === "cpu" && s.stack === 0).length * 1000;
        applyCommand(t, "owner", { type: "ready", ready: true }, 0); deal(t, hand * 1e6);
        let turns = 0;
        while (inHand(t) && turns++ < 200) {
          const actor = t.seats.find(s => s.seat === t.actor)!; const now = hand * 1e6 + turns * 2000;
          if (actor.kind === "cpu") expect(progressTable(t, now)).toBe(true);
          else act(t, "owner", legalActions(t, "owner")!.check ? "check" : "call", undefined, now);
          expect(owed()).toBe(total);
        }
        expect(t.street).toBe("complete");
        carried += t.ghostCarry;
      }
      expect(Number.isSafeInteger(carried)).toBe(true);
      // The sampler must accept ghost card counts; a fallback means the CPU could not estimate.
      expect(warning.mock.calls.filter(call => (call[1] as any)?.reason === "estimator-error")).toEqual([]);
      warning.mockRestore();
    }, 30000);
  });
});
