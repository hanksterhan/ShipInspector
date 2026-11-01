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
    const expectations = { redirect: /unexpected response/, html: /unexpected response/, leak: /unavailable/, script: /^The poker API refused this request\. Read the table and check your action\.$/,
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

// ISOLATED NETWORK MOCK: the credential check passes, then each table read
// gets the scripted error reply.
test("only exact API game messages reach agents; other 4xx, 5xx, and HTML replies get fixed text", { timeout: 90000 }, async () => {
  const replies = new Map();
  const upstream = await listen((req, res) => {
    const [, , , id, rest = ""] = req.url.split("/");
    if (rest === "session") { res.writeHead(200, { "Content-Type": "application/json" }); res.end('{"authorized":true}'); return; }
    const [status, type, body] = replies.get(id);
    res.writeHead(status, { "Content-Type": type }); res.end(typeof body === "string" ? body : JSON.stringify(body));
  });
  const JSON_TYPE = "application/json"; const HTML = "text/html; charset=utf-8";
  const REFUSED = "The poker API refused this request. Read the table and check your action.";
  const CONFLICT = "The table refused this action. Read the table again before acting.";
  const cases = [
    // Real API game messages pass unchanged.
    [409, JSON_TYPE, { error: "It is not your turn." }, "It is not your turn."],
    [400, JSON_TYPE, { error: "Choose a legal raise amount." }, "Choose a legal raise amount."],
    [409, JSON_TYPE, { error: "This request ID was used for a different action." }, "This request ID was used for a different action."],
    [409, JSON_TYPE, { error: "The table advanced. Refresh before acting." }, "The table advanced. Refresh before acting."],
    [404, JSON_TYPE, { error: "Completed hand record not found." }, "Completed hand record not found."],
    // Unknown short diagnostics never pass, whatever they hold.
    [400, JSON_TYPE, { error: "Database password=synthetic-private-value at /var/task/api.js:12" }, REFUSED],
    [409, JSON_TYPE, { error: "Refused at /var/task/api/_lib/service.js:101" }, CONFLICT],
    [409, JSON_TYPE, { error: "It is not your turn. Opponent holds As Kd" }, CONFLICT],
    [403, JSON_TYPE, { error: "Opponent cards: 14s 13d" }, "This credential cannot use that table."],
    [401, JSON_TYPE, { error: "Token si_agent_synthetic rejected" }, "Agent credential is invalid, expired, or revoked."],
    [422, JSON_TYPE, { error: "secret=synthetic-hunter2" }, "The poker API refused the request (422)."],
    [429, JSON_TYPE, { error: "Key synthetic-sk-live-123 is over quota" }, "Too many requests. Wait a few seconds."],
    [400, JSON_TYPE, { error: { message: "nested synthetic-private-value" } }, REFUSED],
    [400, JSON_TYPE, { message: "synthetic-private-value" }, REFUSED],
    [500, JSON_TYPE, { error: "TypeError at /var/task synthetic-private-value", stack: "at /var/task/api.js:12" }, "The poker API is unavailable. Try again shortly."],
    [503, HTML, "<html><body>Vercel error synthetic-private-value</body></html>", "The poker API returned an unexpected response. Try again shortly."],
    [400, HTML, "<html><body>password=synthetic-private-value</body></html>", "The poker API returned an unexpected response. Try again shortly."],
  ];
  const gateway = await startGateway({ upstream: upstream.url });
  try {
    for (const [status, type, body, expected] of cases) {
      const id = randomUUID(); replies.set(id, [status, type, body]);
      const client = await connect(gateway.endpoint, tokenFor(id));
      try {
        const result = await client.callTool({ name: "poker_get_table", arguments: {} });
        assert.equal(result.isError, true);
        assert.equal(result.content[0].text, expected, `${status} ${JSON.stringify(body)}`);
      } finally { await client.close(); }
    }
    assert.doesNotMatch(gateway.logs(), /synthetic|var\/task|As Kd|si_agent_/);
  } finally { await gateway.stop("error-mapping"); await upstream.close(); }
});

// ISOLATED NETWORK MOCK that never finishes a reply. The gateway runs with the
// production wrangler.toml and its real 12-second timeout.
test("a stalled API reply times out after 12 seconds, mid-body too, with no automatic retry", { timeout: 90000 }, async () => {
  const hits = []; const plans = new Map();
  const upstream = await listen((req, res) => {
    const [, , , id, rest = ""] = req.url.split("/");
    hits.push({ id, rest, method: req.method, at: Date.now() });
    const plan = plans.get(id);
    const stall = rest === "session" ? plan.session : rest === "commands" ? plan.commands : plan.table;
    if (stall === "headers") return;
    if (stall === "chunked-body") { res.writeHead(200, { "Content-Type": "application/json" }); res.write('{"id":"'); return; }
    if (stall === "sized-body") { res.writeHead(200, { "Content-Type": "application/json", "Content-Length": "400" }); res.write('{"id":"'); return; }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(rest === "session" ? '{"authorized":true}' : JSON.stringify({ id, version: 3, street: "flop", seats: [], legal: { check: true }, closed: false }));
  });
  const gateway = await startGateway({ upstream: upstream.url });
  const timed = async (plan, run) => {
    const id = randomUUID(); plans.set(id, plan);
    const started = Date.now(); const outcome = await run(tokenFor(id));
    return { id, outcome, ms: Date.now() - started };
  };
  const session = token => rpc(gateway.endpoint, initialize, { token }).then(async r => ({ status: r.status, text: await r.text() }));
  const tool = (name, args) => async token => {
    const client = await connect(gateway.endpoint, token);
    try {
      const started = Date.now();
      const result = await client.callTool({ name, arguments: args }, undefined, { timeout: 40000 });
      return { result, toolMs: Date.now() - started };
    } finally { await client.close(); }
  };
  const act = () => tool("poker_act", { version: 3, requestId: randomUUID(), action: "check" });
  try {
    const runs = await Promise.all([
      timed({ session: "headers" }, session), timed({ session: "chunked-body" }, session),
      timed({ table: "headers" }, tool("poker_get_table", {})), timed({ table: "chunked-body" }, tool("poker_get_table", {})),
      timed({ commands: "headers" }, act()), timed({ commands: "sized-body" }, act()),
    ]);
    const [sessionHeaders, sessionBody, ...tools] = runs;
    for (const run of [sessionHeaders, sessionBody]) {
      assert.equal(run.outcome.status, 502);
      assert.ok(run.ms >= 11500 && run.ms < 16000, `credential check ${run.ms} ms`);
    }
    for (const run of tools) {
      assert.equal(run.outcome.result.isError, true);
      assert.equal(run.outcome.result.content[0].text, "Could not reach the poker API. Retry with the same requestId if an action was sent.");
      assert.ok(run.outcome.toolMs >= 11500 && run.outcome.toolMs < 16000, `tool ${run.outcome.toolMs} ms`);
    }
    // Wait past another timeout: nothing was sent again.
    await new Promise(resolve => setTimeout(resolve, 3000));
    for (const run of runs) {
      const stalled = Object.keys(plans.get(run.id))[0];
      assert.equal(hits.filter(h => h.id === run.id && (h.rest || "table") === stalled).length, 1, stalled);
    }
    assert.equal(hits.filter(h => h.rest === "commands").length, 2);
    console.log(JSON.stringify({ stall: runs.map(r => ({ ms: r.outcome.toolMs ?? r.ms })) }));
  } finally { await gateway.stop("stall"); await upstream.close(); }
});

// ISOLATED NETWORK MOCK with slow table reads. Each snapshot's version is the
// read's number, so the test can see which snapshot a wait returned.
test("a wait sends no poll after its deadline and returns the last snapshot when the API is slow", { timeout: 90000 }, async () => {
  const reads = new Map(); const delays = new Map();
  const upstream = await listen((req, res) => {
    const [, , , id, rest = ""] = req.url.split("/");
    if (rest === "session") { res.writeHead(200, { "Content-Type": "application/json" }); res.end('{"authorized":true}'); return; }
    const list = reads.get(id) ?? []; list.push(Date.now()); reads.set(id, list);
    const version = list.length;
    setTimeout(() => {
      if (res.destroyed) return;
      res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify({ id, version, street: "flop", seats: [], legal: null, closed: false }));
    }, delays.get(id));
  });
  const gateway = await startGateway({ upstream: upstream.url });
  const run = async (delay, seconds) => {
    const id = randomUUID(); delays.set(id, delay);
    const client = await connect(gateway.endpoint, tokenFor(id));
    try {
      const started = Date.now();
      const result = await client.callTool({ name: "poker_wait_for_turn", arguments: { seconds } }, undefined, { timeout: 40000 });
      return { id, result, ms: Date.now() - started };
    } finally { await client.close(); }
  };
  try {
    // Reads take 3 s: read 1 at 0 s, read 2 at 4 s is cut at the 5 s deadline.
    // A slow first read (7 s) runs past a 2-second wait: it is the only snapshot.
    const [slow, slowFirst] = await Promise.all([run(3000, 5), run(7000, 2)]);
    await new Promise(resolve => setTimeout(resolve, 4000));
    assert.notEqual(slow.result.isError, true);
    assert.equal(slow.result.structuredContent.version, 1);
    assert.ok(slow.ms >= 4500 && slow.ms < 6800, `wait ${slow.ms} ms`);
    const slowReads = reads.get(slow.id);
    assert.equal(slowReads.length, 2);
    assert.ok(slowReads[1] - slowReads[0] < 5000, "a poll started after the deadline");
    assert.notEqual(slowFirst.result.isError, true);
    assert.equal(slowFirst.result.structuredContent.version, 1);
    assert.ok(slowFirst.ms >= 6800 && slowFirst.ms < 9500, `wait ${slowFirst.ms} ms`);
    assert.equal(reads.get(slowFirst.id).length, 1);
    console.log(JSON.stringify({ slowWait: { seconds: 5, ms: slow.ms, reads: slowReads.length }, slowFirstRead: { seconds: 2, ms: slowFirst.ms } }));
  } finally { await gateway.stop("slow-wait"); await upstream.close(); }
});

test("GATEWAY_UPSTREAM_LIMITER caps table API calls across credentials", { timeout: 90000 }, async () => {
  const config = variantConfig("gateway-tight", text => {
    assert.ok(text.includes("simple = { limit = 3000, period = 60 }"));
    return text.replace("simple = { limit = 3000, period = 60 }", "simple = { limit = 5, period = 60 }");
  });
  const gateway = await startGateway({ upstream: api.url, config });
  try {
    const host = `gateway-limit-${randomUUID()}`;
    let view = await api.service.create(host, { name: "Gateway limit", maxPlayers: 6, smallBlind: 5, bigBlind: 10, startingStack: 1000, turnSeconds: 120 });
    const grants = [];
    for (const name of ["A", "B", "C", "D", "E"]) { const grant = await api.service.issueAgent(view.id, host, view.version, randomUUID(), name); grants.push(grant); view = grant.table; }
    // B and C play a hand (set up through the service), so D's wait keeps polling.
    for (const g of [grants[1], grants[2]]) view = await api.service.command(view.id, { token: g.token }, { version: view.version, requestId: randomUUID(), command: { type: "ready", ready: true } });
    view = await api.service.command(view.id, { token: grants[1].token }, { version: view.version, requestId: randomUUID(), command: { type: "deal" } });
    const mine = () => api.calls.filter(c => grants.some(g => c.authorization === `Bearer ${g.token}`));
    // Three credentials use three calls; each has its own high per-credential limits.
    for (const g of grants.slice(0, 3)) assert.equal((await rpc(gateway.endpoint, initialize, { token: g.token })).status, 200);
    // D's wait gets its credential check and one poll; the next poll is refused.
    const wait = await rpc(gateway.endpoint, { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "poker_wait_for_turn", arguments: { seconds: 15 } } },
      { token: grants[3].token, headers: { "Mcp-Protocol-Version": "2025-06-18" } });
    const result = (await wait.json()).result;
    assert.equal(result.isError, true);
    assert.equal(result.content[0].text, "Too many poker API calls. Wait a few seconds before the next call.");
    // E's credential check is refused before any API call.
    const limited = await rpc(gateway.endpoint, initialize, { token: grants[4].token });
    assert.equal(limited.status, 429);
    assert.equal(limited.headers.get("retry-after"), "10");
    assert.match((await limited.json()).error.message, /Too many poker API calls/);
    assert.equal(mine().length, 5);
    assert.equal(mine().filter(c => c.authorization === `Bearer ${grants[4].token}`).length, 0);
  } finally { await gateway.stop("gateway-limit"); }
});
