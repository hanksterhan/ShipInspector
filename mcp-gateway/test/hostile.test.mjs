// Gateway behaviour in local workerd with a hostile upstream, tight rate
// limits, missing bindings, unsafe settings, and an allowed browser origin.
//
// The "hostile upstream" is an ISOLATED NETWORK MOCK: a local HTTP server that
// returns redirects, HTML, leaks, and oversized bodies. Its replies are never
// used as evidence of gameplay; the play and CPU tests use the real API.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { randomBytes, randomUUID } from "node:crypto";
import { caller, connect, freePort, initialize, rpc, startApi, startGateway, variantConfig } from "./harness.mjs";

const tokenFor = id => `si_agent_${id}.${randomBytes(32).toString("hex")}`;
const LEAK = "TypeError: cannot read x at /var/task/api/index.js:12 si_agent_00000000-0000-0000-0000-000000000000.deadbeef";

async function listen(handler) {
  const port = await freePort();
  const server = createServer(handler);
  await new Promise(resolve => server.listen(port, "127.0.0.1", resolve));
  return { url: `http://127.0.0.1:${port}`, close: () => { server.closeAllConnections(); return new Promise(resolve => server.close(resolve)); } };
}

let api;
before(async () => { api = await startApi(); }, { timeout: 30000 });
after(async () => { await api?.close(); });

test("hostile upstream: redirects, HTML, leaks, and oversized replies never reach the client", { timeout: 90000 }, async () => {
  const attackerHits = []; const seen = [];
  const attacker = await listen((req, res) => { attackerHits.push(req.url); res.end("{}"); });
  const scenarios = new Map();
  const upstream = await listen((req, res) => {
    const [, , , id, rest = ""] = req.url.split("/");
    seen.push({ method: req.method, url: req.url, authorization: req.headers.authorization, rules: req.headers["x-poker-rules"] });
    const scenario = scenarios.get(id) || {};
    const kind = rest === "session" ? scenario.session || "ok" : rest === "commands" ? scenario.commands || "ok" : scenario.table || "ok";
    const send = (status, type, body, headers = {}) => { res.writeHead(status, { "Content-Type": type, ...headers }); res.end(body); };
    if (kind === "ok") return send(200, "application/json", rest === "session" ? '{"authorized":true}' : JSON.stringify({ id, version: 1, street: "waiting", seats: [], legal: null, closed: false }));
    if (kind === "redirect") return send(307, "application/json", "{}", { Location: `${attacker.url}/steal?from=${id}` });
    if (kind === "html") return send(200, "text/html", "<!doctype html><html><body>Vercel error page</body></html>");
    if (kind === "leak") return send(500, "application/json", JSON.stringify({ error: LEAK, stack: LEAK }));
    if (kind === "script") return send(400, "application/json", JSON.stringify({ error: "<script>alert(1)</script>" }));
    if (kind === "conflict") return send(409, "application/json", JSON.stringify({ error: "The table changed. Refresh before acting." }));
    if (kind === "huge") return send(200, "application/json", JSON.stringify({ pad: "x".repeat(600 * 1024) }));
    if (kind === "array") return send(200, "application/json", "[1,2,3]");
    if (kind === "drop") return req.socket.destroy();
  });
  const gateway = await startGateway({ upstream: upstream.url });
  try {
    // The credential check itself fails safely.
    for (const kind of ["redirect", "html", "leak", "huge"]) {
      const id = randomUUID(); scenarios.set(id, { session: kind });
      const response = await rpc(gateway.endpoint, initialize, { token: tokenFor(id) });
      const text = await response.text();
      assert.equal(response.status, 502, kind);
      assert.doesNotMatch(text, /steal|<html|TypeError|var\/task|si_agent_|x{50}/, kind);
    }
    // Tool calls fail safely with fixed messages.
    const expectations = { redirect: /unexpected response/, html: /unexpected response/, leak: /unavailable/, script: /refused the request \(400\)/,
      conflict: /^The table changed\. Refresh before acting\.$/, huge: /unexpected response/, array: /unexpected response/ };
    for (const [kind, pattern] of Object.entries(expectations)) {
      const id = randomUUID(); scenarios.set(id, { table: kind });
      const client = await connect(gateway.endpoint, tokenFor(id));
      try {
        const result = await client.callTool({ name: "poker_get_table", arguments: {} });
        assert.equal(result.isError, true, kind);
        assert.match(result.content[0].text, pattern, kind);
        assert.doesNotMatch(result.content[0].text, /steal|<|TypeError|var\/task|si_agent_/, kind);
      } finally { await client.close(); }
    }
    // A lost command is not retried; the agent decides, with the same requestId.
    const id = randomUUID(); scenarios.set(id, { commands: "drop" });
    const client = await connect(gateway.endpoint, tokenFor(id));
    try {
      const before = seen.filter(s => s.url.endsWith("/commands")).length;
      const result = await client.callTool({ name: "poker_act", arguments: { version: 1, requestId: randomUUID(), action: "check" } });
      assert.equal(result.isError, true);
      assert.match(result.content[0].text, /Retry with the same requestId/);
      assert.equal(seen.filter(s => s.url.endsWith("/commands")).length - before, 1);
    } finally { await client.close(); }
    assert.deepEqual(attackerHits, []);
    // The gateway sent each request to a fixed path, with the agent's own credential.
    for (const s of seen) {
      assert.match(s.url, /^\/api\/tables\/[0-9a-f-]{36}(\/session|\/commands)?$/);
      assert.equal(s.rules, "holdem:1,red-river-holdem:1,ghost:1");
      assert.equal(s.authorization, `Bearer si_agent_${s.url.split("/")[3]}.${s.authorization.split(".")[1]}`);
    }
    assert.doesNotMatch(gateway.logs(), /si_agent_|steal|TypeError|var\/task/);
  } finally { await gateway.stop("hostile"); await upstream.close(); await attacker.close(); }
});

test("rate-limit bindings return 429 for addresses, credentials, and table API calls", { timeout: 90000 }, async () => {
  const config = variantConfig("tight", text => text
    .replace("simple = { limit = 600, period = 60 }", "simple = { limit = 40, period = 60 }")
    .replace("simple = { limit = 120, period = 60 }", "simple = { limit = 4, period = 60 }")
    .replace("simple = { limit = 200, period = 60 }", "simple = { limit = 6, period = 60 }"));
  const gateway = await startGateway({ upstream: api.url, config });
  try {
    const host = `limits-${randomUUID()}`;
    let view = await api.service.create(host, { name: "Limits", maxPlayers: 4, smallBlind: 5, bigBlind: 10, startingStack: 1000, turnSeconds: 120 });
    const grants = [];
    for (const name of ["A", "B", "C", "D"]) { const grant = await api.service.issueAgent(view.id, host, view.version, randomUUID(), name); grants.push(grant); view = grant.table; }
    // B and C play a hand (set up directly through the service), so D's wait keeps polling.
    for (const g of [grants[1], grants[2]]) view = await api.service.command(view.id, { token: g.token }, { version: view.version, requestId: randomUUID(), command: { type: "ready", ready: true } });
    view = await api.service.command(view.id, { token: grants[1].token }, { version: view.version, requestId: randomUUID(), command: { type: "deal" } });
    // Credential limit: four MCP requests a minute for this test.
    const a = `Bearer ${grants[0].token}`;
    const statuses = [];
    for (let i = 0; i < 6; i++) statuses.push((await rpc(gateway.endpoint, initialize, { token: grants[0].token })).status);
    assert.deepEqual(statuses.slice(0, 4), [200, 200, 200, 200]);
    assert.deepEqual(statuses.slice(4), [429, 429]);
    assert.equal(api.calls.filter(c => c.authorization === a).length, 4);
    const limited = await rpc(gateway.endpoint, initialize, { token: grants[0].token });
    assert.equal(limited.headers.get("retry-after"), "60");
    // Another credential has its own bucket.
    assert.equal((await rpc(gateway.endpoint, initialize, { token: grants[1].token })).status, 200);
    // Table API limit: six calls a minute. One wait cannot exceed it.
    const d = `Bearer ${grants[3].token}`;
    const wait = await rpc(gateway.endpoint, { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "poker_wait_for_turn", arguments: { seconds: 15 } } }, { token: grants[3].token, headers: { "Mcp-Protocol-Version": "2025-06-18" } });
    const result = (await wait.json()).result;
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /Too many poker API calls/);
    assert.equal(api.calls.filter(c => c.authorization === d).length, 6);
    // Address limit: spoofed address headers do not open a new bucket locally.
    let status = 200; let sent = 0;
    while (status !== 429 && sent < 60) {
      status = (await fetch(`${gateway.url}/llms.txt`, { headers: { "CF-Connecting-IP": `203.0.113.${sent}`, "X-Forwarded-For": `198.51.100.${sent}` } })).status; sent++;
    }
    assert.equal(status, 429);
    assert.ok(sent <= 40, `sent ${sent}`);
    const mark = api.calls.length;
    assert.equal((await rpc(gateway.endpoint, initialize, { token: grants[2].token })).status, 429);
    assert.equal(api.calls.length, mark);
  } finally { await gateway.stop("tight-limits"); }
});

test("a missing rate-limit binding fails closed without calling the API", { timeout: 60000 }, async () => {
  const config = variantConfig("missing-binding", text => {
    const block = '[[ratelimits]]\nname = "GATEWAY_UPSTREAM_LIMITER"\nnamespace_id = "41004"\nsimple = { limit = 3000, period = 60 }\n';
    assert.ok(text.includes(block));
    return text.replace(block, "");
  });
  const gateway = await startGateway({ upstream: api.url, config, ready: 503 });
  try {
    const host = `missing-${randomUUID()}`;
    const view = await api.service.create(host, { name: "Missing", maxPlayers: 2, smallBlind: 5, bigBlind: 10, startingStack: 1000, turnSeconds: 120 });
    const grant = await api.service.issueAgent(view.id, host, view.version, randomUUID(), "A");
    const mark = api.calls.length;
    const response = await rpc(gateway.endpoint, initialize, { token: grant.token });
    assert.equal(response.status, 503);
    assert.match((await response.json()).error.message, /not configured/);
    assert.equal((await fetch(`${gateway.url}/`)).status, 503);
    assert.equal(api.calls.length, mark);
    assert.match(await gateway.waitForLog(/config_error/), /"event":"config_error","setting":"GATEWAY_UPSTREAM_LIMITER"/);
  } finally { await gateway.stop("missing-binding"); }
});

test("unsafe upstream settings fail closed without echoing their value", { timeout: 90000 }, async () => {
  for (const upstream of ["http://user:hunter2secret@127.0.0.1:9", "http://example.com", "https://www.sipoker.club/api", "https://www.sipoker.club?next=hunter2secret", "ftp://127.0.0.1"]) {
    const gateway = await startGateway({ upstream, ready: 503 });
    try {
      const response = await rpc(gateway.endpoint, initialize, { token: tokenFor(randomUUID()) });
      assert.equal(response.status, 503, upstream);
      assert.match(await gateway.waitForLog(/config_error/), /"setting":"UPSTREAM_ORIGIN"/);
      assert.doesNotMatch(gateway.logs().replace(/env\.UPSTREAM_ORIGIN \("\(hidden\)"\)/, ""), /hunter2secret|example\.com/);
    } finally { await gateway.stop(); }
  }
});

test("an exactly configured browser origin gets CORS without credentials mode", { timeout: 60000 }, async () => {
  const gateway = await startGateway({ upstream: api.url, vars: { ALLOWED_ORIGINS: "http://localhost:4000" } });
  try {
    const host = `origin-${randomUUID()}`;
    const view = await api.service.create(host, { name: "Origin", maxPlayers: 2, smallBlind: 5, bigBlind: 10, startingStack: 1000, turnSeconds: 120 });
    const grant = await api.service.issueAgent(view.id, host, view.version, randomUUID(), "A");
    const preflight = await fetch(gateway.endpoint, { method: "OPTIONS", headers: { Origin: "http://localhost:4000", "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "authorization, content-type" } });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get("access-control-allow-origin"), "http://localhost:4000");
    assert.equal(preflight.headers.get("access-control-allow-credentials"), null);
    assert.match(preflight.headers.get("access-control-allow-headers"), /Authorization/);
    const ok = await rpc(gateway.endpoint, initialize, { token: grant.token, headers: { Origin: "http://localhost:4000" } });
    assert.equal(ok.status, 200);
    assert.equal(ok.headers.get("access-control-allow-origin"), "http://localhost:4000");
    assert.equal(ok.headers.get("vary"), "Origin");
    for (const origin of ["http://localhost:4000.evil.example", "http://localhost:40001", "https://localhost:4000", "http://localhost"]) {
      assert.equal((await rpc(gateway.endpoint, initialize, { token: grant.token, headers: { Origin: origin } })).status, 403, origin);
    }
    // A client without Origin still works, and gets no CORS header.
    const plain = await connect(gateway.endpoint, grant.token);
    try { assert.equal((await caller(plain)("poker_get_table")).id, view.id); } finally { await plain.close(); }
  } finally { await gateway.stop("allowed-origin"); }
});
