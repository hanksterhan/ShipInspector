// Public, static documentation. It holds no table or credential data and
// never calls the table API.
import { TOOL_NAMES } from "../../mcp/src/tools.mjs";

const escape = text => text.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function sections(endpoint) {
  const config = JSON.stringify({ mcpServers: { "shipinspector-poker": { type: "http", url: endpoint, headers: { Authorization: "Bearer YOUR_SEAT_CREDENTIAL" } } } }, null, 2);
  return [
    ["Endpoint", [
      `MCP endpoint: ${endpoint}`,
      "Transport: Streamable HTTP. Send one JSON-RPC message in each POST; the server replies with JSON. The server keeps no session, so GET and DELETE return 405.",
    ]],
    ["Closed beta access", [
      "You need a seat credential. The host of a private table reserves an agent seat in the browser at https://www.sipoker.club and gives the credential to you once.",
      "Send it in every request as the header Authorization: Bearer YOUR_SEAT_CREDENTIAL. The server checks it again on each request.",
      "Each credential controls one seat at one table. It expires after seven days, and the host can revoke it at any time.",
      "This beta has no OAuth, account sign-up, anonymous play, or self-service seats. Your client must support Streamable HTTP and a custom Authorization header.",
    ]],
    ["Games", [
      "No-limit Texas Hold'em and Red River Hold'em, each with an optional Ghost hand. Read the poker://rules resource for the rules of your table.",
      "Play chips have no cash value.",
    ]],
    ["Tools", [
      `${TOOL_NAMES.join(", ")}.`,
      "Read the current version and legal actions before each move. Use a new requestId for each command and the same requestId only to retry the exact same command.",
    ]],
    ["Limits", [
      "Requests are limited per client address, per credential, and per call to the table API. A wait polls about once a second, and each poll counts. Limits apply separately in each Cloudflare location and are approximate. Too many requests return HTTP 429.",
    ]],
    ["Discovery", [
      "This page and /llms.txt describe the server. Publishing them does not add the server to any directory or search index, and agents cannot register or take a seat on their own.",
    ]],
    ["Client configuration", [
      { code: config },
      { code: `claude mcp add --transport http shipinspector-poker ${endpoint} --header "Authorization: Bearer YOUR_SEAT_CREDENTIAL"` },
      "Keep the credential out of shared files and logs. Start a separate connection for each agent, each with its own credential.",
    ]],
  ];
}

const TITLE = "ShipInspector poker MCP server (closed beta)";
const SUMMARY = "A remote Model Context Protocol server that lets an AI agent play at a private ShipInspector poker table.";

export function llmsText(endpoint) {
  const body = sections(endpoint).map(([heading, items]) => `## ${heading}\n\n${items.map(item => typeof item === "string" ? `- ${item}` : `\`\`\`\n${item.code}\n\`\`\``).join("\n")}`).join("\n\n");
  return `# ${TITLE}\n\n> ${SUMMARY}\n\n${body}\n`;
}

export function homePage(endpoint) {
  const body = sections(endpoint).map(([heading, items]) => `<h2>${escape(heading)}</h2>\n${items.map(item => typeof item === "string" ? `<p>${escape(item)}</p>` : `<pre><code>${escape(item.code)}</code></pre>`).join("\n")}`).join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(TITLE)}</title>
<link rel="alternate" type="text/plain" href="/llms.txt">
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:46rem;margin:2rem auto;padding:0 1rem;color:#1d1d1f}pre{background:#f4f4f5;padding:1rem;overflow-x:auto;white-space:pre-wrap;word-break:break-all}h1{font-size:1.6rem}</style>
</head>
<body>
<h1>${escape(TITLE)}</h1>
<p>${escape(SUMMARY)} Agents can read <a href="/llms.txt">/llms.txt</a>.</p>
${body}
</body>
</html>
`;
}
