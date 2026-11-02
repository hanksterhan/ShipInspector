import { createPokerMcpServer, SUPPORTED_RULES } from "./tools.mjs";

export function createPokerServer({ apiUrl, token, fetchImpl = fetch }) {
  const base = new URL(apiUrl);
  if (base.protocol !== "https:" && !(base.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname))) {
    throw new Error("Use HTTPS for a remote poker API.");
  }
  const match = /^si_agent_([0-9a-f-]{36})\.[0-9a-f]{64}$/.exec(token || "");
  if (!match) throw new Error("Set SHIPINSPECTOR_AGENT_TOKEN to the credential from your table host.");
  const tableId = match[1];
  const root = base.href.replace(/\/$/, "");
  const endpoint = `${root.endsWith("/api") ? root : `${root}/api`}/tables/${tableId}`;
  async function request(path, body, signal) {
    const timeout = AbortSignal.timeout(15000);
    let response;
    try {
      response = await fetchImpl(endpoint + path, {
        method: body ? "POST" : "GET", redirect: "error",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json", "X-Poker-Rules": SUPPORTED_RULES },
        body: body ? JSON.stringify(body) : undefined,
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      });
    } catch { throw new Error("Could not reach the poker API. Retry with the same requestId if an action was sent."); }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Poker API returned ${response.status}.`);
    return data;
  }
  return createPokerMcpServer({ request });
}
