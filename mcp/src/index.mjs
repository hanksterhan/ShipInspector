import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createPokerServer } from "./server.mjs";

try {
  const server = createPokerServer({
    apiUrl: process.env.SHIPINSPECTOR_API_URL || "http://localhost:3000",
    token: process.env.SHIPINSPECTOR_AGENT_TOKEN,
  });
  await server.connect(new StdioServerTransport());
} catch (error) {
  console.error(error instanceof Error ? error.message : "Poker MCP server could not start.");
  process.exitCode = 1;
}
