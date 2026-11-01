// One agent plays real CPU opponents through the gateway in local workerd.
// The CPUs use the production 1.4-second delay; only authenticated polls
// (the agent's waits) move them. No fixtures: real shuffles and real CPU play.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { caller, connect, eventNet, ghostTake, startApi, startGateway } from "./harness.mjs";

let api; let gateway;
before(async () => { api = await startApi(); gateway = await startGateway({ upstream: api.url }); }, { timeout: 90000 });
after(async () => { await gateway?.stop("cpu"); await api?.close(); }, { timeout: 15000 });

const scenarios = [
  ["holdem with ghost against three CPUs", { gameMode: "holdem", ghost: true }, ["aggressive", "passive", "balanced"], 3],
  ["red-river-holdem against two CPUs", { gameMode: "red-river-holdem" }, ["random", "aggressive"], 2],
];
for (const [label, mode, styles, hands] of scenarios) test(`agent vs CPU: ${label}`, { timeout: 300000 }, async () => {
  const host = `cpu-host-${randomUUID()}`;
  let view = await api.service.create(host, { ...mode, name: "CPU match", maxPlayers: 6, smallBlind: 5, bigBlind: 10, startingStack: 1000, turnSeconds: 120 });
  const grant = await api.service.issueAgent(view.id, host, view.version, randomUUID(), "Agent");
  view = await api.service.command(view.id, { userId: host }, { version: grant.table.version, requestId: randomUUID(), command: { type: "add-bots", styles } });
  const client = await connect(gateway.endpoint, grant.token, "cpu-agent");
  const call = caller(client);
  const summary = [];
  try {
    const rules = (await client.readResource({ uri: "poker://rules" })).contents[0].text;
    if (mode.ghost) assert.match(rules, /Ghost modifier/);
    for (let hand = 1; hand <= hands; hand++) {
      view = await call("poker_get_table");
      const me = view.yourSeat;
      if (view.seats.find(s => s.seat === me).stack === 0) view = await call("poker_refill", { version: view.version, requestId: randomUUID() });
      view = await call("poker_ready", { version: view.version, requestId: randomUUID(), ready: true });
      assert.equal(view.canDeal, true);
      const dealt = Date.now();
      view = await call("poker_deal", { version: view.version, requestId: randomUUID() });
      assert.equal(view.handNumber, hand);
      const cpuSeats = view.seats.filter(s => s.kind === "cpu").map(s => s.seat);
      assert.equal(cpuSeats.length, styles.length);
      let agentActions = 0; let polls = 0;
      while (view.street !== "complete") {
        view = await call("poker_wait_for_turn", { seconds: 25 });
        polls++;
        assert.ok(polls < 60, "hand did not finish");
        if (view.street === "complete") break;
        // During play the agent sees only its own hole cards.
        for (const s of view.seats) {
          if (s.seat === me) assert.equal(s.cards.length, s.status === "folded" ? 0 : 2);
          else assert.deepEqual(s.cards, []);
        }
        if (mode.ghost) assert.deepEqual(view.ghost.cards, []);
        if (view.legal && view.actor === me) {
          view = await call("poker_act", { version: view.version, requestId: randomUUID(), action: view.legal.check ? "check" : "call" });
          agentActions++;
        }
      }
      const elapsed = Date.now() - dealt;
      const record = await call("poker_get_hand", { handNumber: hand });
      const cpuActions = record.events.filter(e => e.type === "action" && cpuSeats.includes(e.seat));
      assert.ok(cpuActions.length > 0, "CPU actions were archived");
      // Each CPU move waits 1.4 s after its turn starts, and moves are sequential.
      assert.ok(elapsed >= 1400 * cpuActions.length, `elapsed ${elapsed} ms for ${cpuActions.length} CPU actions`);
      // The archive shows the agent its own cards and only cards revealed at showdown.
      const revealed = record.events.find(e => e.type === "end").revealedSeats;
      for (const p of record.players) {
        if (p.isYou) assert.equal(p.cards.length, 2);
        else if (!revealed.includes(p.seat)) assert.deepEqual(p.cards, []);
      }
      // Chips: event net matches the stack change for every player, and the hand conserves chips.
      const dead = record.events.find(e => e.type === "dead-money")?.amount ?? 0;
      // A ghost carryover enters the next hand's pot as dead money.
      assert.equal(dead, summary.at(-1)?.ghostCarry ?? 0);
      let netTotal = 0;
      for (const p of record.players) {
        const net = eventNet(record, p.seat);
        assert.equal(net, view.seats.find(s => s.seat === p.seat).stack - p.startingStack, `seat ${p.seat}`);
        netTotal += net;
      }
      const ghostCarry = mode.ghost ? record.events.find(e => e.type === "end").ghostCarry : 0;
      assert.equal(netTotal + ghostTake(record), dead);
      if (mode.ghost) assert.equal(view.ghost.carry, ghostCarry);
      const start = record.players.reduce((sum, p) => sum + p.startingStack, 0);
      const end = record.players.reduce((sum, p) => sum + view.seats.find(s => s.seat === p.seat).stack, 0);
      assert.equal(end + ghostCarry, start + dead);
      assert.ok((await api.store.getHandRecord(view.id, hand)) !== null);
      summary.push({ hand, elapsedMs: elapsed, cpuActions: cpuActions.length, agentActions, terminal: record.events.find(e => e.type === "end").reason, ghostCarry, dead });
    }
    console.log(JSON.stringify({ scenario: label, hands: summary }));
  } finally { await client.close(); }
});
