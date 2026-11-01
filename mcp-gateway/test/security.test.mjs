// Security checks against the gateway in local workerd and the real API.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { caller, connect, initialize, rawHttp, rpc, startApi, startGateway } from "./harness.mjs";

let api; let gateway;
before(async () => { api = await startApi(); gateway = await startGateway({ upstream: api.url }); }, { timeout: 90000 });
after(async () => { await gateway?.stop("security"); await api?.close(); }, { timeout: 15000 });

const settings = { name: "Security", maxPlayers: 6, smallBlind: 5, bigBlind: 10, startingStack: 1000, turnSeconds: 120 };
async function table(names = ["Alpha", "Beta"], extra = {}) {
  const host = `security-host-${randomUUID()}`;
  let view = await api.service.create(host, { ...settings, ...extra });
  const grants = [];
  for (const name of names) { const grant = await api.service.issueAgent(view.id, host, view.version, randomUUID(), name); grants.push(grant); view = grant.table; }
  return { host, view, grants };
}
// Table API calls made since `mark`.
const since = mark => api.calls.slice(mark);
const body = async response => ({ status: response.status, headers: response.headers, json: await response.json().catch(() => null) });

test("rejects missing, malformed, and oversized credentials without calling the API", async () => {
  const mark = api.calls.length;
  const { grants } = await table(["Solo"]);
  const good = grants[0].token;
  // Node trims trailing header spaces in transit, so that case is not listed.
  const cases = [undefined, "", "Bearer", `Basic ${good}`, `bearer ${good}`, `Bearer  ${good}`, `Bearer ${good.toUpperCase()}`,
    `Bearer ${good}0`, `Bearer si_agent_not-a-uuid.${"a".repeat(64)}`, `Bearer ${"x".repeat(8000)}`];
  for (const authorization of cases) {
    const response = await rawHttp(gateway.endpoint, { headers: { Host: new URL(gateway.url).host, "Content-Type": "application/json", Accept: "application/json, text/event-stream",
      ...(authorization === undefined ? {} : { Authorization: authorization }) }, chunks: [JSON.stringify(initialize)] });
    assert.equal(response.status, 401, String(authorization).slice(0, 40));
    assert.match(response.headers["www-authenticate"], /^Bearer realm=/);
    assert.doesNotMatch(response.headers["www-authenticate"], /resource_metadata|authorization_uri/);
    assert.doesNotMatch(response.body, /si_agent_/);
  }
  assert.equal(since(mark).filter(c => c.path.startsWith("/api/tables/")).length, 0);
});

test("checks well-formed credentials with the API: unknown secret, wrong table, expired, revoked", async () => {
  const a = await table(["Alpha"]); const b = await table(["Beta"]);
  const secretOf = token => token.split(".")[1];
  const forged = [`si_agent_${a.view.id}.${randomBytes(32).toString("hex")}`, `si_agent_${b.view.id}.${secretOf(a.grants[0].token)}`, `si_agent_${randomUUID()}.${secretOf(a.grants[0].token)}`];
  for (const token of forged) {
    const mark = api.calls.length;
    const response = await body(await rpc(gateway.endpoint, initialize, { token }));
    assert.equal(response.status, 401);
    assert.deepEqual(since(mark).map(c => c.path), [`/api/tables/${token.slice(9, 45)}/session`]);
  }
  // Labelled fixture: move the saved expiry into the past, as seven days would.
  const state = await api.store.get(b.view.id);
  state.agents[0].expiresAt = Date.now() - 1; state.version++;
  assert.equal(await api.store.save(state, state.version - 1), true);
  assert.equal((await rpc(gateway.endpoint, initialize, { token: b.grants[0].token })).status, 401);
  const ok = await body(await rpc(gateway.endpoint, initialize, { token: a.grants[0].token }));
  assert.equal(ok.status, 200);
  // Initialize reveals the server, not the table.
  assert.equal(ok.json.result.serverInfo.name, "shipinspector-poker");
  assert.doesNotMatch(JSON.stringify(ok.json), new RegExp(`${a.view.id}|Alpha|Security`));
  assert.equal(ok.headers.get("mcp-session-id"), null);
  assert.equal(ok.headers.get("cache-control"), "no-store");
});

test("a revoked credential stops working on the next request of an open connection", async () => {
  const { host, grants } = await table(["Alpha", "Beta"]);
  const client = await connect(gateway.endpoint, grants[0].token);
  const other = await connect(gateway.endpoint, grants[1].token);
  try {
    const view = await caller(client)("poker_get_table");
    assert.equal((await client.listTools()).tools.length, 9);
    await api.service.revokeAgent(view.id, host, view.version, randomUUID(), grants[0].agentId);
    // Metadata, resources, tools, and pings all check the credential again.
    await assert.rejects(client.listTools(), /401|invalid, expired, or revoked/);
    await assert.rejects(client.readResource({ uri: "poker://rules" }), /401|invalid, expired, or revoked/);
    await assert.rejects(client.callTool({ name: "poker_request_id", arguments: {} }), /401|invalid, expired, or revoked/);
    await assert.rejects(client.ping(), /401|invalid, expired, or revoked/);
    await assert.rejects(connect(gateway.endpoint, grants[0].token), /401|invalid, expired, or revoked/);
    // The other seat on the same table still works.
    assert.equal((await caller(other)("poker_get_table")).yourSeat, grants[1].table.agents[1].seat);
  } finally { await client.close(); await other.close(); }
});

test("concurrent requests from many credentials never share a seat or cards", { timeout: 60000 }, async () => {
  const tables = [await table(["A1", "A2"]), await table(["B1", "B2"], { gameMode: "red-river-holdem", ghost: true })];
  const players = [];
  for (const t of tables) {
    for (const grant of t.grants) {
      const client = await connect(gateway.endpoint, grant.token);
      players.push({ client, call: caller(client), table: t.view.id, seat: grant.table.agents.find(a => a.id === grant.agentId).seat });
    }
    let v;
    for (const p of players.filter(p => p.table === t.view.id)) { v = await p.call("poker_get_table"); v = await p.call("poker_ready", { version: v.version, requestId: randomUUID(), ready: true }); }
    await players.find(p => p.table === t.view.id).call("poker_deal", { version: v.version, requestId: randomUUID() });
  }
  try {
    const own = new Map();
    const results = await Promise.all(Array.from({ length: 48 }, (_, i) => players[i % 4]).map(async p => ({ p, view: await p.call("poker_get_table") })));
    for (const { p, view } of results) {
      assert.equal(view.id, p.table); assert.equal(view.yourSeat, p.seat);
      const mine = view.seats.find(s => s.seat === p.seat).cards;
      assert.equal(mine.length, 2);
      for (const s of view.seats) if (s.seat !== p.seat) assert.deepEqual(s.cards, []);
      const key = `${p.table}:${p.seat}`;
      if (own.has(key)) assert.deepEqual(own.get(key), mine); else own.set(key, mine);
    }
    assert.equal(own.size, 4);
  } finally { await Promise.all(players.map(p => p.client.close())); }
});

test("checks Host and Origin exactly", async () => {
  const mark = api.calls.length;
  const { grants } = await table(["Solo"]);
  const port = new URL(gateway.url).port;
  const hosts = ["evil.example", `evil.example:${port}`, "127.0.0.1", `127.0.0.1:${Number(port) + 1}`, `www.sipoker.club:${port}`, "mcp.sipoker.club"];
  for (const host of hosts) {
    const response = await rawHttp(gateway.endpoint, { headers: { Host: host, Authorization: `Bearer ${grants[0].token}`, "Content-Type": "application/json", Accept: "application/json, text/event-stream" }, chunks: [JSON.stringify(initialize)] });
    assert.equal(response.status, 421, host);
    assert.equal((await rawHttp(`${gateway.url}/llms.txt`, { method: "GET", headers: { Host: host } })).status, 421);
  }
  // workerd itself refuses a Host that cannot form a URL, before the Worker runs.
  for (const host of [`127.0.0.1:${port}.evil.example`, `127.0.0.1:${port}@evil.example`]) {
    const response = await rawHttp(gateway.endpoint, { headers: { Host: host, Authorization: `Bearer ${grants[0].token}`, "Content-Type": "application/json", Accept: "application/json, text/event-stream" }, chunks: [JSON.stringify(initialize)] });
    assert.ok([400, 421, 500].includes(response.status), `${host}: ${response.status}`);
    assert.doesNotMatch(response.body, /si_agent_|serverInfo/);
  }
  for (const origin of ["https://evil.example", "null", `http://127.0.0.1:${port}.evil.example`, `http://127.0.0.1:${port}`, "https://www.sipoker.club"]) {
    const response = await rpc(gateway.endpoint, initialize, { token: grants[0].token, headers: { Origin: origin } });
    assert.equal(response.status, 403, origin);
    assert.equal(response.headers.get("access-control-allow-origin"), null);
    const preflight = await fetch(gateway.endpoint, { method: "OPTIONS", headers: { Origin: origin, "Access-Control-Request-Method": "POST" } });
    assert.equal(preflight.status, 403);
  }
  assert.equal(since(mark).filter(c => c.path.startsWith("/api/tables/")).length, 0);
});

test("rejects bad methods, media types, bodies, and messages before calling the API", async () => {
  const { grants } = await table(["Solo"]);
  const token = grants[0].token;
  const mark = api.calls.length;
  const auth = { Authorization: `Bearer ${token}` };
  const json = { "Content-Type": "application/json", Accept: "application/json, text/event-stream" };
  for (const method of ["GET", "DELETE", "PUT", "PATCH"]) {
    const response = await fetch(gateway.endpoint, { method, headers: { ...auth, Accept: "text/event-stream" } });
    assert.equal(response.status, 405, method); assert.equal(response.headers.get("allow"), "POST");
  }
  const cases = [
    [{ ...json, "Content-Type": "text/plain" }, JSON.stringify(initialize), 415],
    [{ ...json, "Content-Type": "application/jsonp" }, JSON.stringify(initialize), 415],
    [{ ...json, Accept: "application/json" }, JSON.stringify(initialize), 406],
    [{ ...json, "Mcp-Protocol-Version": "1999-01-01" }, JSON.stringify(initialize), 400],
    [json, "{not json", 400],
    [json, JSON.stringify([initialize]), 400],
    [json, JSON.stringify({ ...initialize, jsonrpc: "1.0" }), 400],
    [json, JSON.stringify("initialize"), 400],
    [json, "null", 400],
  ];
  for (const [headers, payload, status] of cases) {
    const response = await fetch(gateway.endpoint, { method: "POST", headers: { ...auth, ...headers }, body: payload });
    assert.equal(response.status, status, payload.slice(0, 30));
    assert.equal((await response.json()).jsonrpc, "2.0");
  }
  const host = new URL(gateway.url).host;
  // Declared too large, chunked too large, and invalid UTF-8.
  const big = JSON.stringify({ ...initialize, params: { ...initialize.params, pad: "x".repeat(70000) } });
  assert.equal((await fetch(gateway.endpoint, { method: "POST", headers: { ...auth, ...json }, body: big })).status, 413);
  const chunked = await rawHttp(gateway.endpoint, { headers: { Host: host, ...auth, ...json, "Transfer-Encoding": "chunked" }, chunks: Array.from({ length: 20 }, () => "x".repeat(4096)) });
  assert.equal(chunked.status, 413);
  const lying = await rawHttp(gateway.endpoint, { headers: { Host: host, ...auth, ...json, "Content-Length": "abc" }, chunks: [] }).catch(() => ({ status: 400 }));
  assert.ok([400, 413].includes(lying.status));
  const badUtf8 = await fetch(gateway.endpoint, { method: "POST", headers: { ...auth, ...json }, body: Buffer.from([0x7b, 0xff, 0xfe, 0x7d]) });
  assert.equal(badUtf8.status, 400);
  assert.equal(since(mark).length, 0);
  // A valid message with an unknown method reaches MCP and gets a JSON-RPC error.
  const unknown = await body(await rpc(gateway.endpoint, { jsonrpc: "2.0", id: 9, method: "tables/steal", params: {} }, { token, headers: { "Mcp-Protocol-Version": "2025-06-18" } }));
  assert.equal(unknown.json.error.code, -32601);
});

test("serves static discovery documents without calling the API", async () => {
  const mark = api.calls.length;
  const llms = await fetch(`${gateway.url}/llms.txt`);
  assert.equal(llms.status, 200);
  assert.equal(llms.headers.get("content-type"), "text/plain; charset=utf-8");
  const text = await llms.text();
  assert.match(text, /^# ShipInspector poker MCP server \(closed beta\)/);
  assert.ok(text.includes(gateway.endpoint));
  assert.match(text, /no cash value/); assert.match(text, /Authorization: Bearer YOUR_SEAT_CREDENTIAL/);
  assert.match(text, /does not add the server to any directory/); assert.match(text, /no OAuth/);
  assert.doesNotMatch(text, /si_agent_[0-9a-f]/);
  const home = await fetch(`${gateway.url}/`);
  assert.equal(home.headers.get("content-type"), "text/html; charset=utf-8");
  assert.match(home.headers.get("content-security-policy"), /default-src 'none'/);
  assert.match(await home.text(), /<h1>ShipInspector poker MCP server/);
  const head = await fetch(`${gateway.url}/llms.txt`, { method: "HEAD" });
  assert.equal(head.status, 200); assert.equal(await head.text(), "");
  assert.equal((await fetch(`${gateway.url}/llms.txt`, { method: "POST" })).status, 405);
  // No OAuth discovery is advertised, and unknown paths are plain 404s.
  for (const path of ["/.well-known/oauth-protected-resource", "/.well-known/oauth-authorization-server", "/authorize", "/index.html", "/mcp/extra", "/api/tables"]) {
    const response = await fetch(`${gateway.url}${path}`);
    assert.equal(response.status, 404, path); assert.equal(response.headers.get("content-type"), "text/plain; charset=utf-8");
  }
  assert.equal(since(mark).length, 0);
});

test("stale versions conflict and an exact retry applies once", async () => {
  const { grants } = await table(["Alpha", "Beta"]);
  const clients = await Promise.all(grants.map(g => connect(gateway.endpoint, g.token)));
  try {
    const calls = clients.map(caller);
    let v;
    for (const call of calls) { v = await call("poker_get_table"); v = await call("poker_ready", { version: v.version, requestId: randomUUID(), ready: true }); }
    v = await calls[0]("poker_deal", { version: v.version, requestId: randomUUID() });
    const seats = grants.map(g => g.table.agents.find(a => a.id === g.agentId).seat);
    const actor = seats.indexOf(v.actor);
    const command = { version: v.version, requestId: randomUUID(), action: "call" };
    const first = await calls[actor]("poker_act", command);
    const retry = await calls[actor]("poker_act", command);
    assert.equal(retry.version, first.version);
    const record = (await api.store.get(v.id)).handRecord.events.filter(e => e.type === "action");
    assert.equal(record.length, 1);
    const stale = await clients[1 - actor].callTool({ name: "poker_act", arguments: { version: v.version, requestId: randomUUID(), action: "check" } });
    assert.equal(stale.isError, true); assert.match(stale.content[0].text, /table changed|Refresh/);
    const reused = await clients[actor].callTool({ name: "poker_act", arguments: { ...command, action: "fold" } });
    assert.equal(reused.isError, true); assert.match(reused.content[0].text, /different action/);
    assert.equal((await api.store.get(v.id)).version, first.version);
  } finally { await Promise.all(clients.map(c => c.close())); }
});

test("a wait polls about once a second and stays within its call budget", { timeout: 60000 }, async () => {
  const { grants } = await table(["Alpha", "Beta"]);
  const clients = await Promise.all(grants.map(g => connect(gateway.endpoint, g.token)));
  try {
    const calls = clients.map(caller);
    let v;
    for (const call of calls) { v = await call("poker_get_table"); v = await call("poker_ready", { version: v.version, requestId: randomUUID(), ready: true }); }
    v = await calls[0]("poker_deal", { version: v.version, requestId: randomUUID() });
    const seats = grants.map(g => g.table.agents.find(a => a.id === g.agentId).seat);
    const waiter = 1 - seats.indexOf(v.actor);
    const mark = api.calls.length; const started = Date.now();
    const result = await calls[waiter]("poker_wait_for_turn", { seconds: 25 });
    const elapsed = Date.now() - started;
    assert.equal(result.legal, null);
    const used = since(mark).filter(c => c.authorization === `Bearer ${grants[waiter].token}`);
    // One credential check, then one poll a second for 25 seconds.
    assert.ok(elapsed >= 24000 && elapsed < 32000, `elapsed ${elapsed}`);
    assert.equal(used[0].path, `/api/tables/${v.id}/session`);
    assert.ok(used.length >= 20 && used.length <= 30, `upstream calls ${used.length}`);
    console.log(JSON.stringify({ wait: { seconds: 25, elapsedMs: elapsed, upstreamCalls: used.length } }));
  } finally { await Promise.all(clients.map(c => c.close())); }
});

// Local workerd does not report a client disconnect to the Worker (checked
// separately with a probe Worker), so this test cannot show early
// cancellation. It checks the hard bound instead: after a disconnect, polling
// ends at the wait's own deadline, within the call cap, with no extra command.
test("after a client disconnect, polling ends by the wait deadline and call cap", { timeout: 60000 }, async () => {
  const { grants } = await table(["Alpha", "Beta"]);
  const clients = await Promise.all(grants.map(g => connect(gateway.endpoint, g.token)));
  try {
    const calls = clients.map(caller);
    let v;
    for (const call of calls) { v = await call("poker_get_table"); v = await call("poker_ready", { version: v.version, requestId: randomUUID(), ready: true }); }
    v = await calls[0]("poker_deal", { version: v.version, requestId: randomUUID() });
    const seats = grants.map(g => g.table.agents.find(a => a.id === g.agentId).seat);
    const waiter = 1 - seats.indexOf(v.actor);
    const token = `Bearer ${grants[waiter].token}`;
    // A raw request, so the test controls the socket.
    const mark = api.calls.length; const started = Date.now();
    const abort = new AbortController();
    const pending = fetch(gateway.endpoint, { method: "POST", signal: abort.signal, headers: { Authorization: token, "Content-Type": "application/json", Accept: "application/json, text/event-stream", "Mcp-Protocol-Version": "2025-06-18" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "poker_wait_for_turn", arguments: { seconds: 8 } } }) }).catch(error => error);
    await new Promise(resolve => setTimeout(resolve, 2000));
    abort.abort();
    await pending;
    const atAbort = since(mark).filter(c => c.authorization === token).length;
    await new Promise(resolve => setTimeout(resolve, 10000));
    const mine = since(mark).filter(c => c.authorization === token);
    const last = Math.max(...mine.map(c => c.at)) - started;
    console.log(JSON.stringify({ disconnect: { waitSeconds: 8, callsAtAbort: atAbort, callsTotal: mine.length, lastCallMs: last } }));
    assert.ok(last < 9500, `last poll ${last} ms after start`);
    assert.ok(mine.length <= 11, `calls ${mine.length}`);
    assert.ok(mine.every(c => c.method === "GET"), "a disconnected wait sent a command");
    // The table is unchanged by the abandoned wait.
    assert.equal((await api.store.get(v.id)).version, v.version);
  } finally { await Promise.all(clients.map(c => c.close())); }
});

test("gateway logs hold no credentials, cards, or bodies", () => {
  const logs = gateway.logs();
  assert.match(logs, /"event":"request"/);
  assert.doesNotMatch(logs, /si_agent_|Bearer [a-z]|"rank"|"suit"|requestId|tables\/steal|x{100}/i);
});
