import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

/**
 * Create a rate limiter with custom options
 */
function createRateLimiter(
    windowMs: number,
    max: number,
    message?: string
): ReturnType<typeof rateLimit> {
    return rateLimit({
        windowMs, // Time window in milliseconds
        max, // Maximum number of requests per window
        message:
            message ||
            "Too many requests from this IP, please try again later.",
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        handler: (req: Request, res: Response) => {
            res.status(429).json({
                error: message || "Too many requests, please try again later.",
                retryAfter: Math.ceil(windowMs / 1000), // Seconds
            });
        },
    });
}

/**
 * Global rate limiter - applies to all routes
 * Default: 10,000 requests per 1 minute (very generous for development)
 */
export const globalRateLimiter = createRateLimiter(
    parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10), // 1 minute
    parseInt(process.env.RATE_LIMIT_MAX || "10000", 10),
    "Too many requests from this IP, please try again later."
);

/**
 * Strict rate limiter for expensive operations (equity calculations)
 * Default: 1,000 requests per 1 minute (generous for testing and development)
 */
export const strictRateLimiter = createRateLimiter(
    parseInt(process.env.RATE_LIMIT_STRICT_WINDOW_MS || "60000", 10), // 1 minute
    parseInt(process.env.RATE_LIMIT_STRICT_MAX || "1000", 10),
    "Rate limit exceeded for this endpoint. Please try again later."
);

/**
 * Auth rate limiter - for login/token generation endpoints
 * Default: 100 requests per 5 minutes (still reasonable for security, but much more lenient)
 */
export const authRateLimiter = createRateLimiter(
    parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || "300000", 10), // 5 minutes
    parseInt(process.env.RATE_LIMIT_AUTH_MAX || "100", 10),
    "Too many authentication attempts, please try again later."
);

/**
 * Database operations rate limiter
 * Default: 500 requests per 1 minute
 */
export const databaseRateLimiter = createRateLimiter(
    parseInt(process.env.RATE_LIMIT_DB_WINDOW_MS || "60000", 10), // 1 minute
    parseInt(process.env.RATE_LIMIT_DB_MAX || "500", 10),
    "Too many database operations, please try again later."
);
