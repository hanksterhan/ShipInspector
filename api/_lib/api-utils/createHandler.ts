import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors } from "./cors";
import { globalRateLimiter, strictRateLimiter } from "./rateLimit";
import { requireAuth } from "./auth";
import { logRequest } from "./logger";
import { handleError } from "./errorHandler";

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
    logger: { logComplete: () => void } | undefined;
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
 * - Request logging
 * - CORS handling
 * - HTTP method validation
 * - Rate limiting
 * - Authentication
 * - Error handling
 *
 * This eliminates ~20 lines of boilerplate from each handler.
 *
 * @param options - Handler configuration (method, rateLimit)
 * @param businessLogic - The actual endpoint logic to execute
 * @returns A Vercel serverless function handler
 *
 * @example
 * ```typescript
 * export default createHandler(
 *   { method: "POST", rateLimit: "strict" },
 *   async (req, res, { userId, logger }) => {
 *     // Your business logic here
 *     logger?.logComplete();
 *   }
 * );
 * ```
 */
export function createHandler(
    options: HandlerOptions,
    businessLogic: BusinessLogic
): (req: VercelRequest, res: VercelResponse) => Promise<void> {
    return async (req: VercelRequest, res: VercelResponse): Promise<void> => {
        const startTime = Date.now();
        const logger = logRequest(req, startTime);

        // Handle CORS (returns false for OPTIONS requests)
        if (!handleCors(req, res)) {
            return;
        }

        // Validate HTTP method
        if (req.method !== options.method) {
            res.status(405).json({ error: "Method not allowed" });
            return;
        }

        // Apply rate limiting
        const rateLimiter =
            options.rateLimit === "strict" ? strictRateLimiter : globalRateLimiter;
        if (!rateLimiter(req, res)) {
            return;
        }

        try {
            // Require authentication
            const { userId } = requireAuth(req);

            // Execute business logic with context
            await businessLogic(req, res, {
                userId,
                logger,
                startTime,
            });
        } catch (error: any) {
            // Handle authentication errors with 401
            if (error.message === "Not authenticated") {
                res.status(401).json({ error: "Not authenticated" });
                return;
            }

            // Handle all other errors with 500
            handleError(error, res, 500);
        }
    };
}
