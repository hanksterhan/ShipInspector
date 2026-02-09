import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors } from "./cors";
import { globalRateLimiter, strictRateLimiter } from "./rateLimit";
import { requireAuth } from "./auth";
import { StructuredLogger } from "./structuredLogger";

/**
 * Handler configuration options
 */
export interface HandlerOptions {
    method: "GET" | "POST" | "DELETE";
    rateLimit?: "global" | "strict"; // defaults to "global"
}

/**
 * Context passed to business logic
 */
export interface HandlerContext {
    userId: string;
    logger: StructuredLogger;
    requestId: string;
    startTime: number;
}

/**
 * Business logic function signature
 */
export type BusinessLogic = (
    req: VercelRequest,
    res: VercelResponse,
    context: HandlerContext
) => Promise<void>;

/**
 * Creates a standardized handler wrapper that applies common middleware:
 * - Structured request logging
 * - CORS handling
 * - HTTP method validation
 * - Rate limiting (Redis with in-memory fallback)
 * - Authentication
 * - Error handling
 */
export function createHandler(
    options: HandlerOptions,
    businessLogic: BusinessLogic
): (req: VercelRequest, res: VercelResponse) => Promise<void> {
    return async (req: VercelRequest, res: VercelResponse): Promise<void> => {
        const startTime = Date.now();
        const logger = new StructuredLogger(req, startTime);

        // Handle CORS (returns false for OPTIONS requests)
        if (!handleCors(req, res)) {
            logger.logComplete(200);
            return;
        }

        // Validate HTTP method
        if (req.method !== options.method) {
            logger.logComplete(405);
            res.status(405).json({ error: "Method not allowed" });
            return;
        }

        // Apply rate limiting (async - uses Redis when available)
        const rateLimiter =
            options.rateLimit === "strict" ? strictRateLimiter : globalRateLimiter;
        if (!(await rateLimiter(req, res, logger))) {
            logger.logComplete(429);
            return;
        }

        try {
            // Require authentication
            const { userId } = requireAuth(req);
            logger.setUserId(userId);

            // Execute business logic with context
            await businessLogic(req, res, {
                userId,
                logger,
                requestId: logger.requestId,
                startTime,
            });
        } catch (error: any) {
            // Handle authentication errors with 401
            if (error.message === "Not authenticated") {
                logger.logComplete(401);
                res.status(401).json({ error: "Not authenticated" });
                return;
            }

            // Handle all other errors with 500
            logger.error("Unhandled error in handler", error);
            logger.logComplete(500);
            res.status(500).json({
                error: error.message || "Internal server error",
                details:
                    process.env.NODE_ENV === "development"
                        ? error.stack
                        : undefined,
            });
        }
    };
}
