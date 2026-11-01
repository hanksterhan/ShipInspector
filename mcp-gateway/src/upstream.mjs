// The only path from the gateway to the table API. The origin comes from
// trusted config, the table ID from the checked credential, and each path
// from a fixed list. Redirects, HTML, and oversized bodies are errors, and
// nothing is retried: a lost command is safe to retry only with the same
// requestId, which only the agent can choose.
import { SUPPORTED_RULES } from "../../mcp/src/tools.mjs";

export const MAX_UPSTREAM_BYTES = 512 * 1024;
export const UPSTREAM_TIMEOUT_MS = 12000;
const PATH = /^(?:|\/session|\/commands|\/hands\/[1-9][0-9]{0,8})$/;
const PASS_THROUGH = new Set([400, 401, 403, 404, 409, 410, 422, 426, 429]);
const GENERIC = {
  401: "Agent credential is invalid, expired, or revoked.",
  403: "This credential cannot use that table.",
  404: "Not found.",
  426: "This gateway does not support the table's rules yet.",
  429: "Too many requests. Wait a few seconds.",
};
const UNEXPECTED = "The poker API returned an unexpected response. Try again shortly.";
const UNREACHABLE = "Could not reach the poker API. Retry with the same requestId if an action was sent.";

export class GatewayError extends Error {
  constructor(status, message) { super(message); this.name = "GatewayError"; this.status = status; }
}

// Pass through the API's own short game messages (for example a raise
// minimum) for client errors. Anything else gets a fixed message.
export function upstreamMessage(status, data) {
  const text = data && typeof data.error === "string" ? data.error : "";
  if (PASS_THROUGH.has(status) && text.length > 0 && text.length <= 200 && /^[\x20-\x7e -ɏ–—‘’]+$/.test(text) && !/si_agent_|bearer|<|>/i.test(text)) return text;
  if (GENERIC[status]) return GENERIC[status];
  return status >= 500 ? "The poker API is unavailable. Try again shortly." : `The poker API refused the request (${status}).`;
}

export function mediaType(value) {
  return (value || "").split(";")[0].trim().toLowerCase();
}

// Read at most `max` bytes, whether or not the sender declared a length.
export async function readLimited(stream, max, declared) {
  if (declared !== null && declared !== undefined && (!/^\d+$/.test(declared) || Number(declared) > max)) {
    await stream?.cancel().catch(() => {});
    return null;
  }
  if (!stream) return new Uint8Array(0);
  const reader = stream.getReader(); const chunks = []; let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) { await reader.cancel().catch(() => {}); return null; }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

function anySignal(signals) {
  const controller = new AbortController();
  for (const signal of signals) {
    if (!signal) continue;
    if (signal.aborted) { controller.abort(signal.reason); break; }
    signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
  }
  return controller.signal;
}

export function createUpstream({ origin, tableId, token, credentialKey, limiters, budget, signal, fetchImpl = fetch, timeoutMs = UPSTREAM_TIMEOUT_MS }) {
  const endpoint = `${origin}/api/tables/${tableId}`;
  async function request(path, body, callSignal) {
    if (!PATH.test(path)) throw new GatewayError(400, "Unknown poker API path.");
    if (budget.used >= budget.max) throw new GatewayError(429, "This request reached its poker API call limit. Call the tool again.");
    budget.used++;
    // Count every API call, including each poll inside one wait.
    const [own, total] = await Promise.all([limiters.upstream.limit({ key: credentialKey }), limiters.gateway.limit({ key: "all" })]);
    if (!own.success || !total.success) throw new GatewayError(429, "Too many poker API calls. Wait a few seconds before the next call.");
    const timer = new AbortController();
    const timeout = setTimeout(() => timer.abort(new Error("timeout")), timeoutMs);
    const combined = anySignal([signal, callSignal, timer.signal]);
    try {
      let response;
      try {
        response = await fetchImpl(endpoint + path, {
          method: body ? "POST" : "GET", redirect: "manual",
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "X-Poker-Rules": SUPPORTED_RULES, ...(body ? { "Content-Type": "application/json" } : {}) },
          body: body ? JSON.stringify(body) : undefined, signal: combined,
        });
      } catch {
        throw new GatewayError(502, UNREACHABLE);
      }
      if ((response.status >= 300 && response.status < 400) || response.type === "opaqueredirect" || mediaType(response.headers.get("content-type")) !== "application/json") {
        await response.body?.cancel().catch(() => {});
        throw new GatewayError(502, UNEXPECTED);
      }
      let data;
      try {
        const bytes = await readLimited(response.body, MAX_UPSTREAM_BYTES, response.headers.get("content-length"));
        if (bytes === null) throw new Error("too large");
        data = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
      } catch {
        throw new GatewayError(502, combined.aborted ? UNREACHABLE : UNEXPECTED);
      }
      if (!response.ok) throw new GatewayError(response.status, upstreamMessage(response.status, data));
      if (!data || typeof data !== "object" || Array.isArray(data)) throw new GatewayError(502, UNEXPECTED);
      return data;
    } finally { clearTimeout(timeout); }
  }
  return { request };
}
