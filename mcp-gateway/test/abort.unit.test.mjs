// Node probe of the exported Worker handler for cancellation races. Local
// workerd never reports a client disconnect, so these exact timings cannot be
// made there; the surrounding behaviour runs in workerd in the other files.
// The table API here is a SYNTHETIC NETWORK MOCK that records each call. It is
// not gameplay evidence.
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import worker from "../src/index.mjs";
import { LIMITERS } from "../src/config.mjs";

const tableId = randomUUID();
const token = `si_agent_${tableId}.${"ab".repeat(32)}`;
const realFetch = globalThis.fetch; const realLog = console.log;
let calls; let logs;
beforeEach(() => { calls = []; logs = []; console.log = line => logs.push(String(line)); });
afterEach(() => { globalThis.fetch = realFetch; console.log = realLog; });

const ok = { success: true };
function env(hooks = {}) {
  const limiter = name => ({ limit: async options => (hooks[name] ? hooks[name](options) : ok) });
  return { UPSTREAM_ORIGIN: "https://api.example", ALLOWED_HOSTS: "gateway.test", ALLOWED_ORIGINS: "", PUBLIC_MCP_URL: "https://gateway.test/mcp",
    CLIENT_IP_HEADER: "none", ALLOW_LOOPBACK_HTTP: "false", ...Object.fromEntries(Object.values(LIMITERS).map(name => [name, limiter(name)])) };
}
const json = body => new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });
const inPlay = { id: tableId, version: 4, street: "flop", legal: null, closed: false, seats: [] };
// The mock answers /session and table reads; a handler can replace any reply.
function upstream(handler = () => undefined) {
  globalThis.fetch = async (url, init) => {
    const call = { path: new URL(url).pathname.replace(`/api/tables/${tableId}`, "") || "/", signal: init.signal, at: Date.now() };
    calls.push(call);
    const custom = await handler(call, init);
    if (custom) return custom;
    return json(call.path === "/session" ? { authorized: true } : inPlay);
  };
}
const hang = signal => new Promise((_, reject) => signal.addEventListener("abort", () => reject(signal.reason), { once: true }));
function post(message, signal) {
  return new Request("https://gateway.test/mcp", { method: "POST", signal, body: JSON.stringify(message),
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json, text/event-stream", "Mcp-Protocol-Version": "2025-06-18" } });
}
const ready = { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "poker_ready", arguments: { version: 4, requestId: randomUUID(), ready: true } } };
const wait = { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "poker_wait_for_turn", arguments: { seconds: 10 } } };
const noSecrets = () => assert.doesNotMatch(logs.join("\n"), /si_agent_|Bearer|requestId/);

test("a request aborted before it arrives makes no API call", async () => {
  upstream();
  const controller = new AbortController(); controller.abort();
  const response = await worker.fetch(post(ready, controller.signal), env());
  assert.equal(response.status, 499);
  assert.deepEqual(calls, []);
  noSecrets();
});

for (const binding of ["ADMISSION_LIMITER", "CREDENTIAL_LIMITER"]) test(`an abort while ${binding} is pending makes no API call`, async () => {
  upstream();
  const controller = new AbortController();
  const response = await worker.fetch(post(ready, controller.signal), env({ [binding]: async () => { controller.abort(); await new Promise(r => setTimeout(r, 5)); return ok; } }));
  assert.equal(response.status, 499);
  assert.deepEqual(calls, []);
  noSecrets();
});

test("an abort while the credential check waits on UPSTREAM_LIMITER sends nothing", async () => {
  upstream();
  const controller = new AbortController();
  const response = await worker.fetch(post(ready, controller.signal), env({ UPSTREAM_LIMITER: async () => { controller.abort(); return ok; } }));
  assert.equal(response.status, 499);
  assert.deepEqual(calls, []);
});

test("an abort during the credential check cancels it and sends no command", async () => {
  const controller = new AbortController();
  upstream(call => { if (call.path === "/session") { setTimeout(() => controller.abort(), 20); return hang(call.signal); } });
  const response = await worker.fetch(post(ready, controller.signal), env());
  assert.equal(response.status, 499);
  assert.deepEqual(calls.map(c => c.path), ["/session"]);
  assert.equal(calls[0].signal.aborted, true);
});

test("an abort while a command is in flight reaches its signal and nothing follows", async () => {
  const controller = new AbortController();
  upstream(call => { if (call.path === "/commands") { setTimeout(() => controller.abort(), 20); return hang(call.signal); } });
  const response = await worker.fetch(post(ready, controller.signal), env());
  const result = (await response.json()).result;
  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /Retry with the same requestId/);
  assert.deepEqual(calls.map(c => c.path), ["/session", "/commands"]);
  assert.equal(calls[1].signal.aborted, true);
  await new Promise(r => setTimeout(r, 1500));
  assert.equal(calls.length, 2);
});

test("an abort during a wait's sleep ends it with no later poll", async () => {
  upstream();
  const controller = new AbortController();
  const started = Date.now();
  setTimeout(() => controller.abort(), 1500);
  const response = await worker.fetch(post(wait, controller.signal), env());
  const elapsed = Date.now() - started;
  assert.equal((await response.json()).result.isError, true);
  assert.ok(elapsed < 1900, `elapsed ${elapsed}`);
  const polls = calls.filter(c => c.path === "/");
  assert.equal(polls.length, 2);
  assert.ok(polls.every(c => c.at - started < 1500));
  await new Promise(r => setTimeout(r, 1500));
  assert.equal(calls.filter(c => c.path === "/").length, 2);
});

test("an abort during a wait's poll cancels that poll with no later poll", async () => {
  const controller = new AbortController();
  upstream(call => { if (call.path === "/" && calls.filter(c => c.path === "/").length === 2) { setTimeout(() => controller.abort(), 20); return hang(call.signal); } });
  const response = await worker.fetch(post(wait, controller.signal), env());
  assert.equal((await response.json()).result.isError, true);
  const polls = calls.filter(c => c.path === "/");
  assert.equal(polls.length, 2);
  assert.equal(polls[1].signal.aborted, true);
  await new Promise(r => setTimeout(r, 1500));
  assert.equal(calls.filter(c => c.path === "/").length, 2);
});
