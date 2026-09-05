import { parseCard } from "@common/interfaces";
import { BOT_STYLES } from "@common/pokerBots";
import { act, applyCommand, deal, joinSeat, legalActions, makeTable, tableView } from "./engine";
import { botObservation, chooseBotAction, progressTable, type BotObservation } from "./bots";
const settings = { name: "CPU practice", maxPlayers: 8, smallBlind: 5, bigBlind: 10, startingStack: 1000, turnSeconds: 30 };
const seeded = (seed: number) => () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
function game(bots = 1) {
  const t = makeTable("cpu-test", "owner", settings); joinSeat(t, "owner", "Player");
  applyCommand(t, "owner", { type: "add-bots", styles: Array.from({ length: bots }, (_, i) => BOT_STYLES[i % 4]) }, 0);
  applyCommand(t, "owner", { type: "ready", ready: true }, 0); return t;
}
function observation(): BotObservation {
  return { cards: [parseCard("14s"), parseCard("14h")], board: [], opponents: 1, pot: 30, bigBlind: 10, currentBet: 10, bet: 0, stack: 1000, position: 0.5,
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
  it("does not let hidden opponent cards or the deck affect a bot observation or seeded action", () => {
    const t = game(); deal(t, 0); act(t, "owner", "call", undefined, 1);
    const before = botObservation(t);
    expect(Object.keys(before).sort()).toEqual(["bet", "bigBlind", "board", "cards", "currentBet", "legal", "opponents", "position", "pot", "stack"].sort());
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

});
