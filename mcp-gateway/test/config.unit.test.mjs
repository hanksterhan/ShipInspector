// Node unit tests for pure gateway helpers. These do not run in workerd;
// the runtime checks are in the other test files.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ConfigError, LIMITERS, readConfig } from "../src/config.mjs";
import { API_MESSAGES, upstreamMessage } from "../src/upstream.mjs";

const limiter = { limit: async () => ({ success: true }) };
const production = () => ({
  UPSTREAM_ORIGIN: "https://www.sipoker.club", ALLOWED_HOSTS: "mcp.sipoker.club", ALLOWED_ORIGINS: "", PUBLIC_MCP_URL: "https://mcp.sipoker.club/mcp",
  CLIENT_IP_HEADER: "cf-connecting-ip", ALLOW_LOOPBACK_HTTP: "false", ...Object.fromEntries(Object.values(LIMITERS).map(name => [name, limiter])),
});
const rejects = (change, setting) => {
  const env = { ...production(), ...change };
  assert.throws(() => readConfig(env), error => {
    assert.ok(error instanceof ConfigError); assert.equal(error.setting, setting);
    for (const value of Object.values(change)) if (typeof value === "string" && value.length > 3) assert.ok(!error.message.includes(value));
    return true;
  });
};

test("accepts the production settings", () => {
  const config = readConfig(production());
  assert.equal(config.upstream, "https://www.sipoker.club");
  assert.deepEqual([...config.hosts], ["mcp.sipoker.club"]);
  assert.equal(config.publicUrl, "https://mcp.sipoker.club/mcp");
});

test("rejects unsafe upstream origins", () => {
  for (const value of ["https://user:pw@www.sipoker.club", "https://www.sipoker.club/api", "https://www.sipoker.club?x=1", "https://www.sipoker.club#x",
    "http://www.sipoker.club", "http://127.0.0.1:3000", "https://WWW.SIPOKER.CLUB", "ftp://www.sipoker.club", "www.sipoker.club", "", "https://www.sipoker.club/../"]) {
    rejects({ UPSTREAM_ORIGIN: value }, "UPSTREAM_ORIGIN");
  }
  rejects({ UPSTREAM_ORIGIN: undefined }, "UPSTREAM_ORIGIN");
  // Cleartext needs the explicit flag and a loopback host.
  assert.equal(readConfig({ ...production(), ALLOW_LOOPBACK_HTTP: "true", UPSTREAM_ORIGIN: "http://127.0.0.1:3000" }).upstream, "http://127.0.0.1:3000");
  rejects({ ALLOW_LOOPBACK_HTTP: "true", UPSTREAM_ORIGIN: "http://10.0.0.5:3000" }, "UPSTREAM_ORIGIN");
  rejects({ ALLOW_LOOPBACK_HTTP: "yes" }, "ALLOW_LOOPBACK_HTTP");
});

test("rejects bad hosts, origins, public URL, and address source", () => {
  for (const value of ["", "*.sipoker.club", "mcp.sipoker.club/evil", "https://mcp.sipoker.club", "mcp.sipoker.club:abc"]) rejects({ ALLOWED_HOSTS: value }, "ALLOWED_HOSTS");
  for (const value of ["*", "https://app.example/path", "null", "app.example", "http://app.example"]) rejects({ ALLOWED_ORIGINS: value }, "ALLOWED_ORIGINS");
  for (const value of ["https://mcp.sipoker.club", "https://mcp.sipoker.club/mcp?x=1", "http://mcp.sipoker.club/mcp"]) rejects({ PUBLIC_MCP_URL: value }, "PUBLIC_MCP_URL");
  for (const value of ["x-forwarded-for", "", undefined]) rejects({ CLIENT_IP_HEADER: value }, "CLIENT_IP_HEADER");
});

test("fails closed when any rate-limit binding is missing", () => {
  for (const name of Object.values(LIMITERS)) {
    rejects({ [name]: undefined }, name);
    rejects({ [name]: {} }, name);
  }
});

test("passes through only exact known API messages", () => {
  assert.equal(upstreamMessage(409, { error: "The table changed. Refresh before acting." }), "The table changed. Refresh before acting.");
  assert.equal(upstreamMessage(409, { error: "This request ID was used for a different action." }), "This request ID was used for a different action.");
  assert.equal(upstreamMessage(400, { error: "Choose a legal raise amount." }), "Choose a legal raise amount.");
  assert.equal(upstreamMessage(404, { error: "Completed hand record not found." }), "Completed hand record not found.");
  // A known message with the wrong status, or changed at all, is not passed.
  assert.equal(upstreamMessage(400, { error: "It is not your turn." }), "The poker API refused this request. Read the table and check your action.");
  assert.equal(upstreamMessage(409, { error: "It is not your turn. " }), "The table refused this action. Read the table again before acting.");
  assert.equal(upstreamMessage(409, { error: "It is not your turn. password=x" }), "The table refused this action. Read the table again before acting.");
  // Unknown short text, of any kind, gets a fixed message.
  for (const error of ["Database password=synthetic-private-value at /var/task/api.js:12", "Raise to at least 40.", "Your cards are As Kd", "token=abc", "x", "Invalid uuid"]) {
    for (const status of [400, 403, 404, 409, 410, 422, 429]) assert.ok(!upstreamMessage(status, { error }).includes(error), `${status} ${error}`);
  }
  assert.equal(upstreamMessage(400, { error: "Database password=synthetic-private-value at /var/task/api.js:12" }), "The poker API refused this request. Read the table and check your action.");
  assert.equal(upstreamMessage(422, { error: "token=abc" }), "The poker API refused the request (422).");
  assert.equal(upstreamMessage(418, { error: "teapot" }), "The poker API refused the request (418).");
  assert.equal(upstreamMessage(401, { error: "bad si_agent_x token" }), "Agent credential is invalid, expired, or revoked.");
  assert.equal(upstreamMessage(400, { error: { nested: "Choose a legal raise amount." } }), "The poker API refused this request. Read the table and check your action.");
  assert.equal(upstreamMessage(400, null), "The poker API refused this request. Read the table and check your action.");
  assert.equal(upstreamMessage(500, { error: "TypeError at /var/task" }), "The poker API is unavailable. Try again shortly.");
  assert.equal(upstreamMessage(503, { error: "The table service is unavailable. Try again shortly." }), "The poker API is unavailable. Try again shortly.");
});

// Every allowed message must still be one the API sends with that status, so
// a renamed API message fails here instead of silently becoming generic.
test("every allowed message matches a TableError in the API source", () => {
  const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "api", "_lib");
  const source = ["poker-table/engine.ts", "poker-table/service.ts", "handlers/tables/index.ts"].map(file => readFileSync(join(dir, file), "utf8")).join("\n");
  const thrown = new Set([...source.matchAll(/TableError\("([^"]+)"(?:, (\d{3}))?\)/g)].map(([, message, status = "400"]) => `${status} ${message}`));
  for (const [status, messages] of Object.entries(API_MESSAGES)) for (const message of messages) assert.ok(thrown.has(`${status} ${message}`), `${status} ${message}`);
});
