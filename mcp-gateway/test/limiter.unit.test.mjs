// Node probe of the exported Worker handler for rate-limit binding faults:
// throws, rejections, bad replies, and replies that never come or come late.
// The bindings and the table API here are SYNTHETIC: injected functions and a
// network mock that records each call. This is not workerd evidence; the real
// bindings run in workerd in hostile.test.mjs and security.test.mjs.
import { test, before, beforeEach, afterEach, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import worker from "../src/index.mjs";
import { LIMITERS } from "../src/config.mjs";

const tableId = randomUUID();
const token = `si_agent_${tableId}.${"cd".repeat(32)}`;
const DIAGNOSTIC = "Rate limiter failed at /internal/edge/ratelimit.js:42 synthetic-private-diagnostic";
const LIMITS_DOWN = "The gateway cannot check request limits right now.";
const CANCELLED = "The request was cancelled. Retry with the same requestId if an action was sent.";
const realFetch = globalThis.fetch; const realLog = console.log; const realError = console.error;
let calls; let logs; const unhandled = [];
const onUnhandled = reason => unhandled.push(reason);
before(() => process.on("unhandledRejection", onUnhandled));
after(() => process.off("unhandledRejection", onUnhandled));
beforeEach(() => {
  calls = []; logs = []; unhandled.length = 0;
  console.log = line => logs.push(String(line)); console.error = line => logs.push(String(line));
});
afterEach(() => { globalThis.fetch = realFetch; console.log = realLog; console.error = realError; });

const ok = { success: true };
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
// A binding reply the test settles by hand, at any time. It allows the call
// after 6 s at the latest, so a gateway that waits for it cannot hang a test.
function gate() {
  let resolve; let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  setTimeout(() => resolve(ok), 6000).unref();
  return { promise, resolve, reject };
}
// `hooks[name](n)` answers the nth call (from 1) to that binding.
function env(hooks = {}) {
  const counts = {};
  const limiter = name => ({ limit: () => { counts[name] = (counts[name] ?? 0) + 1; return hooks[name] ? hooks[name](counts[name]) : Promise.resolve(ok); } });
  return { UPSTREAM_ORIGIN: "https://api.example", ALLOWED_HOSTS: "gateway.test", ALLOWED_ORIGINS: "", PUBLIC_MCP_URL: "https://gateway.test/mcp",
    CLIENT_IP_HEADER: "none", ALLOW_LOOPBACK_HTTP: "false", ...Object.fromEntries(Object.values(LIMITERS).map(name => [name, limiter(name)])) };
}
const json = body => new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });
const inPlay = { id: tableId, version: 4, street: "flop", legal: null, closed: false, seats: [] };
function upstream() {
  calls = [];
  globalThis.fetch = async url => {
    calls.push(new URL(url).pathname.replace(`/api/tables/${tableId}`, "") || "/");
    return json(calls.at(-1) === "/session" ? { authorized: true } : inPlay);
  };
}
function post(message, signal) {
  return new Request("https://gateway.test/mcp", { method: "POST", signal, body: JSON.stringify(message),
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json, text/event-stream", "Mcp-Protocol-Version": "2025-06-18" } });
}
const tool = (name, args = {}) => ({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } });
const getTable = tool("poker_get_table");
const act = () => tool("poker_act", { version: 4, requestId: randomUUID(), action: "check" });
const wait = seconds => tool("poker_wait_for_turn", { seconds });
const rules = { jsonrpc: "2.0", id: 1, method: "resources/read", params: { uri: "poker://rules" } };
async function send(message, hooks, signal) {
  const started = Date.now();
  const response = await worker.fetch(post(message, signal), env(hooks));
  const text = await response.text();
  return { status: response.status, text, body: JSON.parse(text), ms: Date.now() - started };
}
function clean(outcome) {
  assert.doesNotMatch(outcome.text, /synthetic-private-diagnostic|internal\/edge|ratelimit\.js|Cannot read|TypeError/);
  assert.doesNotMatch(logs.join("\n"), /synthetic-private-diagnostic|internal\/edge|ratelimit\.js|si_agent_|Bearer/);
}
// Late replies must start no API call and raise no unhandled rejection.
async function settledQuietly(count) {
  await delay(1200);
  assert.equal(calls.length, count, `late API call: ${calls.join(",")}`);
  assert.deepEqual(unhandled.map(String), []);
}

const faults = {
  throws: () => { throw new Error(DIAGNOSTIC); },
  rejects: () => Promise.reject(new Error(DIAGNOSTIC)),
  "has no reply": () => Promise.resolve(undefined),
};

for (const binding of ["UPSTREAM_LIMITER", "GATEWAY_UPSTREAM_LIMITER"]) {
  for (const [name, fault] of Object.entries(faults)) {
    test(`${binding} ${name} after the credential check: fixed message, nothing sent`, async () => {
      for (const message of [getTable, act(), wait(5)]) {
        upstream();
        const outcome = await send(message, { [binding]: n => (n === 1 ? Promise.resolve(ok) : fault()) });
        assert.equal(outcome.status, 200);
        assert.equal(outcome.body.result.isError, true);
        assert.equal(outcome.body.result.content[0].text, LIMITS_DOWN);
        assert.deepEqual(calls, ["/session"]);
        clean(outcome);
      }
      upstream();
      const read = await send(rules, { [binding]: n => (n === 1 ? Promise.resolve(ok) : fault()) });
      assert.ok(read.body.error, "a failed rules read is a JSON-RPC error");
      assert.equal(read.body.error.message.includes(LIMITS_DOWN), true);
      assert.deepEqual(calls, ["/session"]);
      clean(read);
      await settledQuietly(1);
    });
    test(`${binding} ${name} at the credential check: 503, nothing sent`, async () => {
      upstream();
      const outcome = await send(getTable, { [binding]: fault });
      assert.equal(outcome.status, 503);
      assert.equal(outcome.body.error.message, LIMITS_DOWN);
      assert.deepEqual(calls, []);
      clean(outcome);
      await settledQuietly(0);
    });
  }
}

for (const binding of ["ADMISSION_LIMITER", "CREDENTIAL_LIMITER"]) {
  for (const [name, fault] of Object.entries(faults)) test(`${binding} ${name}: 503, nothing sent`, async () => {
    upstream();
    const outcome = await send(getTable, { [binding]: fault });
    assert.equal(outcome.status, 503);
    assert.equal(outcome.body.error.message, LIMITS_DOWN);
    assert.deepEqual(calls, []);
    clean(outcome);
    await settledQuietly(0);
  });
}

// A reply that never comes is a fault too, after a short bound that does not
// cap a legitimate long wait.
for (const binding of Object.values(LIMITERS)) test(`${binding} with no reply fails closed within its bound`, async () => {
  upstream();
  const stuck = gate();
  const outcome = await send(getTable, { [binding]: () => stuck.promise });
  assert.ok(outcome.ms < 4500, `took ${outcome.ms} ms`);
  assert.equal(outcome.status, 503);
  assert.equal(outcome.body.error.message, LIMITS_DOWN);
  assert.deepEqual(calls, []);
  stuck.resolve(ok);
  await settledQuietly(0);
});

test("a table read whose admission never replies fails closed within its bound", async () => {
  upstream();
  const stuck = gate();
  const outcome = await send(getTable, { UPSTREAM_LIMITER: n => (n === 1 ? Promise.resolve(ok) : stuck.promise) });
  assert.ok(outcome.ms < 4500, `took ${outcome.ms} ms`);
  assert.equal(outcome.body.result.content[0].text, LIMITS_DOWN);
  assert.deepEqual(calls, ["/session"]);
  stuck.reject(new Error(DIAGNOSTIC));
  await settledQuietly(1);
  clean(outcome);
});

// The handoff's reproducer: the snapshot exists and the next poll's admission
// hangs. The wait deadline must still return that snapshot on time.
for (const binding of ["UPSTREAM_LIMITER", "GATEWAY_UPSTREAM_LIMITER"]) {
  for (const late of ["resolves", "rejects"]) test(`a wait returns its snapshot at the deadline while ${binding} hangs, then ${late} late`, async () => {
    upstream();
    const stuck = gate();
    const outcome = await send(wait(2), { [binding]: n => (n <= 2 ? Promise.resolve(ok) : stuck.promise) });
    assert.ok(outcome.ms >= 1900 && outcome.ms < 2500, `wait took ${outcome.ms} ms`);
    assert.notEqual(outcome.body.result.isError, true);
    assert.equal(outcome.body.result.structuredContent.version, 4);
    assert.deepEqual(calls, ["/session", "/"]);
    if (late === "resolves") stuck.resolve(ok); else stuck.reject(new Error(DIAGNOSTIC));
    await settledQuietly(2);
    clean(outcome);
  });
}

// Cancellation must end a pending admission at once, not when it replies.
const pendingPoints = [
  ["ADMISSION_LIMITER", 1, getTable, "no snapshot"], ["CREDENTIAL_LIMITER", 1, getTable, "no snapshot"],
  ["UPSTREAM_LIMITER", 1, getTable, "credential check"], ["GATEWAY_UPSTREAM_LIMITER", 1, getTable, "credential check"],
  ["UPSTREAM_LIMITER", 2, getTable, "first table read"], ["GATEWAY_UPSTREAM_LIMITER", 2, act(), "command"],
  ["UPSTREAM_LIMITER", 3, wait(10), "later wait poll"], ["GATEWAY_UPSTREAM_LIMITER", 3, wait(10), "later wait poll"],
];
for (const [binding, at, message, stage] of pendingPoints) {
  for (const late of ["resolves", "rejects"]) test(`an abort while ${binding} hangs (${stage}) ends the request at once; the reply ${late} late`, async () => {
    upstream();
    const stuck = gate(); const controller = new AbortController();
    const hooks = { [binding]: n => {
      if (n !== at) return Promise.resolve(ok);
      setTimeout(() => controller.abort(), 30);
      return stuck.promise;
    } };
    const outcome = await send(message, hooks, controller.signal);
    // The abort is 30 ms after the hang starts; a later poll starts after 1 s.
    const bound = at === 3 ? 1500 : 500;
    assert.ok(outcome.ms < bound, `${stage}: took ${outcome.ms} ms`);
    const sent = calls.length;
    if (at <= 1) {
      assert.equal(outcome.status, 499);
      assert.deepEqual(calls, []);
    } else {
      assert.equal(outcome.body.result.isError, true);
      assert.equal(outcome.body.result.content[0].text, CANCELLED);
      assert.deepEqual(calls, at === 3 ? ["/session", "/"] : ["/session"]);
    }
    if (late === "resolves") stuck.resolve(ok); else stuck.reject(new Error(DIAGNOSTIC));
    await settledQuietly(sent);
    clean(outcome);
  });
}

test("normal 429 replies and API messages still pass", async () => {
  upstream();
  const limited = await send(getTable, { UPSTREAM_LIMITER: n => Promise.resolve(n === 1 ? ok : { success: false }) });
  assert.equal(limited.body.result.content[0].text, "Too many poker API calls. Wait a few seconds before the next call.");
  upstream();
  const credential = await send(getTable, { CREDENTIAL_LIMITER: () => Promise.resolve({ success: false }) });
  assert.equal(credential.status, 429);
  globalThis.fetch = async url => {
    calls.push(new URL(url).pathname);
    if (url.endsWith("/session")) return json({ authorized: true });
    return new Response(JSON.stringify({ error: "It is not your turn." }), { status: 409, headers: { "Content-Type": "application/json" } });
  };
  const refused = await send(act(), {});
  assert.equal(refused.body.result.content[0].text, "It is not your turn.");
});
