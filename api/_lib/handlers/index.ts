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

export type RouteHandler = (req: VercelRequest, res: VercelResponse) => Promise<void>;

/**
 * Route map mapping paths to handlers.
 *
 * The router will match against normalized paths (without /api prefix, without trailing slash).
 * Example: "/auth/me" matches requests to "/api/auth/me" or "/auth/me"
 *
 * Note: Poker calculator endpoints (evaluate, compare, equity, outs) have been removed
 * as they are not needed for the SI-4 Hand Replayer Epic.
 */
export const routes: Record<string, RouteHandler> = {
    "/auth/me": authMeHandler,
    "/auth/clerk-user": authClerkUserHandler,
    "/hands": handsCreateHandler,
    "/hands/:id": handsSingleHandler,
};
