// Vercel Serverless Function Router
// Routes requests to individual serverless functions based on path

// Register path aliases for @common/* imports (must be first)
import "./_helpers";

import type { VercelRequest, VercelResponse } from "@vercel/node";
import authMeHandler from "./auth/me";
import authClerkUserHandler from "./auth/clerk-user";
import evaluateHandHandler from "./poker/hand/evaluate";
import compareHandsHandler from "./poker/hand/compare";
import calculateEquityHandler from "./poker/equity/calculate";

/**
 * Main router for Vercel serverless functions
 * Routes requests to individual function handlers based on the path
 */
export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    // Get path from URL or query
    // Vercel rewrites preserve the original path in req.url
    const path = req.url || "";
    
    // Remove query string and normalize path
    // Handle both /api/path and /path formats
    let normalizedPath = path.split("?")[0];
    
    // Remove /api prefix if present
    if (normalizedPath.startsWith("/api")) {
        normalizedPath = normalizedPath.substring(4);
    }
    
    // Ensure path starts with /
    if (!normalizedPath.startsWith("/")) {
        normalizedPath = "/" + normalizedPath;
    }

    // Route to appropriate handler
    if (normalizedPath === "/auth/me" || normalizedPath === "/auth/me/") {
        return authMeHandler(req, res);
    }
    
    if (normalizedPath === "/auth/clerk-user" || normalizedPath === "/auth/clerk-user/") {
        return authClerkUserHandler(req, res);
    }
    
    if (normalizedPath === "/poker/hand/evaluate" || normalizedPath === "/poker/hand/evaluate/") {
        return evaluateHandHandler(req, res);
    }
    
    if (normalizedPath === "/poker/hand/compare" || normalizedPath === "/poker/hand/compare/") {
        return compareHandsHandler(req, res);
    }
    
    if (normalizedPath === "/poker/equity/calculate" || normalizedPath === "/poker/equity/calculate/") {
        return calculateEquityHandler(req, res);
    }

    // 404 for unknown routes
    res.status(404).json({
        error: "Route not found",
        path: normalizedPath,
        originalPath: path,
    });
}
