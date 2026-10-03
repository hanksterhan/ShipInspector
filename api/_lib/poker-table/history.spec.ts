import { eightSeatExhaustionDeck } from "./__tests__/fixtures";
import { act, applyCommand, deal, joinSeat, legalActions, makeTable, tableView } from "./engine";
import { handRecordView } from "./history";
const settings = { name: "History", gameMode: "red-river-holdem" as const, maxPlayers: 8,
  smallBlind: 5, bigBlind: 10, startingStack: 1000, turnSeconds: 30 };
function game(count = 2) {
  const t = makeTable("history", "u0", settings);
  for (let i = 0; i < count; i++) { joinSeat(t, `u${i}`, `P${i}`); applyCommand(t, `u${i}`, { type: "ready", ready: true }, 0); }
  return t;
}
describe("complete hand records and private projections", () => {
  it("masks opponent cards and internal principals while retaining the player's own history", () => {
    const t = game(); deal(t, 0);
    const view = tableView(t, "u0", 1).handRecord!;
    expect(view.players.map(p => p.cards.length)).toEqual([2, 0]);
    expect(JSON.stringify(view)).not.toContain("principal");
    expect(view.events.filter(e => e.type === "blind").map(e => e.type === "blind" ? e.amount : 0)).toEqual([5, 10]);
    act(t, "u0", "fold", undefined, 1);
    expect(handRecordView(t.handRecord!, "spectator").players.every(p => p.cards.length === 0)).toBe(true);
    // Seat reuse must not grant access to the former seat owner's private cards.
    expect(handRecordView(t.handRecord!, "replacement").players.every(p => p.cards.length === 0)).toBe(true);
  });
  it("keeps every typed deal and round in a long hand beyond the text-feed cap", () => {
    const t = game(8);
    deal(t, 0, eightSeatExhaustionDeck());
    let actions = 0;
    while (t.street !== "complete" && actions++ < 160) {
      const s = t.seats.find(s => s.seat === t.actor)!; const legal = legalActions(t, s.principal)!;
      act(t, s.principal, legal.check ? "check" : "call", undefined, actions);
    }
    expect(t.street).toBe("complete"); expect(t.events).toHaveLength(80);
    const view = handRecordView(t.handRecord!, "spectator");
    expect(view.events.length).toBeGreaterThan(80);
    expect(view.events.map(e => e.sequence)).toEqual(view.events.map((_, i) => i));
    const deals = view.events.filter(e => e.type === "deal");
    expect(deals.flatMap(e => e.type === "deal" ? e.cards : [])).toEqual(t.board);
    expect(new Set(deals.map(e => e.roundId)).size).toBe(deals.length);
    expect(view.events[view.events.length - 1]).toMatchObject({ type: "end", reason: "deck-exhausted" });
    expect(view.players.every(p => p.cards.length === 2)).toBe(true);
  });
  it("records actual chip deltas and original stacks for replay", () => {
    const t = game(); deal(t, 0);
    act(t, "u0", "raise", 40, 1); act(t, "u1", "call", undefined, 2);
    expect(t.handRecord!.players.map(p => p.startingStack)).toEqual([1000, 1000]);
    expect(t.handRecord!.events.filter(e => e.type === "action")).toMatchObject([
      { type: "action", seat: 0, action: "raise", amount: 35, raiseTo: 40, roundId: 1 },
      { type: "action", seat: 1, action: "call", amount: 30, roundId: 1 },
    ]);
  });
});
