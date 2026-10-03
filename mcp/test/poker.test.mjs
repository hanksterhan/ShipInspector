import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { createPokerServer } from "../src/server.mjs";

const require = createRequire(new URL("../../api/package.json", import.meta.url));
process.env.POKER_STORE_DIR = "memory://";
process.env.NODE_ENV = "test";
const { getTableStore } = require("./dist/api/_lib/poker-table/store.js");
const { TableService } = require("./dist/api/_lib/poker-table/service.js");
const { tablesHandler } = require("./dist/api/_lib/handlers/tables/index.js");
const express = require("express");
let http; let service; let store; let apiUrl;
before(async () => {
  store = await getTableStore(); service = new TableService(store);
  const app = express(); app.use(express.json());
  app.use((req, _res, next) => { assert.equal(req.headers["x-poker-rules"], "holdem:1,red-river-holdem:1"); next(); });
  app.use(tablesHandler);
  http = await new Promise(resolve => { const server = app.listen(0, "127.0.0.1", () => resolve(server)); });
  apiUrl = `http://127.0.0.1:${http.address().port}`;
}, { timeout: 10000 });
after(async () => { if (http) { http.closeAllConnections(); await new Promise(resolve => http.close(resolve)); } }, { timeout: 5000 });

for (const gameMode of ["holdem", "red-river-holdem"]) test(`${gameMode}: two stdio clients play through HTTP with private cards`, { timeout: 30000 }, async () => {
  let view = await service.create("mcp-host", { gameMode, name: "Agent match", maxPlayers: 6, smallBlind: 5, bigBlind: 10, startingStack: 1000, turnSeconds: 60 });
  const grants = [];
  for (const name of ["Alpha", "Beta"]) {
    const grant = await service.issueAgent(view.id, "mcp-host", view.version, randomUUID(), name);
    grants.push(grant); view = grant.table;
  }
  const clients = [];
  try {
    for (const grant of grants) {
      const client = new Client({ name: "poker-test", version: "1.0.0" });
      clients.push(client);
      await client.connect(new StdioClientTransport({ command: process.execPath,
        args: [new URL("../src/index.mjs", import.meta.url).pathname],
        env: { ...process.env, SHIPINSPECTOR_API_URL: apiUrl, SHIPINSPECTOR_AGENT_TOKEN: grant.token }, stderr: "pipe" }), { timeout: 5000 });
    }
    const call = async (i, name, args = {}) => {
      const response = await clients[i].callTool({ name, arguments: args }, undefined, { timeout: 5000 });
      assert.ok(!response.isError, response.content?.[0]?.text);
      return response.structuredContent;
    };
    const names = (await clients[0].listTools({}, { timeout: 5000 })).tools.map(t => t.name);
    assert.ok(names.includes("poker_act")); assert.ok(names.includes("poker_wait_for_turn"));
    assert.match((await clients[0].readResource({ uri: "poker://rules" }, { timeout: 5000 })).contents[0].text, /no cash value/);
    for (let i = 0; i < 2; i++) {
      view = await call(i, "poker_get_table");
      view = await call(i, "poker_ready", { version: view.version, requestId: randomUUID(), ready: true });
    }
    view = await call(0, "poker_deal", { version: view.version, requestId: randomUUID() });
    if (gameMode === "red-river-holdem") {
      const state = await store.get(view.id);
      const available = [...state.deck]; const head = [];
      for (const color of ["any", "any", "any", "any", "any", "any", "any", "red", "any", "red", "any", "black"]) {
        const index = available.findIndex(c => color === "any" || (color === "red" ? ["h", "d"].includes(c.suit) : ["c", "s"].includes(c.suit)));
        head.push(...available.splice(index, 1));
      }
      state.deck = [...head, ...available]; state.version++;
      assert.equal(await store.save(state, view.version), true);
    }
    const observations = await Promise.all([call(0, "poker_get_table"), call(1, "poker_get_table")]);
    for (let i = 0; i < 2; i++) {
      assert.equal(observations[i].seats[i].cards.length, 2);
      assert.equal(observations[i].seats[1 - i].cards.length, 0);
      assert.ok(!JSON.stringify(observations[i]).includes('"deck"'));
    }
    const illegal = await clients[1].callTool({ name: "poker_act", arguments: { version: view.version, requestId: randomUUID(), action: "fold" } }, undefined, { timeout: 5000 });
    assert.equal(illegal.isError, true);
    view = observations[0];
    const streets = new Set(); const rivers = new Set(); let actions = 0;
    while (view.street !== "complete" && actions++ < 48) {
      const player = view.actor;
      view = await call(player, "poker_wait_for_turn", { seconds: 1 });
      streets.add(view.street);
      if (view.street === "river") rivers.add(view.riverNumber);
      const command = { version: view.version, requestId: randomUUID(), action: view.legal.check ? "check" : "call" };
      const laterRiver = view.roundId >= 5;
      view = await call(player, "poker_act", command);
      if (laterRiver) assert.equal((await call(player, "poker_act", command)).version, view.version);
    }
    assert.deepEqual([...streets], ["preflop", "flop", "turn", "river"]);
    assert.equal(view.street, "complete");
    if (gameMode === "red-river-holdem") {
      assert.deepEqual([...rivers], [1, 2, 3]); assert.equal(view.board.length, 7);
      assert.equal(view.terminalReason, "black-river");
      assert.match((await clients[0].readResource({ uri: "poker://rules" }, { timeout: 5000 })).contents[0].text, /Keep all board cards/);
    }
    const history = await call(0, "poker_get_hand", { handNumber: 1 });
    assert.equal(history.gameMode, gameMode);
    assert.deepEqual(history.events.filter(e => e.type === "deal").flatMap(e => e.cards), view.board);
    assert.equal(view.seats.reduce((sum, s) => sum + s.stack, 0), 2000);
    assert.equal(view.seats.every(s => s.cards.length === 2), true);
    const replay = await clients[0].callTool({ name: "poker_act", arguments: { version: 0, requestId: randomUUID(), action: "check" } }, undefined, { timeout: 5000 });
    assert.equal(replay.isError, true);
    await service.revokeAgent(view.id, "mcp-host", view.version, randomUUID(), grants[0].agentId);
    assert.equal((await clients[0].callTool({ name: "poker_get_table", arguments: {} }, undefined, { timeout: 5000 })).isError, true);
  } finally { await Promise.all(clients.map(c => c.close())); }
});
test("rejects remote cleartext transport and malformed credentials", () => {
  assert.throws(() => createPokerServer({ apiUrl: "http://example.com", token: "x" }), /HTTPS/);
  assert.throws(() => createPokerServer({ apiUrl, token: "x" }), /credential/);
});
