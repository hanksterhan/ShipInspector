import { parseCard, type Card } from "@common/interfaces";
import type { GameMode } from "@common/pokerModes";
import { act, applyCommand, deal, inHand, joinSeat, legalActions, makeTable, tableView, type TableState } from "./engine";
import { handRecordView } from "./history";
import { stackedDeck as stacked } from "./__tests__/fixtures";

const settings = (gameMode: GameMode = "holdem") => ({ name: "Ghost", gameMode, ghost: true, maxPlayers: 8,
  smallBlind: 5, bigBlind: 10, startingStack: 1000, turnSeconds: 30 });
const cards = (text: string) => text.trim().split(/\s+/).map(parseCard);
const key = (c: Card) => `${c.rank}${c.suit}`;
// Deal order with the button on seat 0: one card at a time from the seat left
// of the button, then the ghost's two cards, then one burn and the flop.
function deckWith(head: string): Card[] {
  const top = cards(head); const seen = new Set(top.map(key));
  const rest = ["c", "d", "h", "s"].flatMap(suit => Array.from({ length: 13 }, (_, i) => parseCard(`${i + 2}${suit}`))).filter(c => !seen.has(key(c)));
  return [...top, ...rest];
}
const all = () => ["c", "d", "h", "s"].flatMap(suit => Array.from({ length: 13 }, (_, i) => parseCard(`${i + 2}${suit}`)));
function checkDown(t: TableState) {
  for (let n = 0; inHand(t) && n < 200; n++) {
    const s = t.seats.find(p => p.seat === t.actor)!;
    act(t, s.principal, legalActions(t, s.principal)!.check ? "check" : "call", undefined, n);
  }
}
const stacks = (t: TableState) => t.seats.map(s => s.stack);
function game(count = 2, gameMode: GameMode = "holdem", stacks: number[] = []): TableState {
  const t = makeTable("ghost", "u0", settings(gameMode));
  for (let i = 0; i < count; i++) {
    joinSeat(t, `u${i}`, `P${i}`); applyCommand(t, `u${i}`, { type: "ready", ready: true }, 0);
    if (stacks[i] !== undefined) t.seats[i].stack = stacks[i];
  }
  return t;
}
// Total chips the table owes: stacks, live bets, dead money in play, and the ghost carryover.
const owed = (t: TableState) => t.seats.reduce((n, s) => n + s.stack + (inHand(t) ? s.committed : 0), 0) +
  (inHand(t) ? t.deadMoney : 0) + t.ghostCarry;

describe("ghost hand deal and privacy", () => {
  it("deals the ghost two cards after the players from the same deck and hides them", () => {
    const t = game(2);
    deal(t, 0, deckWith("14s 13s 14d 13d 2c 7d"));
    expect(t.seats.map(s => s.cards.map(key))).toEqual([["13s", "13d"], ["14s", "14d"]]);
    expect(t.ghostCards.map(key)).toEqual(["2c", "7d"]);
    expect(t.deck).toHaveLength(52 - 4 - 2);
    for (const principal of ["u0", "u1", "spectator"]) {
      const view = tableView(t, principal, 0);
      expect(view.ghost).toEqual({ carry: 0, deadMoney: 0, hasCards: true, cards: [] });
      expect(JSON.stringify(view)).not.toMatch(/"2c"|ghostCards|\{"rank":2,"suit":"c"\}/);
    }
  });
  it("leaves a table without the modifier unchanged", () => {
    const t = makeTable("plain", "u0", { ...settings(), ghost: undefined });
    for (const id of ["u0", "u1"]) { joinSeat(t, id, id); applyCommand(t, id, { type: "ready", ready: true }, 0); }
    deal(t, 0, deckWith("14s 13s 14d 13d"));
    expect(t.deck).toHaveLength(48);
    expect(t.ghostCards).toEqual([]);
    expect(tableView(t, "u0", 0)).not.toHaveProperty("ghost");
    expect(t.stateFormatVersion).toBe(1);
  });
});

describe("ghost showdown", () => {
  it("takes the whole pot as carryover when it beats every eligible player", () => {
    const t = game(2);
    // Seat 1 is left of the button: aces. Seat 0: kings. Ghost: nines for a set.
    deal(t, 0, stacked(["14s 14d", "13s 13d"], "9c 9s", "9h 2c 5d 8s 12h"));
    checkDown(t);
    expect(t.street).toBe("complete");
    expect(t.awards).toEqual([{ amount: 20, winners: [], ghost: { amount: 20, hand: "Three of a kind" } }]);
    expect(stacks(t)).toEqual([990, 990]);
    expect(t.ghostCarry).toBe(20);
    expect(owed(t)).toBe(2000);
    expect(tableView(t, "u0", 9).ghost).toEqual({ carry: 20, deadMoney: 0, hasCards: true, cards: cards("9c 9s") });
  });
  it("chops a tie with one ghost share and gives the odd chip to the tied player", () => {
    const t = game(3);
    // Deal order: seat 1, seat 2, seat 0 (button). Seat 1 folds its small blind: pot 25.
    deal(t, 0, stacked(["7s 2d", "12s 3d", "11s 10s"], "12h 4c", "14c 14d 13h 13s 2c"));
    act(t, "u0", "call", undefined, 1); act(t, "u1", "fold", undefined, 2);
    checkDown(t);
    // The folded blind's chips join the one pot that seats 0 and 2 contest.
    expect(t.awards).toEqual([
      { amount: 25, winners: [{ seat: 2, amount: 13, hand: "Two pair" }], ghost: { amount: 12, hand: "Two pair" } },
    ]);
    expect(stacks(t)).toEqual([990, 995, 1003]);
    expect(t.ghostCarry).toBe(12); expect(owed(t)).toBe(3000);
  });
  it("splits one pot when a folded blind and dead money make layers with the same players", () => {
    const t = game(4); t.ghostCarry = 30;
    // Deal order: seats 1, 2, 3, 0. Every hand plays the board royal flush.
    deal(t, 0, stacked(["2s 3s", "2h 3h", "2d 3d", "4s 4h"], "4d 5d", "10c 11c 12c 13c 14c"));
    act(t, "u3", "call", undefined, 1); act(t, "u0", "call", undefined, 2); act(t, "u1", "fold", undefined, 3);
    checkDown(t);
    // Layers of 20 (+30 dead) and 15 settled apart would give the ghost 12 + 3 = 15.
    expect(t.awards).toEqual([{ amount: 65, winners: [
      { seat: 2, amount: 17, hand: "Royal flush" }, { seat: 3, amount: 16, hand: "Royal flush" }, { seat: 0, amount: 16, hand: "Royal flush" },
    ], ghost: { amount: 16, hand: "Royal flush" } }]);
    expect(stacks(t)).toEqual([1006, 995, 1007, 1006]);
    expect(t.ghostCarry).toBe(16); expect(owed(t)).toBe(4030);
  });
  it("splits one pot when two folded players make layers with the same players", () => {
    const t = game(5);
    deal(t, 0, stacked(["2s 3s", "2h 3h", "2d 3d", "4s 4h", "5s 5h"], "4d 5d", "10c 11c 12c 13c 14c"));
    act(t, "u3", "call", undefined, 1); act(t, "u4", "call", undefined, 2); act(t, "u0", "raise", 23, 3);
    act(t, "u1", "fold", undefined, 4); act(t, "u2", "call", undefined, 5); act(t, "u3", "fold", undefined, 6); act(t, "u4", "call", undefined, 7);
    checkDown(t);
    // Layers of 25, 20, and 39 settled apart would give the ghost 6 + 5 + 9 = 20.
    expect(t.awards).toEqual([{ amount: 84, winners: [
      { seat: 2, amount: 21, hand: "Royal flush" }, { seat: 4, amount: 21, hand: "Royal flush" }, { seat: 0, amount: 21, hand: "Royal flush" },
    ], ghost: { amount: 21, hand: "Royal flush" } }]);
    expect(stacks(t)).toEqual([998, 995, 998, 990, 998]);
    expect(t.ghostCarry).toBe(21); expect(owed(t)).toBe(5000);
  });
  it("keeps a short all-in in the merged main pot and a side pot without it apart", () => {
    const t = game(4, "holdem", [1000, 1000, 1000, 40]);
    deal(t, 0, stacked(["2s 3s", "2h 3h", "2d 3d", "4s 4h"], "4d 5d", "10c 11c 12c 13c 14c"));
    act(t, "u3", "raise", 40, 1); act(t, "u0", "raise", 100, 2); act(t, "u1", "fold", undefined, 3); act(t, "u2", "call", undefined, 4);
    checkDown(t);
    expect(t.awards).toEqual([
      { amount: 125, winners: [
        { seat: 2, amount: 32, hand: "Royal flush" }, { seat: 3, amount: 31, hand: "Royal flush" }, { seat: 0, amount: 31, hand: "Royal flush" },
      ], ghost: { amount: 31, hand: "Royal flush" } },
      { amount: 120, winners: [{ seat: 2, amount: 40, hand: "Royal flush" }, { seat: 0, amount: 40, hand: "Royal flush" }], ghost: { amount: 40, hand: "Royal flush" } },
    ]);
    expect(stacks(t)).toEqual([971, 995, 972, 31]);
    expect(t.ghostCarry).toBe(71); expect(owed(t)).toBe(3040);
  });
  it("keeps separate contribution layers on a table without the modifier", () => {
    const t = makeTable("plain", "u0", { ...settings(), ghost: undefined });
    for (let i = 0; i < 4; i++) { joinSeat(t, `u${i}`, `P${i}`); applyCommand(t, `u${i}`, { type: "ready", ready: true }, 0); }
    deal(t, 0, stacked(["2s 3s", "2h 3h", "2d 3d", "4s 4h"], "", "10c 11c 12c 13c 14c"));
    act(t, "u3", "call", undefined, 1); act(t, "u0", "call", undefined, 2); act(t, "u1", "fold", undefined, 3);
    checkDown(t);
    expect(t.awards.map(a => a.amount)).toEqual([20, 15]);
  });
  it("splits among several tied players plus one ghost share with odd chips clockwise from the button", () => {
    const t = game(3);
    // Everyone plays the board royal flush: four shares of 30.
    deal(t, 0, stacked(["2s 3s", "2h 3h", "2d 3d"], "4d 4h", "10c 11c 12c 13c 14c"));
    checkDown(t);
    expect(t.awards).toEqual([{ amount: 30, winners: [
      { seat: 1, amount: 8, hand: "Royal flush" }, { seat: 2, amount: 8, hand: "Royal flush" }, { seat: 0, amount: 7, hand: "Royal flush" },
    ], ghost: { amount: 7, hand: "Royal flush" } }]);
    expect(t.ghostCarry).toBe(7); expect(owed(t)).toBe(3000);
  });
  it("pays players normally and carries nothing when the ghost loses", () => {
    const t = game(2);
    deal(t, 0, stacked(["14s 14d", "13s 13d"], "2c 7d", "9h 3c 5d 8s 12h"));
    checkDown(t);
    expect(t.awards).toEqual([{ amount: 20, winners: [{ seat: 1, amount: 20, hand: "One pair" }] }]);
    expect(t.ghostCarry).toBe(0); expect(stacks(t)).toEqual([990, 1010]);
    expect(tableView(t, "u1", 9).ghost!.cards).toEqual(cards("2c 7d"));
  });
});

describe("ghost and fold-out wins", () => {
  it("pays an uncontested pot normally and never reveals the ghost cards", () => {
    const t = game(2);
    deal(t, 0, stacked(["2s 7d", "3h 8c"], "14s 14d", "14h 14c 13d 4s 5s"));
    act(t, "u0", "call", undefined, 1); act(t, "u1", "check", undefined, 2);
    act(t, "u1", "raise", 20, 3); act(t, "u0", "fold", undefined, 4);
    expect(t.awards).toEqual([{ amount: 20, winners: [{ seat: 1, amount: 20, hand: "Uncontested" }] }]);
    expect(t.ghostCarry).toBe(0); expect(t.ghostCards).toEqual([]);
    for (const who of ["u0", "u1", "spectator"]) {
      const view = tableView(t, who, 5);
      expect(view.ghost).toEqual({ carry: 0, deadMoney: 0, hasCards: false, cards: [] });
      expect(JSON.stringify(view)).not.toMatch(/\{"rank":14,"suit":"(s|d)"\}/);
    }
  });
});

describe("ghost carryover as dead money", () => {
  it("moves the carryover into the next main pot without adding a player contribution", () => {
    const t = game(2); t.ghostCarry = 30;
    deal(t, 0, stacked(["14s 14d", "13s 13d"], "2c 7d", "9h 3c 5d 8s 12h"));
    expect(t).toMatchObject({ ghostCarry: 0, deadMoney: 30 });
    expect(t.seats.map(s => s.committed)).toEqual([5, 10]);
    expect(tableView(t, "u0", 0)).toMatchObject({ pot: 45, ghost: { carry: 0, deadMoney: 30 } });
    expect(owed(t)).toBe(2030);
    checkDown(t);
    expect(t.awards).toEqual([{ amount: 50, winners: [{ seat: 1, amount: 50, hand: "One pair" }] }]);
    expect(stacks(t)).toEqual([990, 1040]); expect(owed(t)).toBe(2030);
  });
  it("lets a short all-in win the main pot with dead money while the ghost takes a side pot it beats", () => {
    const t = game(3, "holdem", [1000, 1000, 40]); t.ghostCarry = 30;
    // Deal order: seat 1 (jacks), seat 2 (short, aces), seat 0 (queens). Ghost: kings.
    deal(t, 0, stacked(["11h 11c", "14s 14d", "12h 12c"], "13c 13d", "2c 7d 9h 4s 3d"));
    act(t, "u0", "raise", 100, 1); act(t, "u1", "call", undefined, 2); act(t, "u2", "call", undefined, 3);
    expect(t.seats[2]).toMatchObject({ status: "all-in", committed: 40 });
    checkDown(t);
    expect(t.awards).toEqual([
      { amount: 150, winners: [{ seat: 2, amount: 150, hand: "One pair" }] },
      // Queens are best among the side-pot players but lose to the ghost; jacks do not inherit.
      { amount: 120, winners: [], ghost: { amount: 120, hand: "One pair" } },
    ]);
    expect(stacks(t)).toEqual([900, 900, 150]);
    expect(t.ghostCarry).toBe(120); expect(owed(t)).toBe(2070);
  });
  it("gives dead money to a fold-out winner and refunds only the player's uncalled chips", () => {
    const t = game(2); t.ghostCarry = 30;
    deal(t, 0, stacked(["2s 7d", "3h 8c"], "14s 14d", "14h 14c 13d 4s 5s"));
    act(t, "u0", "raise", 1000, 1); act(t, "u1", "fold", undefined, 2);
    expect(t.awards).toEqual([{ amount: 50, winners: [{ seat: 0, amount: 50, hand: "Uncontested" }] }]);
    expect(stacks(t)).toEqual([1040, 990]);
    expect(t.ghostCarry).toBe(0); expect(owed(t)).toBe(2030);
  });
});

describe("ghost carryover across hands", () => {
  const readyAll = (t: TableState) => { for (const s of t.seats) applyCommand(t, s.principal, { type: "ready", ready: true }, 0); };
  it("accumulates over several ghost wins, survives seat changes, and pays the next player winner once", () => {
    const t = game(2);
    deal(t, 0, stacked(["14s 14d", "13s 13d"], "9c 9s", "9h 2c 5d 8s 12h")); checkDown(t);
    expect(t.ghostCarry).toBe(20); expect(owed(t)).toBe(2000);
    // Hand 2: button seat 1, so seat 0 is dealt first. Ghost wins the dead money and the new pot.
    readyAll(t); deal(t, 0, stacked(["14s 14d", "13s 13d"], "9c 9s", "9h 2c 5d 8s 12h"));
    expect(t).toMatchObject({ handNumber: 2, deadMoney: 20, ghostCarry: 0 }); expect(owed(t)).toBe(2000);
    checkDown(t);
    expect(t.awards).toEqual([{ amount: 40, winners: [], ghost: { amount: 40, hand: "Three of a kind" } }]);
    expect(t.ghostCarry).toBe(40); expect(stacks(t)).toEqual([980, 980]);
    // Between hands: a player leaves, another joins. The carryover stays on the table.
    applyCommand(t, "u1", { type: "leave" }, 0);
    expect(t).toMatchObject({ street: "waiting", ghostCarry: 40, ghostCards: [], deadMoney: 0 });
    joinSeat(t, "u2", "P2"); readyAll(t);
    expect(t.seats.map(s => [s.seat, s.stack])).toEqual([[0, 980], [1, 1000]]);
    deal(t, 0, stacked(["14s 14d", "13s 13d"], "2c 7d", "9h 3c 5d 8s 12h"));
    expect(t).toMatchObject({ handNumber: 3, deadMoney: 40, ghostCarry: 0 });
    checkDown(t);
    expect(t.awards).toEqual([{ amount: 60, winners: [{ seat: 1, amount: 60, hand: "One pair" }] }]);
    expect(t.ghostCarry).toBe(0); expect(stacks(t)).toEqual([970, 1050]);
    readyAll(t); deal(t, 0); expect(t.deadMoney).toBe(0);
  });
  it("keeps the carryover on a closed table without paying it to a player", () => {
    const t = game(2);
    deal(t, 0, stacked(["14s 14d", "13s 13d"], "9c 9s", "9h 2c 5d 8s 12h")); checkDown(t);
    applyCommand(t, "u0", { type: "close" }, 0);
    expect(t).toMatchObject({ closed: true, ghostCarry: 20 });
    expect(stacks(t)).toEqual([990, 990]); expect(owed(t)).toBe(2000);
    expect(tableView(t, "u1", 0)).toMatchObject({ closed: true, canDeal: false, ghost: { carry: 20 } });
    expect(() => applyCommand(t, "u0", { type: "deal" }, 0)).toThrow("closed");
    expect(t.ghostCarry).toBe(20);
  });
  // Seat 2 is all-in for 40. Seat 0 bets 200 on the flop and seat 1 folds, so
  // seat 0 alone is eligible for the 120-chip side pot, but the hand shows down.
  const sidePotLine = (players: string[], ghost: string, board: string) => {
    const t = game(3, "holdem", [1000, 1000, 40]);
    deal(t, 0, stacked(players, ghost, board));
    act(t, "u0", "raise", 100, 1); act(t, "u1", "call", undefined, 2); act(t, "u2", "call", undefined, 3);
    act(t, "u1", "check", undefined, 4); act(t, "u0", "raise", 200, 5); act(t, "u1", "fold", undefined, 6);
    expect(t.street).toBe("complete"); expect(t.terminalReason).toBe("river-complete");
    expect(t.handRecord!.events).toContainEqual(expect.objectContaining({ type: "refund", seat: 0, amount: 200 }));
    return t;
  };
  it("takes a showdown side pot with one eligible player when it beats that player", () => {
    const t = sidePotLine(["11h 11c", "14s 14d", "12h 12c"], "9c 9s", "9h 7d 2c 4s 3d");
    expect(t.awards).toEqual([
      { amount: 120, winners: [], ghost: { amount: 120, hand: "Three of a kind" } },
      { amount: 120, winners: [], ghost: { amount: 120, hand: "Three of a kind" } },
    ]);
    expect(stacks(t)).toEqual([900, 900, 0]); expect(t.ghostCarry).toBe(240); expect(owed(t)).toBe(2040);
  });
  it("splits a showdown side pot with one eligible player when it ties that player", () => {
    // Seat 2's aces win the main pot. Seat 0 and the ghost both play kings and sevens with a four.
    const t = sidePotLine(["11h 11c", "14s 14d", "3h 4h"], "3d 4d", "13h 13c 7d 7s 2c");
    expect(t.awards).toEqual([
      { amount: 120, winners: [{ seat: 2, amount: 120, hand: "Two pair" }] },
      { amount: 120, winners: [{ seat: 0, amount: 60, hand: "Two pair" }], ghost: { amount: 60, hand: "Two pair" } },
    ]);
    expect(stacks(t)).toEqual([960, 900, 120]); expect(t.ghostCarry).toBe(60); expect(owed(t)).toBe(2040);
  });
});

describe("ghost with Red River", () => {
  it("scores the ghost on every appended river", () => {
    const t = game(2, "red-river-holdem");
    // Rivers: J♥ (red), Q♦ (red), 10♣ (black, final). Only the last river gives the ghost a straight.
    deal(t, 0, stacked(["14s 14d", "6d 3s"], "13s 8c", "2c 4h 7s 9d 11h 12d 10c"));
    checkDown(t);
    expect(t).toMatchObject({ terminalReason: "black-river", riverNumber: 3 });
    expect(t.board).toHaveLength(7);
    expect(t.awards).toEqual([{ amount: 20, winners: [], ghost: { amount: 20, hand: "Straight" } }]);
    expect(owed(t)).toBe(2000);
  });
  it("counts the ghost's two cards in deck exhaustion and runs out an all-in to the same stop", () => {
    const black = all().filter(c => c.suit === "c" || c.suit === "s"); const red = all().filter(c => c.suit === "h" || c.suit === "d");
    // 16 hole cards and 2 ghost cards, then 34 cards: seven black for burns, flop and turn, then only red rivers.
    const deck = [...black.splice(0, 18), ...black.splice(0, 7), red.shift()!, black.shift()!, ...red];
    expect(deck).toHaveLength(52);
    const t = game(8, "red-river-holdem");
    deal(t, 0, deck);
    expect(tableView(t, "u0", 0).drawCapacity).toBe(34);
    checkDown(t);
    expect(t).toMatchObject({ street: "complete", terminalReason: "deck-exhausted", burnCount: 16 });
    expect(t.board).toHaveLength(18); expect(t.deck).toEqual([]);
    expect(owed(t)).toBe(8000);
    const allIn = game(2, "red-river-holdem", [1000, 100]);
    deal(allIn, 0, stacked(["14s 14d", "6d 3s"], "13s 8c", "2c 4h 7s 9d 11h 12d 10c"));
    act(allIn, "u0", "raise", 1000, 1); act(allIn, "u1", "call", undefined, 2);
    expect(allIn).toMatchObject({ street: "complete", terminalReason: "black-river", ghostCarry: 200 });
    expect(stacks(allIn)).toEqual([900, 0]); expect(owed(allIn)).toBe(1100);
  });
});

describe("ghost hand records", () => {
  it("records dead money and reveals the ghost only in a showdown record", () => {
    const t = game(2); t.ghostCarry = 30;
    deal(t, 0, stacked(["14s 14d", "13s 13d"], "9c 9s", "9h 2c 5d 8s 12h"));
    expect(t.handRecord!.events.slice(0, 2)).toMatchObject([{ type: "start" }, { type: "dead-money", amount: 30 }]);
    const during = JSON.stringify(handRecordView(t.handRecord!, "u0"));
    expect(during).not.toMatch(/"type":"ghost"|\{"rank":9,"suit":"(c|s)"\}/);
    checkDown(t);
    const view = handRecordView(t.handRecord!, "spectator");
    const tail = view.events.slice(-3);
    expect(tail).toMatchObject([
      { type: "ghost", cards: cards("9c 9s") },
      { type: "award", award: { amount: 50, winners: [], ghost: { amount: 50 } } },
      { type: "end", reason: "river-complete", ghostCarry: 50 },
    ]);
  });
  it("keeps the ghost cards out of a fold-out record", () => {
    const t = game(2);
    deal(t, 0, stacked(["2s 7d", "3h 8c"], "9c 9s", "9h 2c 5d 8s 12h"));
    act(t, "u0", "fold", undefined, 1);
    const view = handRecordView(t.handRecord!, "u1");
    expect(JSON.stringify(view)).not.toMatch(/"type":"ghost"|\{"rank":9,"suit":"(c|s)"\}/);
    expect(view.events[view.events.length - 1]).toMatchObject({ type: "end", reason: "uncontested", ghostCarry: 0 });
  });
  it("adds no ghost entries to records without the modifier", () => {
    const t = makeTable("plain", "u0", { ...settings(), ghost: false });
    for (const id of ["u0", "u1"]) { joinSeat(t, id, id); applyCommand(t, id, { type: "ready", ready: true }, 0); }
    deal(t, 0); checkDown(t);
    expect(JSON.stringify(t.handRecord)).not.toMatch(/ghost|dead-money/);
  });
});
