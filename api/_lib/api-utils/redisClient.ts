import { Redis } from "@upstash/redis";

let redisClient: Redis | null = null;
let initialized = false;

/**
 * Get or create a Redis client singleton.
 * Returns null if UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN are missing.
 */
export function getRedisClient(): Redis | null {
    if (initialized) return redisClient;
    initialized = true;

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        console.log(
            JSON.stringify({
                timestamp: new Date().toISOString(),
                level: "warn",
                message:
                    "Using in-memory rate limiting: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set",
            })
        );
        return null;
    }

    redisClient = new Redis({ url, token });
    return redisClient;
}
