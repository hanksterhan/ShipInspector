// Node probe of the exported Worker handler for rate-limit binding faults:
// throws, rejections, bad replies, and replies that never come or come late.
// The bindings and the table API here are SYNTHETIC: injected functions and a
// network mock that records each call. This is not workerd evidence; the real
// bindings run in workerd in hostile.test.mjs and security.test.mjs.
import { test, before, beforeEach, afterEach, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { getEventListeners } from "node:events";
import worker from "../src/index.mjs";
import { LIMITERS } from "../src/config.mjs";
import { admit, GatewayError, LIMIT_TIMEOUT_MS, LimitError } from "../src/upstream.mjs";

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
async function send(message, hooks, signal, environment = env(hooks)) {
  const started = Date.now();
  const response = await worker.fetch(post(message, signal), environment);
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

// A binding can raise the gateway's own error class, so a class proves nothing
// about where an error came from. These are SYNTHETIC faults; no real binding
// is known to do this.
const forged = (status = 503) => new GatewayError(status, DIAGNOSTIC);
const faults = {
  throws: () => { throw new Error(DIAGNOSTIC); },
  rejects: () => Promise.reject(new Error(DIAGNOSTIC)),
  "has no reply": () => Promise.resolve(undefined),
  "throws a GatewayError": () => { throw forged(); },
  "rejects with a GatewayError": () => Promise.reject(forged()),
  "throws a GatewayError with the cancel status": () => { throw forged(499); },
  "returns a thenable that throws a GatewayError": () => ({ then() { throw forged(); } }),
  "returns a reply whose success getter throws a GatewayError": () => ({ get success() { throw forged(); } }),
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

// A forged status must not pick the response at the credential check.
for (const binding of ["UPSTREAM_LIMITER", "GATEWAY_UPSTREAM_LIMITER"]) {
  for (const status of [401, 403, 404, 426, 429]) test(`${binding} throws a GatewayError with status ${status} at the credential check: 503, nothing sent`, async () => {
    upstream();
    const outcome = await send(getTable, { [binding]: () => { throw forged(status); } });
    assert.equal(outcome.status, 503);
    assert.equal(outcome.body.error.message, LIMITS_DOWN);
    assert.deepEqual(calls, []);
    clean(outcome);
  });
  test(`${binding} throws a GatewayError at a wait's later poll: fixed message, no further call`, async () => {
    upstream();
    const outcome = await send(wait(5), { [binding]: n => { if (n <= 2) return ok; throw forged(); } });
    assert.equal(outcome.body.result.isError, true);
    assert.equal(outcome.body.result.content[0].text, LIMITS_DOWN);
    assert.deepEqual(calls, ["/session", "/"]);
    clean(outcome);
  });
  // readConfig() reads the getter once and the credential check once, so the
  // third read is the tool's or the rules read's own check.
  test(`${binding}'s limit getter throws a GatewayError after the credential check: fixed message, nothing sent`, async () => {
    for (const message of [getTable, rules]) {
      upstream();
      const environment = env();
      const { limit } = environment[binding];
      let reads = 0;
      Object.defineProperty(environment[binding], "limit", { get() { if (++reads <= 2) return limit; throw forged(); } });
      const outcome = await send(message, {}, undefined, environment);
      assert.equal(outcome.body.result?.content[0].text ?? outcome.body.error.message, LIMITS_DOWN);
      assert.deepEqual(calls, ["/session"]);
      clean(outcome);
    }
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

for (const [name, late] of [["an Error", () => new Error(DIAGNOSTIC)], ["a GatewayError", forged]]) {
  test(`a table read whose admission never replies fails closed within its bound, then rejects late with ${name}`, async () => {
    upstream();
    const stuck = gate();
    const outcome = await send(getTable, { UPSTREAM_LIMITER: n => (n === 1 ? Promise.resolve(ok) : stuck.promise) });
    assert.ok(outcome.ms < 4500, `took ${outcome.ms} ms`);
    assert.equal(outcome.body.result.content[0].text, LIMITS_DOWN);
    assert.deepEqual(calls, ["/session"]);
    stuck.reject(late());
    await settledQuietly(1);
    clean(outcome);
  });
}

// The handoff's reproducer: the snapshot exists and the next poll's admission
// hangs. The wait deadline must still return that snapshot on time.
for (const binding of ["UPSTREAM_LIMITER", "GATEWAY_UPSTREAM_LIMITER"]) {
  for (const late of ["resolves", "rejects", "rejects with a GatewayError"]) test(`a wait returns its snapshot at the deadline while ${binding} hangs, then ${late} late`, async () => {
    upstream();
    const stuck = gate();
    const outcome = await send(wait(2), { [binding]: n => (n <= 2 ? Promise.resolve(ok) : stuck.promise) });
    assert.ok(outcome.ms >= 1900 && outcome.ms < 2500, `wait took ${outcome.ms} ms`);
    assert.notEqual(outcome.body.result.isError, true);
    assert.equal(outcome.body.result.structuredContent.version, 4);
    assert.deepEqual(calls, ["/session", "/"]);
    if (late === "resolves") stuck.resolve(ok); else stuck.reject(late === "rejects" ? new Error(DIAGNOSTIC) : forged());
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

// A binding can abort the request before limit() returns. This is a SYNTHETIC
// reentrant binding; whether a real Cloudflare binding can do this is not known.
for (const [binding, at, message, stage] of pendingPoints) {
  for (const late of ["resolves", "rejects"]) test(`an abort inside ${binding}'s limit() (${stage}) ends the request at once; the reply ${late} late`, async () => {
    upstream();
    const stuck = gate(); const controller = new AbortController();
    const hooks = { [binding]: n => {
      if (n !== at) return Promise.resolve(ok);
      controller.abort(new Error(DIAGNOSTIC));
      return stuck.promise;
    } };
    const outcome = await send(message, hooks, controller.signal);
    // A later poll starts after 1 s; the others must not wait for any timer.
    const bound = at === 3 ? 1500 : 500;
    assert.ok(outcome.ms < bound, `${stage}: took ${outcome.ms} ms`);
    const sent = calls.length;
    if (at <= 1) {
      assert.equal(outcome.status, 499);
      assert.equal(outcome.body.error.message, "The request was cancelled.");
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

// A cancel wins over whatever limit() does after the abort.
const afterAbort = {
  "returns success": () => ok,
  "returns a refusal": () => ({ success: false }),
  "returns no reply": () => undefined,
  "returns a rejected promise": () => Promise.reject(new Error(DIAGNOSTIC)),
  throws: () => { throw new Error(DIAGNOSTIC); },
  "throws a GatewayError": () => { throw forged(); },
  "returns a promise that rejects with a GatewayError": () => Promise.reject(forged()),
  "returns a reply whose success getter throws a GatewayError": () => ({ get success() { throw forged(); } }),
};
for (const binding of Object.values(LIMITERS)) {
  for (const [name, reply] of Object.entries(afterAbort)) test(`${binding} aborts the request and ${name}: 499, nothing sent`, async () => {
    upstream();
    const controller = new AbortController();
    const outcome = await send(getTable, { [binding]: () => { controller.abort(new Error(DIAGNOSTIC)); return reply(); } }, controller.signal);
    assert.ok(outcome.ms < 500, `took ${outcome.ms} ms`);
    assert.equal(outcome.status, 499);
    assert.equal(outcome.body.error.message, "The request was cancelled.");
    assert.deepEqual(calls, []);
    clean(outcome);
    await settledQuietly(0);
  });
}

test("a request aborted before it arrives calls no binding and no API", async () => {
  upstream();
  const controller = new AbortController(); controller.abort(new Error(DIAGNOSTIC));
  const used = [];
  const hooks = Object.fromEntries(Object.values(LIMITERS).map(name => [name, () => { used.push(name); return ok; }]));
  const outcome = await send(getTable, hooks, controller.signal);
  assert.equal(outcome.status, 499);
  assert.deepEqual(used, []);
  assert.deepEqual(calls, []);
  clean(outcome);
  await settledQuietly(0);
});

// A plain reply that is not a promise, with no abort, keeps its normal meaning.
for (const binding of Object.values(LIMITERS)) {
  test(`${binding} returns success at once: the call goes on`, async () => {
    upstream();
    const outcome = await send(getTable, { [binding]: () => ok });
    assert.equal(outcome.body.result.structuredContent.version, 4);
    assert.deepEqual(calls, ["/session", "/"]);
  });
  test(`${binding} returns a refusal at once: 429, nothing sent`, async () => {
    upstream();
    const outcome = await send(getTable, { [binding]: () => ({ success: false }) });
    assert.equal(outcome.status, 429);
    assert.deepEqual(calls, []);
  });
}

// The shared helper itself: no timer or abort listener stays after any end.
async function admitted(t, limit, signal) {
  const set = t.mock.method(globalThis, "setTimeout"); const clear = t.mock.method(globalThis, "clearTimeout");
  const started = Date.now();
  let value; let error;
  try { value = await admit(typeof limit === "function" ? { limit } : limit, "key", signal); } catch (caught) { error = caught; }
  const ms = Date.now() - started;
  const timers = set.mock.calls.filter(call => call.arguments[1] === LIMIT_TIMEOUT_MS).map(call => call.result);
  const cleared = clear.mock.calls.map(call => call.arguments[0]);
  set.mock.restore(); clear.mock.restore();
  assert.ok(timers.every(timer => cleared.includes(timer)), "the limit timer is still set");
  assert.equal(getEventListeners(signal, "abort").length, 0);
  return { value, error, ms };
}
function isCancel({ error, ms }) {
  assert.ok(error instanceof GatewayError && !(error instanceof LimitError), `got ${error?.name}`);
  assert.equal(error.status, 499);
  assert.equal(error.message, CANCELLED);
  assert.ok(ms < 500, `took ${ms} ms`);
}

test("admit() with a signal that is already aborted never calls the binding", async t => {
  const controller = new AbortController(); controller.abort();
  let used = 0;
  isCancel(await admitted(t, () => { used++; return ok; }, controller.signal));
  assert.equal(used, 0);
});

for (const [name, reply] of Object.entries({ ...afterAbort, "returns a promise that never settles": () => new Promise(() => {}) })) {
  test(`admit() when the binding aborts and ${name}: a cancel, with nothing left behind`, async t => {
    const controller = new AbortController();
    isCancel(await admitted(t, () => { controller.abort(new Error(DIAGNOSTIC)); return reply(); }, controller.signal));
  });
}

test("admit() with no abort keeps its replies, faults, and cleanup", async t => {
  const signal = () => new AbortController().signal;
  assert.equal((await admitted(t, () => ok, signal())).value, true);
  assert.equal((await admitted(t, () => ({ success: false }), signal())).value, false);
  assert.equal((await admitted(t, () => Promise.resolve(ok), signal())).value, true);
  for (const fault of Object.values(faults)) {
    const { error } = await admitted(t, fault, signal());
    assert.ok(error instanceof LimitError, `got ${error?.name}`);
    assert.equal(error.message, LIMITS_DOWN);
  }
});

// Each way a binding can fail, with each value it can fail with. Only the
// signal can make a failure a cancel.
const forgeries = {
  "a 503 GatewayError": () => forged(503),
  "a 429 GatewayError": () => forged(429),
  "a 499 GatewayError": () => forged(499),
  "a LimitError with a changed message": () => Object.assign(new LimitError(), { message: DIAGNOSTIC }),
  "a plain Error": () => new Error(DIAGNOSTIC),
  "a string": () => DIAGNOSTIC,
  undefined: () => undefined,
};
const routes = {
  "limit() throws": error => ({ limit: () => { throw error; } }),
  "limit() rejects": error => ({ limit: () => Promise.reject(error) }),
  "the limit getter throws": error => ({ get limit() { throw error; } }),
  "a thenable's then() throws": error => ({ limit: () => ({ then() { throw error; } }) }),
  "a thenable's then() rejects": error => ({ limit: () => ({ then(_, reject) { reject(error); } }) }),
  "a thenable's then getter throws": error => ({ limit: () => ({ get then() { throw error; } }) }),
  "the reply's success getter throws": error => ({ limit: () => ({ get success() { throw error; } }) }),
};
for (const [route, binding] of Object.entries(routes)) {
  test(`admit() when ${route}: a fixed LimitError unless the signal aborted`, async t => {
    for (const [name, make] of Object.entries(forgeries)) {
      const { error, value } = await admitted(t, binding(make()), new AbortController().signal);
      assert.equal(value, undefined, name);
      assert.ok(error instanceof LimitError, `${name}: got ${error?.name}`);
      assert.equal(error.status, 503, name);
      assert.equal(error.message, LIMITS_DOWN, name);
      // The same fault with an abort first is a cancel.
      const controller = new AbortController();
      const fault = binding(make());
      const reentrant = { get limit() { controller.abort(new Error(DIAGNOSTIC)); return fault.limit; } };
      isCancel(await admitted(t, reentrant, controller.signal));
    }
    await delay(0);
    assert.deepEqual(unhandled.map(String), []);
  });
}

test("admit() treats a malformed success as a fault and a false one as a refusal", async t => {
  for (const success of ["true", 1, null, {}]) {
    const { error } = await admitted(t, () => ({ success }), new AbortController().signal);
    assert.ok(error instanceof LimitError, `got ${error?.name}`);
  }
  assert.equal((await admitted(t, () => ({ get success() { return false; } }), new AbortController().signal)).value, false);
});

test("admit() drops a GatewayError that comes after a cancel or after its bound", async t => {
  const controller = new AbortController();
  const cancelled = gate();
  setTimeout(() => controller.abort(new Error(DIAGNOSTIC)), 20);
  isCancel(await admitted(t, () => cancelled.promise, controller.signal));
  cancelled.reject(forged());
  const stuck = gate();
  const timedOut = await admit({ limit: () => stuck.promise }, "key", new AbortController().signal, 20).catch(error => error);
  assert.ok(timedOut instanceof LimitError, `got ${timedOut?.name}`);
  assert.equal(timedOut.message, LIMITS_DOWN);
  stuck.reject(forged());
  await delay(20);
  assert.deepEqual(unhandled.map(String), []);
});

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
