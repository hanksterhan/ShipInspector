/**
 * Vercel Serverless Function Router
 *
 * This is the ONLY serverless function entry point.
 * All API routes are handled by this single function, routing to handlers in _lib/handlers/.
 *
 * IMPORTANT: Only files starting with _ are excluded from serverless function detection.
 * The _lib/ directory contains all handlers and utilities, prefixed with _ to be excluded.
 * See: https://vercel.com/docs/functions/limitations
 */

// Register path aliases for @common/* imports (must be first)
// This also initializes Clerk middleware
import { clerkMiddlewareInstance } from "./_helpers";

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { routes } from "./_lib/handlers";

/**
 * Normalize request path for routing.
 *
 * Handles:
 * - Removing query strings
 * - Removing /api prefix (vercel.json rewrites preserve original path)
 * - Ensuring path starts with /
 * - Removing trailing slash (except for root)
 */
function normalizePath(url: string | undefined): string {
    // Get path without query string
    let path = (url || "").split("?")[0];

    // URL decode (handle encoded slashes, etc.)
    try {
        path = decodeURIComponent(path);
    } catch {
        // Invalid encoding - use as-is
    }

    // Remove /api prefix if present
    if (path.startsWith("/api")) {
        path = path.substring(4);
    }

    // Collapse multiple slashes into single slash
    path = path.replace(/\/+/g, "/");

    // Ensure path starts with /
    if (!path.startsWith("/")) {
        path = "/" + path;
    }

    // Remove trailing slash (except for root)
    if (path.length > 1 && path.endsWith("/")) {
        path = path.slice(0, -1);
    }

    return path;
}

/**
 * Main router for Vercel serverless functions.
 * Routes requests to handlers based on the normalized path.
 */
export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    // Apply Clerk middleware before routing
    // This must be done before any handler uses getAuth()
    try {
        await new Promise<void>((resolve, reject) => {
            clerkMiddlewareInstance(req as any, res as any, (err?: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    } catch (error: any) {
        console.error("[Router] Clerk middleware failed:", error);
        res.status(500).json({
            error: "Authentication initialization failed",
        });
        return;
    }

    // Normalize path and find handler
    const normalizedPath = normalizePath(req.url);
    const routeHandler = routes[normalizedPath];

    if (routeHandler) {
        return routeHandler(req, res);
    }

    // 404 for unknown routes
    res.status(404).json({
        error: "Route not found",
        path: normalizedPath,
        originalPath: req.url,
    });
}
