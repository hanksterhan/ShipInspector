// Opt-in interop check: the official MCP Python SDK and the official
// TypeScript SDK play one hand against each other through the gateway in
// local workerd, against the real API. Needs `uv`, which downloads the pinned
// Python SDK from PyPI on first use. Run: npm run test:python-client
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { caller, connect, startApi, startGateway } from "../harness.mjs";
import { spawnGroup } from "./group.mjs";

// The Python SDK version this check was verified with.
const PYTHON_SDK = "1.30.0";
const LIMIT_MS = 180000;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
// Wait for `promise` at most `ms`, and leave no timer behind.
function within(promise, ms) {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`no result in ${ms} ms`)), ms); })])
    .finally(() => clearTimeout(timer));
}

// One watchdog from the start covers startup, play, and the Python client's
// exit. Each step below waits at most for the time left, and stops when the
// watchdog fires.
const startedAt = Date.now();
const watchdog = new AbortController();
const timer = setTimeout(() => watchdog.abort(new Error(`interop check did not finish in ${LIMIT_MS} ms`)), LIMIT_MS);
const remaining = () => Math.max(1, startedAt + LIMIT_MS - Date.now());
const expired = new Promise((_, reject) => watchdog.signal.addEventListener("abort", () => reject(watchdog.signal.reason), { once: true }));
expired.catch(() => {});
const bounded = promise => Promise.race([promise, expired]);

let api; let gateway; let ts; let python;
try {
  api = await bounded(startApi());
  gateway = await startGateway({ upstream: api.url, signal: watchdog.signal });
  const host = `interop-${randomUUID()}`;
  let view = await bounded(api.service.create(host, { gameMode: "red-river-holdem", ghost: true, name: "Interop", maxPlayers: 2, smallBlind: 5, bigBlind: 10, startingStack: 1000, turnSeconds: 120 }));
  const py = await bounded(api.service.issueAgent(view.id, host, view.version, randomUUID(), "Python"));
  const tsGrant = await bounded(api.service.issueAgent(view.id, host, py.table.version, randomUUID(), "TypeScript"));
  const script = fileURLToPath(new URL("./python_client.py", import.meta.url));
  // uv starts Python as its own child; the group lets cleanup reach both.
  python = spawnGroup("uv", ["run", "--no-project", "--python", "3.12", "--with", `mcp==${PYTHON_SDK}`, "python", script, gateway.endpoint],
    { env: { ...process.env, SEAT_CREDENTIAL: py.token }, stdio: ["ignore", "pipe", "pipe"] });
  let out = ""; let err = "";
  python.child.stdout.on("data", c => { out += c; }); python.child.stderr.on("data", c => { err += c; });
  // A missing `uv` is a spawn error, not an exit code: fail at once.
  await bounded(python.started);
  // The TypeScript client takes the other seat and deals once both are ready.
  ts = await bounded(connect(gateway.endpoint, tsGrant.token, "typescript"));
  const tsCall = caller(ts);
  const call = (name, args) => bounded(tsCall(name, args, Math.min(40000, remaining())));
  view = await call("poker_get_table");
  const seat = view.yourSeat;
  view = await call("poker_ready", { version: view.version, requestId: randomUUID(), ready: true });
  for (let i = 0; i < 200 && !view.canDeal && !python.isClosed(); i++) { await bounded(delay(300)); view = await call("poker_get_table"); }
  assert.equal(view.canDeal, true, "the Python client never marked ready");
  view = await call("poker_deal", { version: view.version, requestId: randomUUID() });
  for (let i = 0; i < 200 && view.street !== "complete"; i++) {
    view = await call("poker_wait_for_turn", { seconds: 10 });
    if (view.legal && view.actor === seat) view = await call("poker_act", { version: view.version, requestId: randomUUID(), action: view.legal.check ? "check" : "call" });
  }
  // "close" means Python exited and its output pipes are drained.
  const { code } = await bounded(python.done);
  assert.equal(code, 0, err.split("\n").filter(l => !l.includes("si_agent_")).slice(-20).join("\n"));
  const summary = JSON.parse(out.trim().split("\n").at(-1));
  console.log(JSON.stringify({ python: summary, typescript: { protocolVersion: ts.transport?.protocolVersion ?? null, seat, street: view.street }, ms: Date.now() - startedAt }));
  assert.equal(summary.sdkVersion, PYTHON_SDK);
  assert.equal(summary.server, "shipinspector-poker");
  assert.equal(summary.tools.length, 9);
  assert.equal(summary.rulesHaveNoCashValue, true);
  assert.equal(summary.street, "complete");
  assert.equal(summary.ownArchiveCards, 2);
  assert.ok(summary.privacySamples >= 1, "no in-play snapshot was checked for hidden cards");
  assert.equal(summary.privacyLeaks, 0);
  assert.equal(summary.stackTotal + (view.ghost?.carry ?? 0), 2000);
  assert.notEqual(summary.seat, seat);
  assert.doesNotMatch(out, /si_agent_/);
  console.log("python interop: PASS");
} catch (error) {
  console.error(String(error?.stack ?? error).replace(/si_agent_[0-9a-f.-]+/g, "[credential]"));
  process.exitCode = 1;
} finally {
  clearTimeout(timer);
  // Each step has its own bound, so cleanup ends even after the watchdog
  // fired. A step that fails does not skip the others.
  const problems = [];
  for (const [name, step] of [
    ["python", () => python?.stop({ graceMs: 3000, killMs: 5000 })],
    ["typescript client", () => ts && within(ts.close(), 5000)],
    ["gateway", () => gateway?.stop("python-interop")],
    ["api", () => api && within(api.close(), 5000)],
  ]) {
    try { await step(); } catch (error) { problems.push(`${name}: ${error.message}`); }
  }
  if (problems.length) { console.error(`cleanup: ${problems.join("; ")}`); process.exitCode = 1; }
  // The in-memory database (PGlite) keeps an internal timer and has no close
  // method, so exit once every owned process and server above is stopped.
  process.exit(process.exitCode ?? 0);
}
