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
 * Match a normalized path against a route pattern with :param support.
 * Returns the handler and extracted params, or null if no match.
 *
 * @param normalizedPath - The normalized request path (e.g., "/hands/123")
 * @param routePattern - The route pattern (e.g., "/hands/:id")
 * @returns Object with params if match, or null
 */
function matchRoute(
    normalizedPath: string,
    routePattern: string
): Record<string, string> | null {
    const pathSegments = normalizedPath.split("/");
    const patternSegments = routePattern.split("/");

    // Must have same number of segments
    if (pathSegments.length !== patternSegments.length) {
        return null;
    }

    const params: Record<string, string> = {};

    for (let i = 0; i < patternSegments.length; i++) {
        const patternSegment = patternSegments[i];
        const pathSegment = pathSegments[i];

        if (patternSegment.startsWith(":")) {
            // This is a parameter - extract it
            const paramName = patternSegment.substring(1);
            params[paramName] = pathSegment;
        } else if (patternSegment !== pathSegment) {
            // Literal segment doesn't match
            return null;
        }
    }

    return params;
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

    // Try exact match first
    let routeHandler = routes[normalizedPath];

    if (routeHandler) {
        return routeHandler(req, res);
    }

    // Try pattern matching for :param routes
    for (const [routePattern, handler] of Object.entries(routes)) {
        if (routePattern.includes(":")) {
            const params = matchRoute(normalizedPath, routePattern);
            if (params !== null) {
                // Attach params to request for handler access
                (req as any).params = params;
                return handler(req, res);
            }
        }
    }

    // 404 for unknown routes
    res.status(404).json({
        error: "Route not found",
        path: normalizedPath,
        originalPath: req.url,
    });
}
