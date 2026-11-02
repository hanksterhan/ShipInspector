// Two official MCP HTTP clients play through the gateway in local workerd,
// against the real API router and table service on in-memory PGlite.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { caller, connect, eventNet, ghostTake, startApi, startGateway } from "./harness.mjs";

const TOOLS = ["poker_act", "poker_deal", "poker_get_hand", "poker_get_table", "poker_leave", "poker_ready", "poker_refill", "poker_request_id", "poker_wait_for_turn"];
let api; let gateway;
before(async () => { api = await startApi(); gateway = await startGateway({ upstream: api.url }); }, { timeout: 90000 });
after(async () => { await gateway?.stop("play"); await api?.close(); }, { timeout: 15000 });

// Deterministic fixture, as in the stdio ghost test: after a real deal, set
// the saved cards so the ghost holds aces and wins at showdown. Rivers are
// J♥ (red) then 5♣ (black). The gateway and API still run unchanged.
const parse = text => text.split(" ").map(c => ({ rank: Number(c.slice(0, -1)), suit: c.slice(-1) }));
const key = c => `${c.rank}${c.suit}`;
async function stackGhostWin(view) {
  const state = await api.store.get(view.id);
  const [alpha, beta] = state.seats;
  alpha.cards = parse("2s 7d"); beta.cards = parse("3h 8c"); state.ghostCards = parse("14s 14d");
  const head = parse("6h 14h 13c 4d 6d 9s 6c 11h 6s 5c");
  const used = new Set([...alpha.cards, ...beta.cards, ...state.ghostCards, ...head].map(key));
  state.deck = [...head, ...["c", "d", "h", "s"].flatMap(suit => Array.from({ length: 13 }, (_, i) => ({ rank: i + 2, suit }))).filter(c => !used.has(key(c)))];
  state.handRecord.players.find(p => p.seat === alpha.seat).cards = alpha.cards;
  state.handRecord.players.find(p => p.seat === beta.seat).cards = beta.cards;
  state.version++;
  assert.equal(await api.store.save(state, view.version), true);
}

const modes = [
  ["holdem", { gameMode: "holdem" }],
  ["red-river-holdem", { gameMode: "red-river-holdem" }],
  ["red-river-holdem with ghost", { gameMode: "red-river-holdem", ghost: true }],
];
for (const [label, mode] of modes) test(`${label}: two remote clients play two hands, reconnect, and read archives`, { timeout: 120000 }, async () => {
  const host = `gateway-host-${randomUUID()}`;
  let view = await api.service.create(host, { ...mode, name: "Remote match", maxPlayers: 6, smallBlind: 5, bigBlind: 10, startingStack: 1000, turnSeconds: 120 });
  const grants = [];
  for (const name of ["Alpha", "Beta"]) { const grant = await api.service.issueAgent(view.id, host, view.version, randomUUID(), name); grants.push(grant); view = grant.table; }
  const clients = [await connect(gateway.endpoint, grants[0].token, "alpha"), await connect(gateway.endpoint, grants[1].token, "beta")];
  try {
    assert.equal(clients[0].getServerVersion().name, "shipinspector-poker");
    assert.deepEqual((await clients[0].listTools()).tools.map(t => t.name).sort(), TOOLS);
    assert.deepEqual((await clients[1].listResources()).resources.map(r => r.uri), ["poker://rules"]);
    const rules = (await clients[1].readResource({ uri: "poker://rules" })).contents[0].text;
    assert.match(rules, /no cash value/);
    assert.match(rules, mode.gameMode === "holdem" ? /No-limit Texas Hold'em/ : /Red River Hold'em/);
    if (mode.ghost) assert.match(rules, /Ghost modifier/); else assert.doesNotMatch(rules, /Ghost/);
    const calls = clients.map(caller);
    const seatOf = [];
    for (let i = 0; i < 2; i++) { const own = await calls[i]("poker_get_table"); seatOf[i] = own.yourSeat; }
    assert.notEqual(seatOf[0], seatOf[1]);
    const clientFor = seat => seatOf.indexOf(seat);
    for (let hand = 1; hand <= 2; hand++) {
      for (let i = 0; i < 2; i++) {
        view = await calls[i]("poker_get_table");
        view = await calls[i]("poker_ready", { version: view.version, requestId: (await calls[i]("poker_request_id")).requestId, ready: true });
      }
      view = await calls[hand - 1]("poker_deal", { version: view.version, requestId: randomUUID() });
      assert.equal(view.handNumber, hand);
      if (mode.ghost && hand === 1) await stackGhostWin(view);
      if (mode.ghost && hand === 2) assert.equal(view.ghost.deadMoney, 20);
      // Both clients read at once; each sees only its own hole cards.
      const seen = await Promise.all([calls[0]("poker_get_table"), calls[1]("poker_get_table")]);
      for (let i = 0; i < 2; i++) {
        assert.equal(seen[i].yourSeat, seatOf[i]);
        assert.equal(seen[i].seats.find(s => s.seat === seatOf[i]).cards.length, 2);
        assert.equal(seen[i].seats.find(s => s.seat === seatOf[1 - i]).cards.length, 0);
        assert.ok(!/"deck"|ghostCards|si_agent_/.test(JSON.stringify(seen[i])));
        if (mode.ghost) assert.deepEqual(seen[i].ghost.cards, []);
      }
      const startStacks = Object.fromEntries(seen[0].seats.map(s => [s.seat, s.stack + s.committed]));
      view = seen[0];
      let actions = 0;
      while (view.street !== "complete" && actions++ < 60) {
        const i = clientFor(view.actor);
        view = await calls[i]("poker_wait_for_turn", { seconds: 5 });
        if (view.street === "complete") break;
        assert.equal(view.yourSeat, view.actor);
        if (mode.ghost) assert.deepEqual(view.ghost.cards, []);
        view = await calls[i]("poker_act", { version: view.version, requestId: randomUUID(), action: view.legal.check ? "check" : "call" });
      }
      assert.equal(view.street, "complete");
      // Both players reached showdown, so the ghost (if any) and both hands show.
      assert.equal(view.seats.every(s => s.cards.length === 2), true);
      if (mode.ghost && hand === 1) {
        assert.deepEqual(view.awards, [{ amount: 20, winners: [], ghost: { amount: 20, hand: "Three of a kind" } }]);
        assert.deepEqual(view.ghost, { carry: 20, deadMoney: 0, hasCards: true, cards: parse("14s 14d") });
      }
      const carry = view.ghost?.carry ?? 0;
      assert.equal(view.seats.reduce((sum, s) => sum + s.stack, 0) + carry, 2000);
      const records = await Promise.all([calls[0]("poker_get_hand", { handNumber: hand }), calls[1]("poker_get_hand", { handNumber: hand })]);
      for (let i = 0; i < 2; i++) {
        const record = records[i];
        assert.equal(record.handNumber, hand); assert.equal(record.gameMode, mode.gameMode);
        assert.deepEqual(record.events.filter(e => e.type === "deal").flatMap(e => e.cards), view.board);
        assert.equal(record.players.find(p => p.isYou).seat, seatOf[i]);
        let netTotal = 0;
        for (const seat of seatOf) {
          const net = eventNet(record, seat);
          assert.equal(net, view.seats.find(s => s.seat === seat).stack - startStacks[seat], `event net for seat ${seat}`);
          netTotal += net;
        }
        const dead = record.events.find(e => e.type === "dead-money")?.amount ?? 0;
        assert.equal(netTotal + ghostTake(record), dead);
        if (mode.ghost) assert.equal(record.events.find(e => e.type === "end").ghostCarry, carry);
      }
      if (hand === 1) {
        // Reconnect: a new client with the same credential gets the same seat.
        await clients[0].close();
        clients[0] = await connect(gateway.endpoint, grants[0].token, "alpha-again");
        calls[0] = caller(clients[0]);
        const again = await calls[0]("poker_get_table");
        assert.equal(again.yourSeat, seatOf[0]);
        assert.equal(again.seats.find(s => s.seat === seatOf[0]).name, "Alpha");
      }
    }
    // Archived records are durable in the database, not only in the view.
    for (const n of [1, 2]) assert.equal((await api.store.getHandRecord(view.id, n)).handNumber, n);
    // Every call the gateway made announced the full rule set and used a fixed table path.
    const mine = api.calls.filter(c => c.path.includes(view.id));
    assert.ok(mine.length > 0);
    for (const c of mine) {
      assert.equal(c.rules, "holdem:1,red-river-holdem:1,ghost:1");
      assert.match(c.path, new RegExp(`^/api/tables/${view.id}(/session|/commands|/hands/\\d+)?$`));
    }
  } finally { await Promise.all(clients.map(c => c.close())); }
});

// The command that ends a hand also pays the pots, moves the ghost's chips,
// and archives the hand. Replaying it exactly must change none of that.
test("an exact retry of the hand's final command changes no stacks, awards, ghost carry, or archive", { timeout: 120000 }, async () => {
  const host = `gateway-retry-${randomUUID()}`;
  let view = await api.service.create(host, { gameMode: "red-river-holdem", ghost: true, name: "Final retry", maxPlayers: 2, smallBlind: 5, bigBlind: 10, startingStack: 1000, turnSeconds: 120 });
  const grants = [];
  for (const name of ["Alpha", "Beta"]) { const grant = await api.service.issueAgent(view.id, host, view.version, randomUUID(), name); grants.push(grant); view = grant.table; }
  const clients = [await connect(gateway.endpoint, grants[0].token, "alpha"), await connect(gateway.endpoint, grants[1].token, "beta")];
  try {
    const calls = clients.map(caller);
    const seatOf = [];
    for (let i = 0; i < 2; i++) {
      view = await calls[i]("poker_get_table"); seatOf[i] = view.yourSeat;
      view = await calls[i]("poker_ready", { version: view.version, requestId: randomUUID(), ready: true });
    }
    view = await calls[0]("poker_deal", { version: view.version, requestId: randomUUID() });
    await stackGhostWin(view);
    view = await calls[0]("poker_get_table");
    let last;
    for (let actions = 0; view.street !== "complete" && actions < 60; actions++) {
      const i = seatOf.indexOf(view.actor);
      view = await calls[i]("poker_wait_for_turn", { seconds: 5 });
      if (view.street === "complete") break;
      const args = { version: view.version, requestId: randomUUID(), action: view.legal.check ? "check" : "call" };
      view = await calls[i]("poker_act", args);
      last = { i, args, result: view };
    }
    // The kept command is the one that completed the hand and paid the ghost.
    assert.equal(last.result.street, "complete");
    assert.deepEqual(last.result.awards, [{ amount: 20, winners: [], ghost: { amount: 20, hand: "Three of a kind" } }]);
    assert.equal(last.result.ghost.carry, 20);
    const stacks = v => v.seats.map(s => [s.seat, s.stack]);
    const archive = async () => (await api.store.query("SELECT hand_number, record FROM poker_hand_records WHERE table_id = $1 ORDER BY hand_number", [view.id]));
    const saved = await api.store.get(view.id);
    const archived = await archive();
    assert.equal(archived.length, 1);
    // Replay the final command unchanged: on the same connection, then from a new one.
    clients.push(await connect(gateway.endpoint, grants[last.i].token, "replay"));
    for (const call of [calls[last.i], caller(clients[2])]) {
      const retry = await call("poker_act", last.args);
      assert.equal(retry.version, last.result.version);
      assert.equal(retry.street, "complete");
      assert.deepEqual(stacks(retry), stacks(last.result));
      assert.deepEqual(retry.awards, last.result.awards);
      assert.deepEqual(retry.ghost, last.result.ghost);
    }
    const after = await api.store.get(view.id);
    assert.equal(after.version, saved.version);
    assert.deepEqual(after.seats.map(s => [s.seat, s.stack]), saved.seats.map(s => [s.seat, s.stack]));
    assert.equal(saved.ghostCarry, 20);
    assert.equal(after.ghostCarry, saved.ghostCarry);
    assert.equal(after.deadMoney, saved.deadMoney);
    assert.deepEqual(await archive(), archived);
    // Chips are conserved, and the one archive agrees with the stacks.
    assert.equal(last.result.seats.reduce((sum, s) => sum + s.stack, 0) + last.result.ghost.carry, 2000);
    const record = await calls[0]("poker_get_hand", { handNumber: 1 });
    assert.equal(record.events.filter(e => e.type === "end").length, 1);
    assert.equal(record.events.filter(e => e.type === "award").length, 1);
    assert.equal(ghostTake(record), 20);
    for (const seat of seatOf) assert.equal(eventNet(record, seat), last.result.seats.find(s => s.seat === seat).stack - 1000);
  } finally { await Promise.all(clients.map(c => c.close())); }
});

test("gateway logs never hold credentials, cards, or request bodies", () => {
  const logs = gateway.logs();
  assert.match(logs, /"event":"request"/);
  assert.doesNotMatch(logs, /si_agent_|Bearer|"rank"|"suit"|requestId|Authorization/i);
});
