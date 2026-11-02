// Stall check of the real interop entrypoint, python.mjs, in its own process.
// The harness below it is SYNTHETIC (see interop/setup-stall.fixture.mjs) and
// the watchdog is shortened to 300 ms, so this is not gameplay evidence. Real
// play runs with: npm run test:python-client
import { test } from "node:test";
import assert from "node:assert/strict";
import nodeModule from "node:module";
import { connect } from "node:net";
import { fileURLToPath } from "node:url";
import { spawnGroup } from "./interop/group.mjs";

const ENTRY = fileURLToPath(new URL("./interop/python.mjs", import.meta.url));
const FIXTURE = new URL("./interop/setup-stall.fixture.mjs", import.meta.url).href;
const BOUND_MS = 5000;
// The fixture needs module.registerHooks(), which came in Node.js 22.15.
const options = typeof nodeModule.registerHooks === "function" ? {} : { skip: "needs Node.js 22.15 or later" };
const BEFORE_SETUP = ["watchdog", "startApi", "startGateway"];

async function run(step, mode = "never") {
  const group = spawnGroup(process.execPath, ["--import", FIXTURE, ENTRY],
    { env: { ...process.env, INTEROP_STALL_STEP: step, INTEROP_STALL_MODE: mode }, stdio: ["ignore", "pipe", "pipe"] });
  let out = ""; let err = "";
  group.child.stdout.on("data", chunk => { out += chunk; }); group.child.stderr.on("data", chunk => { err += chunk; });
  let timer; let exit; let left;
  try {
    exit = await Promise.race([group.done, new Promise(resolve => { timer = setTimeout(() => resolve(null), BOUND_MS); })]);
    left = group.alive();
  } finally {
    clearTimeout(timer);
    // If the runner hung, end it and its gateway child so no test process is left.
    await group.stop({ graceMs: 500, killMs: 3000 });
  }
  const events = out.trim().split("\n").filter(Boolean).map(line => JSON.parse(line));
  return { exit, left, err, events, steps: events.map(event => event.event), port: events.find(event => event.event === "startApi")?.port };
}

function refused(port) {
  return new Promise((resolve, reject) => {
    const socket = connect(port, "127.0.0.1");
    socket.once("connect", () => { socket.destroy(); reject(new Error(`port ${port} still accepts connections`)); });
    socket.once("error", error => { error.code === "ECONNREFUSED" ? resolve() : reject(error); });
  });
}

async function cleanFailure(outcome, steps, reason) {
  assert.notEqual(outcome.exit, null, `the runner did not exit in ${BOUND_MS} ms; it reached: ${outcome.steps.join(", ")}`);
  assert.equal(outcome.exit.code, 1);
  assert.match(outcome.err, reason);
  assert.deepEqual(outcome.steps, steps);
  assert.equal(outcome.left, false, "a child of the runner is still running");
  await refused(outcome.port);
}

const stalls = [
  ["create", ["create"]],
  ["grant:Python", ["create", "grant:Python"]],
  ["grant:TypeScript", ["create", "grant:Python", "grant:TypeScript"]],
];
for (const [step, reached] of stalls) {
  for (const mode of ["never", "late"]) test(`the watchdog ends interop setup held at ${step} (reply: ${mode}): cleanup runs and nothing follows`, options, async () => {
    await cleanFailure(await run(step, mode), [...BEFORE_SETUP, ...reached, "gateway.stop", "api.close"], /did not finish in 180000 ms/);
  });
}

// Proves the checks above can see a later step: with no stall, setup reaches
// the client spawn, which the fixture fails.
test("control: with no stall, interop setup goes on to the client spawn", options, async () => {
  await cleanFailure(await run("none"), [...BEFORE_SETUP, "create", "grant:Python", "grant:TypeScript", "spawn", "python.stop", "gateway.stop", "api.close"], /synthetic spawn failure/);
});
