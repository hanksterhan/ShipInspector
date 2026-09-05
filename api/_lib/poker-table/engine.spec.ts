import { act, applyCommand, deal, expireTurn, joinSeat, legalActions, makeTable, shuffledDeck, tableView, TableState } from "./engine";
import { parseCard } from "@common/interfaces";

const settings = { name: "Friday table", maxPlayers: 8, smallBlind: 5, bigBlind: 10, startingStack: 1000, turnSeconds: 30 };
function table(count = 2): TableState {
  const t = makeTable("test-table", "u0", settings);
  for (let i = 0; i < count; i++) { joinSeat(t, `u${i}`, `Player ${i}`); applyCommand(t, `u${i}`, { type: "ready", ready: true }, 0); }
  return t;
}
function river(committed: number[], cards: string[], board = "2c 4h 7s 9d 11c") {
  const t = table(committed.length);
  t.street = "river"; t.handNumber = 1; t.board = board.split(" ").map(parseCard); t.actor = committed.length - 1; t.button = 0;
  t.seats.forEach((s, i) => { s.cards = cards[i].split(" ").map(parseCard); s.committed = committed[i]; s.stack = 1000 - committed[i]; s.status = "active"; s.actedAtBet = 0; });
  return t;
}
describe("no-limit hold'em table engine", () => {
  it("deals distinct cards and uses heads-up blind and action order", () => {
    const t = table(); deal(t, 100);
    expect(t.button).toBe(0); expect(t.actor).toBe(0);
    expect(t.seats.map(s => s.bet)).toEqual([5, 10]);
    expect(new Set([...t.deck, ...t.seats.flatMap(s => s.cards)].map(c => `${c.rank}${c.suit}`)).size).toBe(52);
    act(t, "u0", "call", undefined, 200); expect(t.actor).toBe(1);
    act(t, "u1", "check", undefined, 300); expect(t.street).toBe("flop"); expect(t.actor).toBe(1); expect(t.board).toHaveLength(3);
  });
  it("uses multiway order and gives the big blind its option", () => {
    const t = table(4); deal(t, 0); expect(t.actor).toBe(3); expect(t.seats.map(s => s.bet)).toEqual([0, 5, 10, 0]);
    for (const id of ["u3", "u0", "u1"]) act(t, id, "call", undefined, 1);
    expect(t.actor).toBe(2); expect(legalActions(t, "u2")?.check).toBe(true);
  });
  it("rejects out-of-turn checks and undersized raises", () => {
    const t = table(); deal(t, 0);
    expect(() => act(t, "u1", "fold", undefined, 1)).toThrow("turn");
    expect(() => act(t, "u0", "check", undefined, 1)).toThrow("call or fold");
    for (const amount of [11, 19, 1001, NaN, 20.5]) expect(() => act(t, "u0", "raise", amount, 1)).toThrow("legal raise");
    act(t, "u0", "raise", 35, 1); expect(legalActions(t, "u1")?.minRaiseTo).toBe(60);
  });
  it("does not reopen betting after a short all-in", () => {
    const t = table(3); t.seats[2].stack = 25; deal(t, 0);
    act(t, "u0", "raise", 20, 1); act(t, "u1", "call", undefined, 2); act(t, "u2", "raise", 25, 3);
    expect(legalActions(t, "u0")).toMatchObject({ call: 5, minRaiseTo: null });
    expect(() => act(t, "u0", "raise", 40, 4)).toThrow();
  });
  it("reopens betting when cumulative short all-ins reach a full raise", () => {
    const t = table(4); t.seats[1].stack = 25; t.seats[2].stack = 30; deal(t, 0);
    act(t, "u3", "raise", 20, 1); act(t, "u0", "call", undefined, 2); act(t, "u1", "raise", 25, 3); act(t, "u2", "raise", 30, 4);
    expect(legalActions(t, "u3")?.minRaiseTo).toBe(40);
  });
  it("runs out all-ins, returns uncalled chips, and conserves stacks", () => {
    const t = table(); t.seats[1].stack = 100; deal(t, 0);
    act(t, "u0", "raise", 1000, 1); act(t, "u1", "call", undefined, 2);
    expect(t.street).toBe("complete"); expect(t.board).toHaveLength(5); expect(t.deck).toEqual([]);
    expect(t.seats.reduce((n, s) => n + s.stack, 0)).toBe(1100);
    expect(t.awards.reduce((n, p) => n + p.amount, 0)).toBe(200);
  });
  it("awards separate main and side pots to eligible hands", () => {
    const t = river([50, 100, 200], ["14s 14d", "13s 13d", "12s 12d"]);
    act(t, "u2", "check", undefined, 1);
    expect(t.awards.map(p => ({ amount: p.amount, winners: p.winners.map(w => w.seat) }))).toEqual([{ amount: 150, winners: [0] }, { amount: 100, winners: [1] }]);
    expect(t.seats.map(s => s.stack)).toEqual([1100, 1000, 900]);
  });
  it("counts folded chips but never awards them; gives odd chips left of button", () => {
    const t = river([5, 5, 5], ["2s 3s", "2h 3h", "4s 5s"], "10c 11c 12c 13c 14c");
    t.seats[2].status = "folded"; t.actor = 1;
    act(t, "u1", "check", undefined, 1);
    expect(t.awards[0].winners).toEqual([{ seat: 1, amount: 8, hand: "Royal flush" }, { seat: 0, amount: 7, hand: "Royal flush" }]);
  });
  it("hides every opponent card and all private engine fields", () => {
    const t = table(); deal(t, 0);
    const view = tableView(t, "u0", 0);
    expect(view.seats[0].cards).toHaveLength(2); expect(view.seats[1].cards).toHaveLength(0);
    for (const key of ["deck", "members", "owner", "receipts", "principal", "hash"]) expect(JSON.stringify(view)).not.toContain(`"${key}"`);
    act(t, "u0", "fold", undefined, 1);
    expect(tableView(t, "u1", 1).seats.every(s => s.cards.length === 0)).toBe(true);
  });
  it("times out once, auto-folds to a bet, and sits out next hand", () => {
    const t = table(); deal(t, 0);
    expect(expireTurn(t, 29999)).toBe(false); expect(expireTurn(t, 30000)).toBe(true);
    expect(t.street).toBe("complete"); expect(t.seats[0].sittingOut).toBe(true); expect(expireTurn(t, 30001)).toBe(false);
  });
  it("does not let new arrivals enter a hand already in progress", () => {
    const t = table(); deal(t, 0); joinSeat(t, "late", "Late player");
    expect(t.seats[2]).toMatchObject({ status: "waiting", cards: [], committed: 0 });
    expect(legalActions(t, "late")).toBeNull();
    expect(() => applyCommand(t, "u0", { type: "leave" }, 1)).toThrow("Finish this hand");
  });
  it("requires readiness, rotates the button, and controls refills and closing", () => {
    const t = table(); deal(t, 0); act(t, "u0", "fold", undefined, 1);
    expect(() => deal(t, 2)).toThrow("two players");
    for (const s of t.seats) applyCommand(t, s.principal, { type: "ready", ready: true }, 2);
    deal(t, 3); expect(t.button).toBe(1);
    expect(() => applyCommand(t, "u1", { type: "close" }, 4)).toThrow("host");
  });
  it("conserves chips and completes random legal games from two to eight seats", () => {
    for (let run = 0; run < 70; run++) {
      const count = 2 + run % 7; const t = table(count); deal(t, 0, shuffledDeck());
      let actions = 0;
      while (t.street !== "complete" && actions++ < 200) {
        const s = t.seats.find(s => s.seat === t.actor)!; const legal = legalActions(t, s.principal)!;
        const pick = (run + actions * 7) % 9;
        if (pick === 0) act(t, s.principal, "fold", undefined, actions);
        else if (pick === 1 && legal.minRaiseTo !== null) act(t, s.principal, "raise", legal.maxRaiseTo, actions);
        else act(t, s.principal, legal.check ? "check" : "call", undefined, actions);
        expect(t.seats.every(p => Number.isSafeInteger(p.stack) && p.stack >= 0)).toBe(true);
        expect(t.seats.reduce((n, p) => n + p.stack + (t.street === "complete" ? 0 : p.committed), 0)).toBe(1000 * count);
      }
      expect(t.street).toBe("complete");
    }
  });
});
