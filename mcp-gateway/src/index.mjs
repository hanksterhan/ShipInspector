// Remote MCP gateway for private poker tables. Each POST builds a fresh MCP
// server, transport, and API client for one credential, so nothing
// authenticated is shared between requests. The table API stays the only
// authority: the gateway checks the credential there on every request.
import { createPokerMcpServer, TOOL_NAMES } from "../../mcp/src/tools.mjs";
import { JSONRPCMessageSchema, SUPPORTED_PROTOCOL_VERSIONS, WebStandardStreamableHTTPServerTransport } from "../../mcp/src/http.mjs";
import { ConfigError, readConfig } from "./config.mjs";
import { homePage, llmsText } from "./docs.mjs";
import { createUpstream, GatewayError, mediaType, readLimited } from "./upstream.mjs";

// The entry module may export only handlers, so these limits stay private.
const MAX_BODY_BYTES = 64 * 1024;
// One credential check plus at most 25 one-second polls and a few spare calls.
const MAX_UPSTREAM_CALLS = 30;
const CREDENTIAL = /^Bearer (si_agent_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.[0-9a-f]{64})$/;
const SECURITY_HEADERS = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };
const RPC_METHODS = new Set(["initialize", "ping", "tools/list", "tools/call", "resources/list", "resources/templates/list", "resources/read", "prompts/list", "notifications/initialized", "notifications/cancelled"]);

async function sha256(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function json(status, body, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...SECURITY_HEADERS, "Content-Type": "application/json", ...headers } });
}
// Errors use the JSON-RPC shape so MCP clients can show the message.
function failure(status, message, headers = {}, code = -32000) {
  return json(status, { jsonrpc: "2.0", error: { code, message }, id: null }, headers);
}
function text(status, body, type, headers = {}, head = false) {
  return new Response(head ? null : body, { status, headers: { ...SECURITY_HEADERS, "Content-Type": type, ...headers } });
}
const unauthorized = message => failure(401, message, { "WWW-Authenticate": 'Bearer realm="shipinspector-poker"' });

export default {
  async fetch(request, env) {
    const started = Date.now(); const facts = {};
    let response;
    try { response = await handle(request, env, facts); }
    catch (error) {
      facts.error = error instanceof Error ? error.name : "unknown";
      response = failure(500, "The gateway could not process this request.");
    }
    // Log only fixed facts: never headers, bodies, query strings, or tool arguments.
    console.log(JSON.stringify({ event: "request", route: facts.route ?? "other", method: request.method, status: response.status, ms: Date.now() - started,
      ...(facts.rpc ? { rpc: facts.rpc } : {}), ...(facts.tool ? { tool: facts.tool } : {}), ...(facts.credential ? { credential: facts.credential } : {}),
      ...(facts.upstreamCalls ? { upstreamCalls: facts.upstreamCalls } : {}), ...(facts.error ? { error: facts.error } : {}) }));
    return response;
  },
};

async function handle(request, env, facts) {
  let config;
  try { config = readConfig(env); }
  catch (error) {
    if (!(error instanceof ConfigError)) throw error;
    console.error(JSON.stringify({ event: "config_error", setting: error.setting }));
    return failure(503, "The gateway is not configured.");
  }
  let url;
  try { url = new URL(request.url); } catch { url = null; }
  if (!url || !config.hosts.has(url.host.toLowerCase())) { facts.route = "bad-host"; return failure(421, "Unknown host."); }
  // CF-Connecting-IP is set by Cloudflare's edge. Local configs use "none" so
  // a caller cannot pick its own bucket; X-Forwarded-For is never read.
  const ip = config.ipHeader === "cf-connecting-ip" ? request.headers.get("cf-connecting-ip") || "unknown" : "local";
  try {
    if (!(await config.limiters.admission.limit({ key: await sha256(`ip:${ip}`) })).success) {
      facts.route = "limited";
      return failure(429, "Too many requests. Wait a minute and try again.", { "Retry-After": "60" });
    }
  } catch { return failure(503, "The gateway cannot check request limits right now."); }
  const head = request.method === "HEAD";
  if (url.pathname === "/" || url.pathname === "/llms.txt") {
    facts.route = "docs";
    if (request.method !== "GET" && !head) return text(405, "Method not allowed.\n", "text/plain; charset=utf-8", { Allow: "GET, HEAD" });
    const cors = { "Access-Control-Allow-Origin": "*" };
    if (url.pathname === "/llms.txt") return text(200, llmsText(config.publicUrl), "text/plain; charset=utf-8", cors, head);
    return text(200, homePage(config.publicUrl), "text/html; charset=utf-8", { ...cors, "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'", "X-Frame-Options": "DENY" }, head);
  }
  if (url.pathname !== "/mcp") { facts.route = "not-found"; return text(404, "Not found.\n", "text/plain; charset=utf-8", {}, head); }
  facts.route = "mcp";
  return handleMcp(request, config, facts);
}

async function handleMcp(request, config, facts) {
  const origin = request.headers.get("origin");
  // Browsers send Origin. Only exact configured origins may call; tools that
  // send no Origin, such as SDK clients, are not browsers and may call.
  if (origin !== null && !config.origins.has(origin)) return failure(403, "Origin not allowed.");
  const cors = origin ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {};
  if (request.method === "OPTIONS") {
    if (!origin || request.headers.get("access-control-request-method") !== "POST") return failure(405, "Method not allowed.", { Allow: "POST" });
    return new Response(null, { status: 204, headers: { ...SECURITY_HEADERS, ...cors, "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, Mcp-Protocol-Version", "Access-Control-Max-Age": "600" } });
  }
  if (request.method !== "POST") return failure(405, "This server keeps no session. Send each MCP message with POST.", { ...cors, Allow: "POST" });
  const respond = response => { for (const [k, v] of Object.entries({ ...SECURITY_HEADERS, ...cors })) response.headers.set(k, v); return response; };

  // Stop all API work once the runtime reports a disconnect
  // (enable_request_signal), even one reported before this point. Local
  // workerd does not report one, so a wait's deadline and call cap are the
  // bounds there. A command already sent is not rolled back.
  const cancel = new AbortController();
  const disconnect = () => cancel.abort(new Error("client disconnected"));
  if (request.signal?.aborted) disconnect(); else request.signal?.addEventListener?.("abort", disconnect, { once: true });
  const cancelled = () => {
    if (!cancel.signal.aborted) return null;
    facts.error = "cancelled";
    return respond(failure(499, "The request was cancelled."));
  };

  // Cheap checks first: none of these reach the table API.
  const authorization = request.headers.get("authorization");
  if (!authorization) return respond(unauthorized("Send your seat credential in the Authorization header as a Bearer token."));
  const match = authorization.length <= 200 ? CREDENTIAL.exec(authorization) : null;
  if (!match) return respond(unauthorized("The Authorization header does not hold a seat credential."));
  const [, token, tableId] = match;
  if (mediaType(request.headers.get("content-type")) !== "application/json") return respond(failure(415, "Content-Type must be application/json."));
  const accept = request.headers.get("accept") || "";
  if (!accept.includes("application/json") || !accept.includes("text/event-stream")) return respond(failure(406, "Accept must include application/json and text/event-stream."));
  const protocol = request.headers.get("mcp-protocol-version");
  if (protocol !== null && !SUPPORTED_PROTOCOL_VERSIONS.includes(protocol)) return respond(failure(400, "Unsupported MCP protocol version."));
  let bytes;
  try { bytes = await readLimited(request.body, MAX_BODY_BYTES, request.headers.get("content-length"), cancel.signal); }
  catch { return cancelled() ?? respond(failure(400, "The request body could not be read.")); }
  if (bytes === null) return respond(failure(413, `Request body exceeds ${MAX_BODY_BYTES} bytes.`));
  let message;
  try { message = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { return respond(failure(400, "Parse error: send one JSON-RPC message.", {}, -32700)); }
  // The SDK transport's own schema, so the gateway refuses exactly what the
  // transport would refuse, but before any API call.
  if (Array.isArray(message) || !JSONRPCMessageSchema.safeParse(message).success) {
    return respond(failure(400, "Send exactly one JSON-RPC 2.0 message in each request.", {}, -32600));
  }
  if (typeof message.method === "string") facts.rpc = RPC_METHODS.has(message.method) ? message.method : "other";
  if (message.method === "tools/call" && TOOL_NAMES.includes(message.params?.name)) facts.tool = message.params.name;

  const credentialKey = await sha256(`credential:${token}`);
  facts.credential = credentialKey.slice(0, 12);
  try {
    if (!(await config.limiters.credential.limit({ key: credentialKey })).success) {
      return respond(failure(429, "Too many requests for this credential. Wait a minute and try again.", { "Retry-After": "60" }));
    }
  } catch { return respond(failure(503, "The gateway cannot check request limits right now.")); }
  const early = cancelled();
  if (early) return early;

  const budget = { used: 0, max: MAX_UPSTREAM_CALLS };
  const upstream = createUpstream({ origin: config.upstream, tableId, token, credentialKey, limiters: config.limiters, budget, signal: cancel.signal });
  try {
    try { await upstream.request("/session"); }
    catch (error) {
      if (!(error instanceof GatewayError)) throw error;
      if (cancel.signal.aborted) return cancelled();
      if (error.status === 401 || error.status === 404) return respond(unauthorized("Agent credential is invalid, expired, or revoked."));
      if (error.status === 403) return respond(failure(403, "This credential cannot use this table."));
      if (error.status === 429) return respond(failure(429, error.message, { "Retry-After": "10" }));
      if (error.status === 426) return respond(failure(503, "This gateway does not support the table's rules yet."));
      return respond(failure(502, "The poker API is unavailable. Try again shortly."));
    }
    const late = cancelled();
    if (late) return late;
    // Leave one call spare so a wait never ends on a refused poll.
    const server = createPokerMcpServer({ request: upstream.request, canPoll: () => budget.used < budget.max - 1, signal: cancel.signal });
    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    try {
      await server.connect(transport);
      return respond(await transport.handleRequest(request, { parsedBody: message }));
    } finally {
      await transport.close().catch(() => {});
      await server.close().catch(() => {});
    }
  } finally { facts.upstreamCalls = budget.used; }
}
