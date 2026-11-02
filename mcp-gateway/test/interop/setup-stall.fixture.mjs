// SYNTHETIC stall probe, loaded with --import in front of the real python.mjs.
// It replaces only python.mjs's imports of the harness and spawnGroup, and it
// shortens only the 3-minute watchdog. The API here is an empty TCP server and
// the gateway is an idle Node child; together they keep the runner's event loop
// alive, as the real ones do. No game runs, so this is not gameplay evidence.
import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import { writeSync } from "node:fs";
import { registerHooks } from "node:module";
import { createServer } from "node:net";

const ENTRY = new URL("./python.mjs", import.meta.url).href;
const REAL_WATCHDOG_MS = 180000;
const WATCHDOG_MS = 300;
const { INTEROP_STALL_STEP: step, INTEROP_STALL_MODE: mode } = process.env;
// A synchronous write, because python.mjs ends with process.exit().
const record = (event, facts = {}) => writeSync(1, `${JSON.stringify({ event, ...facts })}\n`);

registerHooks({
  resolve(specifier, context, next) {
    if (context.parentURL === ENTRY && (specifier === "../harness.mjs" || specifier === "./group.mjs")) return { url: import.meta.url, shortCircuit: true };
    return next(specifier, context);
  },
});

const realSetTimeout = globalThis.setTimeout;
globalThis.setTimeout = (callback, ms, ...args) => {
  if (ms !== REAL_WATCHDOG_MS) return realSetTimeout(callback, ms, ...args);
  record("watchdog");
  return realSetTimeout(callback, WATCHDOG_MS, ...args);
};

// The chosen step never replies, or replies after the watchdog fires but while
// cleanup still runs. Every other step replies at once.
function held(name, value) {
  record(name);
  if (step !== name) return Promise.resolve(value);
  return mode === "late" ? new Promise(resolve => realSetTimeout(() => resolve(value), WATCHDOG_MS + 100)) : new Promise(() => {});
}

export async function startApi() {
  const server = createServer();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  record("startApi", { port: server.address().port });
  return {
    url: "http://127.0.0.1:1",
    service: {
      create: () => held("create", { id: "synthetic-table", version: 1 }),
      issueAgent: (_id, _host, version, _requestId, name) => held(`grant:${name}`, { token: "synthetic", table: { version: version + 1 } }),
    },
    close: () => new Promise(resolve => server.close(() => { record("api.close"); resolve(); })),
  };
}

export async function startGateway() {
  const child = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], { stdio: "ignore" });
  record("startGateway", { pid: child.pid });
  return {
    endpoint: "http://127.0.0.1:1/mcp",
    async stop() {
      // Keep cleanup open past a late reply, so a resumed setup would show.
      await new Promise(resolve => realSetTimeout(resolve, 400));
      const exited = new Promise(resolve => child.once("exit", resolve));
      child.kill("SIGTERM");
      await exited;
      record("gateway.stop");
    },
  };
}

// The step after setup. No client starts: the runner sees a failed spawn.
export function spawnGroup() {
  record("spawn");
  const started = Promise.reject(new Error("synthetic spawn failure"));
  started.catch(() => {});
  return { child: { stdout: new EventEmitter(), stderr: new EventEmitter() }, started, stop: async () => record("python.stop") };
}

export async function connect() {
  record("connect");
  throw new Error("synthetic connect failure");
}

export const caller = () => async () => { throw new Error("synthetic call failure"); };
