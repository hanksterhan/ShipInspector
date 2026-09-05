// Local adapter for the production API router. Clerk and route guards stay enabled.
const path = require("node:path");
const { createRequire } = require("node:module");
const apiRequire = createRequire(path.resolve(__dirname, "../api/package.json"));
const dotenv = apiRequire("dotenv");
for (const file of ["../api/.env", "../.env", "../web/.env"]) {
  dotenv.config({ path: path.resolve(__dirname, file) });
}
process.env.CLERK_PUBLISHABLE_KEY ||= process.env.VITE_CLERK_PUBLISHABLE_KEY;
// Local games persist between restarts without touching a remote database.
process.env.POKER_STORE_DIR ||= path.resolve(__dirname, "../.local/poker");
const express = apiRequire("express");
const { default: handler } = require("../api/dist/api/index.js");
const { handleCors } = require("../api/dist/api/_lib/api-utils/cors.js");
const app = express();
// Method-dispatch routes need preflight handling before they select a handler.
app.use((req, res, next) => { if (handleCors(req, res)) next(); });
app.use(express.json({ limit: "100kb" }));
app.use((req, res, next) => Promise.resolve(handler(req, res)).catch(next));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error("Local API request failed:", error.message);
  res.status(500).json({ error: "The local API could not process this request." });
});
app.listen(3000, "127.0.0.1", () => console.log("Local API ready at http://localhost:3000"));
