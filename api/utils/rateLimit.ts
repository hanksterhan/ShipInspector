import { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Simple in-memory rate limiter for serverless functions
 * Note: This is a basic implementation. For production, consider using
 * Vercel's Edge Config, Redis, or another distributed rate limiting solution
 */

interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

// In-memory store (cleared on cold start)
// In production, use a distributed cache like Redis or Vercel Edge Config
const store: RateLimitStore = {};

/**
 * Get client IP from request
 */
function getClientIp(req: VercelRequest): string {
    const forwarded = req.headers["x-forwarded-for"];
    const realIp = req.headers["x-real-ip"];
    
    if (forwarded) {
        return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0].trim();
    }
    if (realIp) {
        return Array.isArray(realIp) ? realIp[0] : realIp;
    }
    return req.socket?.remoteAddress || "unknown";
}

/**
 * Create a rate limiter middleware
 */
export function createRateLimiter(
    windowMs: number,
    max: number,
    message?: string
) {
    return (req: VercelRequest, res: VercelResponse): boolean => {
        const ip = getClientIp(req);
        const now = Date.now();
        const key = `rate_limit_${ip}`;
        
        const record = store[key];
        
        // Reset if window expired
        if (!record || now > record.resetTime) {
            store[key] = {
                count: 1,
                resetTime: now + windowMs,
            };
            return true;
        }
        
        // Check if limit exceeded
        if (record.count >= max) {
            res.status(429).json({
                error: message || "Too many requests, please try again later.",
                retryAfter: Math.ceil((record.resetTime - now) / 1000),
            });
            return false;
        }
        
        // Increment count
        record.count++;
        return true;
    };
}

/**
 * Global rate limiter - 100 requests per 15 minutes
 */
export const globalRateLimiter = createRateLimiter(
    parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 minutes
    parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
    "Too many requests from this IP, please try again later."
);

/**
 * Strict rate limiter for expensive operations - 20 requests per 15 minutes
 */
export const strictRateLimiter = createRateLimiter(
    parseInt(process.env.RATE_LIMIT_STRICT_WINDOW_MS || "900000", 10), // 15 minutes
    parseInt(process.env.RATE_LIMIT_STRICT_MAX || "20", 10),
    "Rate limit exceeded for this endpoint. Please try again later."
);

