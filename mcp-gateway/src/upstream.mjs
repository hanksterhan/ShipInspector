// The only path from the gateway to the table API. The origin comes from
// trusted config, the table ID from the checked credential, and each path
// from a fixed list. Redirects, HTML, and oversized bodies are errors, and
// nothing is retried: a lost command is safe to retry only with the same
// requestId, which only the agent can choose.
import { anySignal, SUPPORTED_RULES } from "../../mcp/src/tools.mjs";

export const MAX_UPSTREAM_BYTES = 512 * 1024;
export const UPSTREAM_TIMEOUT_MS = 12000;
// A rate-limit binding answers from a local cache, so a slow reply is a fault.
export const LIMIT_TIMEOUT_MS = 3000;
const PATH = /^(?:|\/session|\/commands|\/hands\/[1-9][0-9]{0,8})$/;
// The API's own messages that an agent can act on, by status. A message must
// match exactly. Any other text, such as a validation detail or a server
// fault, gets the fixed message for its status.
export const API_MESSAGES = Object.freeze({
  400: ["You must call or fold.", "There is no bet to call.", "Choose a legal raise amount.", "Add play chips before the next hand.", "You can refill when your stack is empty."],
  403: ["This credential belongs to a different table.", "Join this table first.", "Join this private table to view the game.", "Join this private table to view its hands.",
    "Take a seat and mark ready first.", "Take a seat first."],
  404: ["Table not found.", "Completed hand record not found."],
  409: ["This table is closed.", "Finish this hand first.", "Finish this hand first. If disconnected, your turn will time out.", "At least two players must be ready.",
    "It is not your turn.", "This request ID was used for a different action.", "The table changed. Refresh before acting.", "The table changed. Refresh and try again.",
    "The table advanced. Refresh before acting.", "Another action reached the table first. Refresh and try again."],
  426: ["This table uses Red River rules. Reload the website or update your MCP client before playing.", "This table uses Ghost rules. Reload the website or update your MCP client before playing."],
  429: ["Too many requests. Wait a few seconds."],
});
const GENERIC = {
  400: "The poker API refused this request. Read the table and check your action.",
  401: "Agent credential is invalid, expired, or revoked.",
  403: "This credential cannot use that table.",
  404: "Not found.",
  409: "The table refused this action. Read the table again before acting.",
  426: "This gateway does not support the table's rules yet.",
  429: "Too many requests. Wait a few seconds.",
};
const UNEXPECTED = "The poker API returned an unexpected response. Try again shortly.";
const UNREACHABLE = "Could not reach the poker API. Retry with the same requestId if an action was sent.";
export const CANCELLED = "The request was cancelled. Retry with the same requestId if an action was sent.";
export const LIMITS_DOWN = "The gateway cannot check request limits right now.";

export class GatewayError extends Error {
  constructor(status, message) { super(message); this.name = "GatewayError"; this.status = status; }
}
// A rate-limit binding failed. Its own error never leaves the gateway.
export class LimitError extends GatewayError {
  constructor() { super(503, LIMITS_DOWN); this.name = "LimitError"; }
}

// Ask one rate-limit binding whether `key` may go on. A throw, a rejection, a
// reply with no boolean `success`, or no reply within `timeoutMs` is a
// LimitError. A cancel ends the wait at once with a 499. A reply that comes
// after either is dropped, so it cannot start work or go unhandled. The abort
// listener starts before the binding call, because a cancel can come during
// that call, and a cancel wins over any fault that the call then shows.
export async function admit(binding, key, signal, timeoutMs = LIMIT_TIMEOUT_MS) {
  if (signal?.aborted) throw new GatewayError(499, CANCELLED);
  let timer; let onAbort;
  const stopped = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new LimitError()), timeoutMs);
    onAbort = () => reject(new GatewayError(499, CANCELLED));
    signal?.addEventListener("abort", onAbort, { once: true });
  });
  stopped.catch(() => {});
  let success;
  try {
    const reply = Promise.resolve(binding.limit({ key }));
    reply.catch(() => {});
    success = (await Promise.race([reply, stopped]))?.success;
  } catch (error) {
    if (signal?.aborted) throw new GatewayError(499, CANCELLED);
    throw error instanceof GatewayError ? error : new LimitError();
  } finally { clearTimeout(timer); signal?.removeEventListener("abort", onAbort); }
  if (signal?.aborted) throw new GatewayError(499, CANCELLED);
  if (typeof success !== "boolean") throw new LimitError();
  return success;
}

// Pass through only an exact known API message. Anything else gets a fixed
// message that holds no text from the reply.
export function upstreamMessage(status, data) {
  const text = data && typeof data.error === "string" ? data.error : "";
  if (Object.hasOwn(API_MESSAGES, status) && API_MESSAGES[status].includes(text)) return text;
  if (GENERIC[status]) return GENERIC[status];
  return status >= 500 ? "The poker API is unavailable. Try again shortly." : `The poker API refused the request (${Number(status)}).`;
}

export function mediaType(value) {
  return (value || "").split(";")[0].trim().toLowerCase();
}

// Read at most `max` bytes, whether or not the sender declared a length. An
// abort stops the read at once, even if the sender stalls mid-body.
export async function readLimited(stream, max, declared, signal) {
  if (declared !== null && declared !== undefined && (!/^\d+$/.test(declared) || Number(declared) > max)) {
    stream?.cancel().catch(() => {});
    return null;
  }
  if (!stream) return new Uint8Array(0);
  const reader = stream.getReader(); const chunks = []; let total = 0;
  let onAbort;
  const aborted = signal && new Promise((_, reject) => {
    onAbort = () => reject(signal.reason ?? new Error("aborted"));
    if (signal.aborted) onAbort(); else signal.addEventListener("abort", onAbort, { once: true });
  });
  aborted?.catch(() => {});
  try {
    for (;;) {
      const { done, value } = await (aborted ? Promise.race([reader.read(), aborted]) : reader.read());
      if (done) break;
      total += value.byteLength;
      if (total > max) { reader.cancel().catch(() => {}); return null; }
      chunks.push(value);
    }
  } catch (error) {
    reader.cancel().catch(() => {});
    throw error;
  } finally { if (onAbort) signal.removeEventListener("abort", onAbort); }
  const bytes = new Uint8Array(total); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

export function createUpstream({ origin, tableId, token, credentialKey, limiters, budget, signal, fetchImpl = fetch, timeoutMs = UPSTREAM_TIMEOUT_MS }) {
  const endpoint = `${origin}/api/tables/${tableId}`;
  // Callers get only a GatewayError, whose message is fixed or an exact API
  // message. Any other error becomes the fixed unexpected-response message.
  async function request(path, body, callSignal) {
    try { return await send(path, body, callSignal); }
    catch (error) { throw error instanceof GatewayError ? error : new GatewayError(502, UNEXPECTED); }
  }
  async function send(path, body, callSignal) {
    if (!PATH.test(path)) throw new GatewayError(400, "Unknown poker API path.");
    // Once the request or call is cancelled, start no more API work.
    const stop = anySignal([signal, callSignal]);
    if (stop.aborted) throw new GatewayError(499, CANCELLED);
    if (budget.used >= budget.max) throw new GatewayError(429, "This request reached its poker API call limit. Call the tool again.");
    budget.used++;
    // Count every API call, including each poll inside one wait. A cancel or
    // a wait's deadline ends a pending check at once.
    const [own, total] = await Promise.all([admit(limiters.upstream, credentialKey, stop), admit(limiters.gateway, "all", stop)]);
    if (!own || !total) throw new GatewayError(429, "Too many poker API calls. Wait a few seconds before the next call.");
    if (stop.aborted) throw new GatewayError(499, CANCELLED);
    // One timer covers the whole call: connecting, headers, and body.
    const timer = new AbortController();
    const timeout = setTimeout(() => timer.abort(new Error("timeout")), timeoutMs);
    const combined = anySignal([stop, timer.signal]);
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
        response.body?.cancel().catch(() => {});
        throw new GatewayError(502, UNEXPECTED);
      }
      let data;
      try {
        const bytes = await readLimited(response.body, MAX_UPSTREAM_BYTES, response.headers.get("content-length"), combined);
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
