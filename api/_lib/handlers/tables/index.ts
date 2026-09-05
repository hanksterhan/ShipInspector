import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import type { TableCommandRequest, TableSettings } from "@common/interfaces/tableInterfaces";
import { requireAuth } from "../../api-utils/auth";
import { handleCors } from "../../api-utils/cors";
import { TableError } from "../../poker-table/engine";
import { getTableStore } from "../../poker-table/store";
import { Identity, TableService } from "../../poker-table/service";

const name = z.string().trim().min(1).max(40).regex(/^[^\x00-\x1f\x7f]+$/, "Use a plain display name.");
const integer = z.number().int().safe();
const settings = z.object({ name, maxPlayers: integer.min(2).max(8), smallBlind: integer.min(1).max(500),
  bigBlind: integer.min(2).max(1000), startingStack: integer.min(20).max(100000), turnSeconds: integer.min(30).max(120) }).strict()
  .refine(s => s.bigBlind >= 2 * s.smallBlind && s.startingStack >= 20 * s.bigBlind, "Use a big blind of at least twice the small blind and a stack of at least 20 big blinds.");
const command = z.discriminatedUnion("type", [
  z.object({ type: z.literal("join"), name }).strict(),
  z.object({ type: z.literal("ready"), ready: z.boolean() }).strict(),
  z.object({ type: z.literal("deal") }).strict(),
  z.object({ type: z.literal("act"), action: z.enum(["fold", "check", "call", "raise"]), raiseTo: integer.positive().optional() }).strict(),
  z.object({ type: z.literal("leave") }).strict(), z.object({ type: z.literal("rebuy") }).strict(), z.object({ type: z.literal("close") }).strict(),
]);
const request = z.object({ version: integer.nonnegative(), requestId: z.string().uuid(), command }).strict();
const agentRequest = z.object({ version: integer.nonnegative(), requestId: z.string().uuid(), name }).strict();
const revokeRequest = z.object({ version: integer.nonnegative(), requestId: z.string().uuid(), agentId: z.string().uuid() }).strict();

function identity(req: VercelRequest): Identity {
  const token = req.headers.authorization?.replace(/^Bearer /, "");
  if (token?.startsWith("si_agent_")) return { token };
  return requireAuth(req);
}
// Polls use a separate budget from expensive equity queries. State mutations
// still require both an authenticated identity and a matching table version.
const buckets = new Map<string, { count: number; reset: number }>();
export async function tablesHandler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!handleCors(req, res)) return;
  res.setHeader("Cache-Control", "private, no-store");
  try {
    const who = identity(req);
    const key = who.userId || who.token!.slice(-24);
    const now = Date.now(); const bucket = buckets.get(key);
    if (bucket && bucket.reset > now && bucket.count >= 240) { res.setHeader("Retry-After", "10"); throw new TableError("Too many requests. Wait a few seconds.", 429); }
    if (bucket && bucket.reset > now) bucket.count++; else buckets.set(key, { count: 1, reset: now + 60000 });
    if (buckets.size > 10000) for (const [id, value] of buckets) if (value.reset <= now) buckets.delete(id);
    const service = new TableService(await getTableStore());
    const path = (req.url || "").split("?")[0].replace(/^\/api(?=\/)/, "").replace(/\/$/, "");
    if (path === "/tables") {
      if (!who.userId) throw new TableError("Use the browser to create or list private tables.", 403);
      if (req.method === "GET") { res.json({ tables: await service.list(who.userId) }); return; }
      if (req.method === "POST") {
        const body = z.object({ settings, displayName: name.optional() }).strict().parse(req.body);
        res.status(201).json(await service.create(who.userId, body.settings as TableSettings, body.displayName)); return;
      }
    } else {
      const segments = path.split("/"); const id = z.string().uuid().parse(segments[2]);
      if (who.token && !who.token.startsWith(`si_agent_${id}.`)) throw new TableError("This credential belongs to a different table.", 403);
      if (segments.length === 3 && req.method === "GET") { res.json(await service.get(id, who)); return; }
      if (segments[3] === "commands" && req.method === "POST") { res.json(await service.command(id, who, request.parse(req.body) as TableCommandRequest)); return; }
      if (segments[3] === "agents" && req.method === "POST" && who.userId) {
        const body = agentRequest.parse(req.body); res.status(201).json(await service.issueAgent(id, who.userId, body.version, body.requestId, body.name)); return;
      }
      if (segments[3] === "revoke-agent" && req.method === "POST" && who.userId) {
        const b = revokeRequest.parse(req.body); res.json(await service.revokeAgent(id, who.userId, b.version, b.requestId, b.agentId)); return;
      }
    }
    res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ error: error.issues[0]?.message || "Invalid request." }); return; }
    if (error instanceof TableError) { res.status(error.status).json({ error: error.message }); return; }
    if (error instanceof Error && error.message === "Not authenticated") { res.status(401).json({ error: "Sign in to use private tables." }); return; }
    console.error("Poker table request failed", error instanceof Error ? error.name : "Unknown error");
    res.status(503).json({ error: "The table service is unavailable. Try again shortly." });
  }
}
