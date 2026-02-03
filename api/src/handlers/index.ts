/**
 * Route Map for API Handlers
 *
 * This file exports all API route handlers for use by the router (api/index.ts).
 * All handlers are now consolidated here instead of being spread across api/ subdirectories.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Auth handlers
import { handler as authMeHandler } from "./auth/me";
import { handler as authClerkUserHandler } from "./auth/clerk-user";

// Poker handlers
import { handler as evaluateHandHandler } from "./poker/hand/evaluate";
import { handler as compareHandsHandler } from "./poker/hand/compare";
import { handler as calculateEquityHandler } from "./poker/equity/calculate";
import { handler as calculateOutsHandler } from "./poker/outs/calculate";

// Hand management handlers
import { handler as handsCreateHandler } from "./hands";

export type RouteHandler = (req: VercelRequest, res: VercelResponse) => Promise<void>;

/**
 * Route map mapping paths to handlers.
 *
 * The router will match against normalized paths (without /api prefix, without trailing slash).
 * Example: "/auth/me" matches requests to "/api/auth/me" or "/auth/me"
 */
export const routes: Record<string, RouteHandler> = {
    "/auth/me": authMeHandler,
    "/auth/clerk-user": authClerkUserHandler,
    "/poker/hand/evaluate": evaluateHandHandler,
    "/poker/hand/compare": compareHandsHandler,
    "/poker/equity/calculate": calculateEquityHandler,
    "/poker/outs/calculate": calculateOutsHandler,
    "/hands": handsCreateHandler,
};
