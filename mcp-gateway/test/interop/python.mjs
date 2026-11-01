// Opt-in interop check: the official MCP Python SDK and the official
// TypeScript SDK play one hand against each other through the gateway in
// local workerd, against the real API. Needs `uv`, which downloads the pinned
// Python SDK from PyPI on first use. Run: npm run test:python-client
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { caller, connect, startApi, startGateway } from "../harness.mjs";

// The Python SDK version this check was verified with.
const PYTHON_SDK = "1.30.0";
const LIMIT_MS = 180000;

const api = await startApi();
const gateway = await startGateway({ upstream: api.url });
let ts; let child;
try {
  const host = `interop-${randomUUID()}`;
  let view = await api.service.create(host, { gameMode: "red-river-holdem", ghost: true, name: "Interop", maxPlayers: 2, smallBlind: 5, bigBlind: 10, startingStack: 1000, turnSeconds: 120 });
  const py = await api.service.issueAgent(view.id, host, view.version, randomUUID(), "Python");
  const tsGrant = await api.service.issueAgent(view.id, host, py.table.version, randomUUID(), "TypeScript");
  const script = fileURLToPath(new URL("./python_client.py", import.meta.url));
  child = spawn("uv", ["run", "--no-project", "--python", "3.12", "--with", `mcp==${PYTHON_SDK}`, "python", script, gateway.endpoint],
    { env: { ...process.env, SEAT_CREDENTIAL: py.token }, stdio: ["ignore", "pipe", "pipe"] });
  let out = ""; let err = "";
  child.stdout.on("data", c => { out += c; }); child.stderr.on("data", c => { err += c; });
  // A missing `uv` is a spawn error, not an exit code: fail at once.
  const exited = new Promise(resolve => child.once("exit", (code, signal) => resolve({ code, signal })));
  await new Promise((resolve, reject) => {
    child.once("spawn", resolve);
    child.once("error", error => reject(new Error(`could not start uv: ${error.code ?? "spawn error"}`)));
  });
  const deadline = Date.now() + LIMIT_MS;
  // The TypeScript client takes the other seat and deals once both are ready.
  ts = await connect(gateway.endpoint, tsGrant.token, "typescript");
  const call = caller(ts);
  view = await call("poker_get_table");
  const seat = view.yourSeat;
  view = await call("poker_ready", { version: view.version, requestId: randomUUID(), ready: true });
  for (let i = 0; i < 200 && !view.canDeal && child.exitCode === null; i++) { await new Promise(r => setTimeout(r, 300)); view = await call("poker_get_table"); }
  assert.equal(view.canDeal, true, "the Python client never marked ready");
  view = await call("poker_deal", { version: view.version, requestId: randomUUID() });
  for (let i = 0; i < 200 && view.street !== "complete" && Date.now() < deadline; i++) {
    view = await call("poker_wait_for_turn", { seconds: 10 });
    if (view.legal && view.actor === seat) view = await call("poker_act", { version: view.version, requestId: randomUUID(), action: view.legal.check ? "check" : "call" });
  }
  let timer;
  const { code } = await Promise.race([exited, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`Python client did not finish in ${LIMIT_MS} ms`)), Math.max(1000, deadline - Date.now())); })])
    .finally(() => clearTimeout(timer));
  assert.equal(code, 0, err.split("\n").filter(l => !l.includes("si_agent_")).slice(-20).join("\n"));
  const summary = JSON.parse(out.trim().split("\n").at(-1));
  console.log(JSON.stringify({ python: summary, typescript: { protocolVersion: ts.transport?.protocolVersion ?? null, seat, street: view.street } }));
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
} finally {
  if (child && child.exitCode === null && child.signalCode === null) {
    child.kill("SIGTERM");
    await new Promise(resolve => { child.once("exit", resolve); setTimeout(resolve, 5000); });
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
  }
  await ts?.close();
  await gateway.stop("python-interop");
  await api.close();
}
