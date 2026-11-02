// Local test bench: the real API router and table service on an in-memory
// PGlite database, the gateway in Wrangler's local workerd runtime, and the
// official MCP TypeScript SDK client. Nothing here contacts a remote service.
import { createServer } from "node:net";
import { request as httpRequest } from "node:http";
import { createRequire } from "node:module";
import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { devArgs, root, runWrangler } from "../scripts/offline.mjs";

const repo = join(root, "..");
// Two test runs in one checkout must not share files: see variantConfig().
const runId = `run-${Date.now()}-${process.pid}-${randomBytes(4).toString("hex")}`;
export const evidenceDir = process.env.GATEWAY_EVIDENCE_DIR || join(root, ".wrangler", "test-logs", runId);
const apiRequire = createRequire(join(repo, "api", "package.json"));
const mcpRequire = createRequire(join(repo, "mcp", "package.json"));
const sdk = path => import(mcpRequire.resolve(`@modelcontextprotocol/sdk/${path}`));
export const { Client } = await sdk("client/index.js");
export const { StreamableHTTPClientTransport } = await sdk("client/streamableHttp.js");
export const RULES = "holdem:1,red-river-holdem:1,ghost:1";

export async function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer().listen(0, "127.0.0.1", () => { const { port } = server.address(); server.close(() => resolve(port)); }).on("error", reject);
  });
}

// The production Vercel router and table handler. Every request is recorded
// so tests can count table API calls and check what the gateway sent.
export async function startApi() {
  process.env.POKER_STORE_DIR = "memory://";
  process.env.NODE_ENV = "test";
  const express = apiRequire("express");
  const { default: router } = apiRequire("./dist/api/index.js");
  const { getTableStore } = apiRequire("./dist/api/_lib/poker-table/store.js");
  const { TableService } = apiRequire("./dist/api/_lib/poker-table/service.js");
  const store = await getTableStore();
  const calls = [];
  const app = express();
  app.use(express.json({ limit: "100kb" }));
  app.use((req, _res, next) => {
    calls.push({ method: req.method, path: req.path, rules: req.headers["x-poker-rules"], authorization: req.headers.authorization, body: req.body, at: Date.now() });
    next();
  });
  app.use((req, res, next) => Promise.resolve(router(req, res)).catch(next));
  const port = await freePort();
  const http = await new Promise(resolve => { const s = app.listen(port, "127.0.0.1", () => resolve(s)); });
  return {
    url: `http://127.0.0.1:${port}`, store, service: new TableService(store), calls,
    async close() { http.closeAllConnections(); await new Promise(resolve => http.close(resolve)); },
  };
}

// Write a variant of wrangler.toml for one test (for example tiny limits).
// `wrangler dev` reloads when its config file changes and answers an open
// POST with its own 503, so each call writes a new file that no other test
// or run writes again.
export function variantConfig(name, edit) {
  const dir = join(root, ".wrangler", "test-configs");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${name}-${runId}-${randomBytes(4).toString("hex")}.toml`);
  writeFileSync(file, edit(readFileSync(join(root, "wrangler.toml"), "utf8")).replace('main = "src/index.mjs"', `main = "${join(root, "src", "index.mjs")}"`));
  return file;
}

// Start the gateway with `wrangler dev` (workerd through Miniflare). An abort
// of `signal` while it starts stops Wrangler and throws.
export async function startGateway({ upstream, config = "wrangler.toml", vars = {}, ready = 200, signal }) {
  const port = await freePort();
  // Wrangler keeps local rate-limit counts on disk. A fresh directory for each
  // gateway keeps one test's counts out of the next test's buckets.
  const state = join(root, ".wrangler", "test-state", `${runId}-${port}`);
  rmSync(state, { recursive: true, force: true });
  const child = runWrangler([...devArgs({ port, upstream, config, vars }), "--persist-to", state], { stdio: ["ignore", "pipe", "pipe"] });
  let output = "";
  child.stdout.on("data", chunk => { output += chunk; });
  child.stderr.on("data", chunk => { output += chunk; });
  const url = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 60000;
  for (;;) {
    if (child.exitCode !== null) throw new Error(`wrangler dev exited early:\n${output}`);
    // A deliberately broken config answers 503 once the runtime is up.
    try { if ((await fetch(`${url}/llms.txt`, { signal: AbortSignal.timeout(5000) })).status === ready) break; } catch {}
    if (Date.now() > deadline || signal?.aborted) {
      child.kill("SIGTERM");
      throw new Error(signal?.aborted ? "wrangler dev start was stopped" : `wrangler dev did not start:\n${output}`);
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  return {
    url, endpoint: `${url}/mcp`, logs: () => output,
    // Runtime logs arrive a little after the response.
    async waitForLog(pattern, ms = 5000) {
      const end = Date.now() + ms;
      while (!pattern.test(output) && Date.now() < end) await new Promise(resolve => setTimeout(resolve, 100));
      return output;
    },
    async stop(name) {
      // Keep the runtime output as evidence. It is checked for secrets in the tests.
      if (name) { mkdirSync(evidenceDir, { recursive: true }); writeFileSync(join(evidenceDir, `${name}.gateway.log`), output); }
      if (child.exitCode === null) {
        const exited = new Promise(resolve => child.once("exit", resolve));
        child.kill("SIGTERM");
        let timer;
        await Promise.race([exited, new Promise(resolve => { timer = setTimeout(resolve, 5000); })]);
        clearTimeout(timer);
        if (child.exitCode === null) child.kill("SIGKILL");
      }
      rmSync(state, { recursive: true, force: true });
      if (config.startsWith(join(root, ".wrangler", "test-configs"))) rmSync(config, { force: true });
    },
  };
}

export async function connect(endpoint, token, name = "gateway-test") {
  const client = new Client({ name, version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(endpoint), { requestInit: { headers: { Authorization: `Bearer ${token}` } } });
  await client.connect(transport, { timeout: 15000 });
  return client;
}

export function caller(client) {
  return async (name, args = {}, timeout = 40000) => {
    const response = await client.callTool({ name, arguments: args }, undefined, { timeout });
    if (response.isError) throw new Error(response.content?.[0]?.text || "tool error");
    return response.structuredContent;
  };
}

// Raw JSON-RPC POST, for checks that the SDK client would never send.
export function rpc(endpoint, body, { token, headers = {}, method = "POST" } = {}) {
  return fetch(endpoint, { method, headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream",
    ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers }, body: method === "POST" ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined });
}
// Chips a player gained or lost in one hand, from the archived events alone.
export function eventNet(record, seat) {
  let net = 0;
  for (const e of record.events) {
    if ((e.type === "blind" || e.type === "action") && e.seat === seat) net -= e.amount;
    if (e.type === "refund" && e.seat === seat) net += e.amount;
    if (e.type === "award") net += e.award.winners.filter(w => w.seat === seat).reduce((sum, w) => sum + w.amount, 0);
  }
  return net;
}
export function ghostTake(record) {
  return record.events.filter(e => e.type === "award").reduce((sum, e) => sum + (e.award.ghost?.amount ?? 0), 0);
}

// node:http lets a test set any Host header and stream a chunked body with no
// Content-Length, which fetch does not allow.
export function rawHttp(url, { method = "POST", headers = {}, chunks = [] } = {}) {
  return new Promise((resolve, reject) => {
    const req = httpRequest(url, { method, headers }, res => {
      let body = ""; res.setEncoding("utf8");
      res.on("data", chunk => { body += chunk; });
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on("error", reject);
    for (const chunk of chunks) req.write(chunk);
    req.end();
  });
}
export const initialize = { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "raw", version: "1" } } };
