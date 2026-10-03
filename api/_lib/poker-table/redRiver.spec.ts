import { parseCard, type Card } from "@common/interfaces";
import { act, applyCommand, deal, joinSeat, legalActions, makeTable, tableView, type TableState } from "./engine";
const settings = { name: "Red River", gameMode: "red-river-holdem" as const, maxPlayers: 8,
  smallBlind: 5, bigBlind: 10, startingStack: 1000, turnSeconds: 30 };
const cards = (text: string) => text.split(" ").map(parseCard);
function game(count = 2): TableState {
  const t = makeTable("red-river", "u0", settings);
  for (let i = 0; i < count; i++) { joinSeat(t, `u${i}`, `Player ${i}`); applyCommand(t, `u${i}`, { type: "ready", ready: true }, 0); }
  return t;
}
function deckWith(rivers: string): Card[] {
  const head = cards(`14s 13s 14d 13d 2s 2c 4h 7s 3s 9d 5s ${rivers.split(" ").join(" 6s ")}`);
  // Unique burns between extra rivers; fixture has at most three river cards.
  if (head.filter(c => `${c.rank}${c.suit}` === "6s").length > 1) head[head.findIndex((c, i) => i > 12 && `${c.rank}${c.suit}` === "6s")] = parseCard("8s");
  const seen = new Set(head.map(c => `${c.rank}${c.suit}`));
  const rest = ["c", "d", "h", "s"].flatMap(suit => Array.from({ length: 13 }, (_, i) => parseCard(`${i + 2}${suit}`))).filter(c => !seen.has(`${c.rank}${c.suit}`));
  return [...head, ...rest];
}
function checkRound(t: TableState) {
  const round = t.roundId;
  while (t.street !== "complete" && t.roundId === round) {
    const actor = t.seats.find(s => s.seat === t.actor)!;
    const legal = legalActions(t, actor.principal)!;
    act(t, actor.principal, legal.check ? "check" : "call", undefined, t.roundId * 100);
  }
}
function reachRiver(t: TableState) { while (t.board.length < 5) checkRound(t); }
const chips = (t: TableState) => t.seats.reduce((n, s) => n + s.stack + (t.street === "complete" ? 0 : s.committed), 0);
describe("Red River complete hand paths", () => {
  it("bets every appended red river and the final black river with fresh raise state", () => {
    const t = game(); deal(t, 0, deckWith("11h 12d 10c")); reachRiver(t);
    expect(t).toMatchObject({ roundId: 4, riverNumber: 1, actor: 1 });
    act(t, "u1", "raise", 40, 1); act(t, "u0", "call", undefined, 2);
    expect(t).toMatchObject({ street: "river", roundId: 5, riverNumber: 2, actor: 1, currentBet: 0, minRaise: 10 });
    expect(t.seats.map(s => [s.bet, s.actedAtBet])).toEqual([[0, null], [0, null]]);
    expect(legalActions(t, "u1")?.minRaiseTo).toBe(10);
    checkRound(t);
    expect(t.board.map(c => `${c.rank}${c.suit}`).slice(4)).toEqual(["11h", "12d", "10c"]);
    expect(t).toMatchObject({ street: "river", roundId: 6, riverNumber: 3, actor: 1, burnCount: 5 });
    expect(t.awards).toEqual([]); checkRound(t);
    expect(t).toMatchObject({ street: "complete", terminalReason: "black-river", actor: null, deadline: null });
    expect(chips(t)).toBe(2000);
  });
  it("runs all-ins through the same red-to-black rule and refunds uncalled chips", () => {
    const t = game(); t.seats[1].stack = 100; deal(t, 0, deckWith("11h 12d 10c"));
    act(t, "u0", "raise", 1000, 1); act(t, "u1", "call", undefined, 2);
    expect(t).toMatchObject({ street: "complete", riverNumber: 3, terminalReason: "black-river" });
    expect(t.board).toHaveLength(7); expect(chips(t)).toBe(1100);
    expect(t.awards.reduce((n, p) => n + p.amount, 0)).toBe(200);
  });
  it("stops after the first black river but still gives its betting round", () => {
    const t = game(); deal(t, 0, deckWith("11c")); reachRiver(t);
    expect(t.street).toBe("river"); expect(t.actor).toBe(1); checkRound(t);
    expect(t.board).toHaveLength(5); expect(t.terminalReason).toBe("black-river");
  });
  it("awards a fold-out without dealing another river", () => {
    const t = game(); deal(t, 0, deckWith("11h 12d")); reachRiver(t);
    act(t, "u1", "fold", undefined, 1);
    expect(t.board).toHaveLength(5); expect(t.terminalReason).toBe("uncontested"); expect(chips(t)).toBe(2000);
    expect(tableView(t, "u0", 1).seats.every(s => s.cards.length === 0)).toBe(true);
  });
  it.each([0, 1])("finishes betting on an exhausted red board with %i cards left", remaining => {
    const t = game(); deal(t, 0, deckWith("11h")); reachRiver(t);
    t.deck = t.deck.slice(0, remaining); const board = [...t.board];
    checkRound(t);
    expect(t.terminalReason).toBe("deck-exhausted"); expect(t.board).toEqual(board);
    expect(t.events.some(e => e.text.includes("Deck exhausted"))).toBe(true); expect(chips(t)).toBe(2000);
  });
  it("keeps side-pot eligibility and short-raise reopening on an extra river", () => {
    const t = game(3); deal(t, 0); t.board = cards("2c 4h 7s 9d 11h 12c");
    t.street = "river"; t.roundId = 5; t.riverNumber = 2; t.actor = 0; t.currentBet = 0; t.minRaise = 10;
    t.seats.forEach((s, i) => { s.cards = cards(["14s 14d", "13s 13d", "10s 10d"][i]); s.status = "active"; s.bet = 0; s.actedAtBet = null; s.committed = [50, 100, 100][i]; s.stack = [950, 900, 25][i]; });
    const total = chips(t);
    act(t, "u0", "raise", 20, 1); act(t, "u1", "call", undefined, 2); act(t, "u2", "raise", 25, 3);
    expect(legalActions(t, "u0")).toMatchObject({ call: 5, minRaiseTo: null });
    act(t, "u0", "call", undefined, 4); act(t, "u1", "call", undefined, 5);
    expect(t.awards.map(p => [p.amount, p.winners.map(w => w.seat)])).toEqual([[225, [0]], [100, [1]]]);
    expect(chips(t)).toBe(total);
  });
  it("handles a physically complete deck with no black river before exhaustion", () => {
    const t = game(8);
    const all = ["c", "d", "h", "s"].flatMap(suit => Array.from({ length: 13 }, (_, i) => parseCard(`${i + 2}${suit}`)));
    const black = all.filter(c => c.suit === "c" || c.suit === "s");
    const red = all.filter(c => c.suit === "h" || c.suit === "d");
    const deck = [...black.splice(0, 16)];
    deck.push(black.shift()!, ...red.splice(0, 3), black.shift()!, red.shift()!, black.shift()!, red.shift()!);
    while (red.length >= 2) deck.push(black.shift() || red.shift()!, red.shift()!);
    deck.push(...black, ...red);
    expect(deck).toHaveLength(52); deal(t, 0, deck);
    let rounds = 0;
    while (t.street !== "complete" && rounds++ < 24) checkRound(t);
    expect(t).toMatchObject({ street: "complete", terminalReason: "deck-exhausted", burnCount: 17 });
    expect(t.board).toHaveLength(19); expect(chips(t)).toBe(8000);
  });
});
