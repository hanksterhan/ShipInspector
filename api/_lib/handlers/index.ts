/**
 * Route Map for API Handlers
 *
 * This file exports all API route handlers for use by the router (api/index.ts).
 * Handlers are kept outside the api/ directory to avoid being counted as
 * separate serverless functions by Vercel.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Auth handlers
import { handler as authMeHandler } from "./auth/me";
import { handler as authClerkUserHandler } from "./auth/clerk-user";

// Hand management handlers
import { handler as handsCreateHandler } from "./hands";
import { handler as handsSingleHandler } from "./hands/single";

// Poker calculator handlers
import { handler as pokerEvaluateHandler } from "./poker/evaluate";
import { handler as pokerCompareHandler } from "./poker/compare";
import { handler as pokerEquityHandler } from "./poker/equity";
import { handler as pokerOutsHandler } from "./poker/outs";
import { tablesHandler } from "./tables";

export type RouteHandler = (req: VercelRequest, res: VercelResponse) => Promise<void>;

/**
 * Route map mapping paths to handlers.
 *
 * The router will match against normalized paths (without /api prefix, without trailing slash).
 * Example: "/auth/me" matches requests to "/api/auth/me" or "/auth/me"
 */
export const routes: Record<string, RouteHandler> = {
    "/tables": tablesHandler,
    "/tables/:id": tablesHandler,
    "/tables/:id/commands": tablesHandler,
    "/tables/:id/agents": tablesHandler,
    "/tables/:id/revoke-agent": tablesHandler,
    "/auth/me": authMeHandler,
    "/auth/clerk-user": authClerkUserHandler,
    "/hands": handsCreateHandler,
    "/hands/:id": handsSingleHandler,
    "/poker/hand/evaluate": pokerEvaluateHandler,
    "/poker/hand/compare": pokerCompareHandler,
    "/poker/equity/calculate": pokerEquityHandler,
    "/poker/outs/calculate": pokerOutsHandler,
};
