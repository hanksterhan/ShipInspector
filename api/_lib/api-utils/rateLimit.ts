import { VercelRequest, VercelResponse } from "@vercel/node";
// import { getRedisClient } from "./redisClient"; // Redis paused - not enough traffic to justify
import type { StructuredLogger } from "./structuredLogger";

/**
 * In-memory fallback store (cleared on cold start)
 */
interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

const store: RateLimitStore = {};

/**
 * Get client IP from request
 */
export function getClientIp(req: VercelRequest): string {
    const forwarded = req.headers["x-forwarded-for"];
    const realIp = req.headers["x-real-ip"];

    if (forwarded) {
        return Array.isArray(forwarded)
            ? forwarded[0]
            : forwarded.split(",")[0].trim();
    }
    if (realIp) {
        return Array.isArray(realIp) ? realIp[0] : realIp;
    }
    return req.socket?.remoteAddress || "unknown";
}

/**
 * Set rate limit response headers
 */
function setRateLimitHeaders(
    res: VercelResponse,
    max: number,
    remaining: number,
    resetTime: number
): void {
    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, remaining));
    res.setHeader(
        "X-RateLimit-Reset",
        Math.ceil(resetTime / 1000)
    );
}

// Redis-backed rate limiting paused - not enough traffic to justify.
// Uncomment checkRedis and re-enable in createRateLimiter when needed.
// async function checkRedis(
//     ip: string,
//     windowMs: number,
//     max: number,
//     res: VercelResponse,
//     message: string,
//     logger?: StructuredLogger
// ): Promise<boolean> {
//     const redis = getRedisClient();
//     if (!redis) return null as any;
//     const key = `rl:${ip}`;
//     const now = Date.now();
//     const windowStart = now - windowMs;
//     try {
//         const pipeline = redis.pipeline();
//         pipeline.zremrangebyscore(key, 0, windowStart);
//         pipeline.zadd(key, { score: now, member: `${now}:${crypto.randomUUID()}` });
//         pipeline.zcard(key);
//         pipeline.expire(key, Math.ceil(windowMs / 1000));
//         const results = await pipeline.exec();
//         const count = results[2] as number;
//         const remaining = max - count;
//         const resetTime = now + windowMs;
//         setRateLimitHeaders(res, max, remaining, resetTime);
//         if (count > max) {
//             const retryAfter = Math.ceil(windowMs / 1000);
//             res.setHeader("Retry-After", retryAfter);
//             res.status(429).json({ error: message, retryAfter });
//             return false;
//         }
//         return true;
//     } catch (err) {
//         logger?.warn("Redis rate limiting failed, falling back to in-memory", {
//             error: err instanceof Error ? err.message : String(err),
//         });
//         return null as any;
//     }
// }

/**
 * In-memory rate limiting (fallback when Redis unavailable)
 */
function checkInMemory(
    ip: string,
    windowMs: number,
    max: number,
    res: VercelResponse,
    message: string
): boolean {
    const now = Date.now();
    const key = `rate_limit_${ip}`;

    const record = store[key];

    // Reset if window expired
    if (!record || now > record.resetTime) {
        store[key] = {
            count: 1,
            resetTime: now + windowMs,
        };
        setRateLimitHeaders(res, max, max - 1, now + windowMs);
        return true;
    }

    // Check if limit exceeded
    if (record.count >= max) {
        const retryAfter = Math.ceil((record.resetTime - now) / 1000);
        setRateLimitHeaders(res, max, 0, record.resetTime);
        res.setHeader("Retry-After", retryAfter);
        res.status(429).json({
            error: message,
            retryAfter,
        });
        return false;
    }

    // Increment count
    record.count++;
    setRateLimitHeaders(res, max, max - record.count, record.resetTime);
    return true;
}

/**
 * Create a rate limiter that uses Redis when available, falling back to in-memory.
 */
export function createRateLimiter(
    windowMs: number,
    max: number,
    message?: string
) {
    const msg = message || "Too many requests, please try again later.";

    return async (
        req: VercelRequest,
        res: VercelResponse,
        _logger?: StructuredLogger
    ): Promise<boolean> => {
        const ip = getClientIp(req);

        // Redis paused - using in-memory only for now.
        // To re-enable, uncomment checkRedis above and restore:
        // const redisResult = await checkRedis(ip, windowMs, max, res, msg, logger);
        // if (redisResult !== null) return redisResult;

        return checkInMemory(ip, windowMs, max, res, msg);
    };
}

/**
 * Global rate limiter - 100 requests per 15 minutes
 */
export const globalRateLimiter = createRateLimiter(
    parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
    parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
    "Too many requests from this IP, please try again later."
);

/**
 * Strict rate limiter for expensive operations - 500 requests per 15 minutes
 */
export const strictRateLimiter = createRateLimiter(
    parseInt(process.env.RATE_LIMIT_STRICT_WINDOW_MS || "900000", 10),
    parseInt(process.env.RATE_LIMIT_STRICT_MAX || "500", 10),
    "Rate limit exceeded for this endpoint. Please try again later."
);
