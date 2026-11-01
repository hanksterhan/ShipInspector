import { VercelRequest, VercelResponse } from "@vercel/node";

const PRODUCTION_ORIGINS = ["https://sipoker.club", "https://www.sipoker.club"];

function isLoopbackOrigin(origin: string): boolean {
    try {
        const url = new URL(origin);
        return url.origin === origin && url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
    } catch {
        return false;
    }
}

/**
 * CORS handler for serverless functions. Browser requests carry cookies, so
 * every allowed origin is an exact match: the production hosts, the request's
 * own host (for example a Vercel preview calling its own API), entries in
 * CORS_ORIGIN, and loopback origins during development.
 */
export function handleCors(req: VercelRequest, res: VercelResponse): boolean {
    const origin = req.headers.origin;
    const configured = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean)
        : ["http://localhost:4000", "http://localhost:8080"];
    const isDevelopment = process.env.NODE_ENV !== "production";
    const host = typeof req.headers.host === "string" ? req.headers.host.toLowerCase() : "";

    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Poker-Rules");

    // Requests without an Origin header are not browser cross-origin requests.
    if (origin) {
        const allowed = PRODUCTION_ORIGINS.includes(origin) || configured.includes(origin) ||
            (host !== "" && origin === `https://${host}`) || (isDevelopment && isLoopbackOrigin(origin));
        if (!allowed) {
            res.status(403).json({ error: "Not allowed by CORS" });
            return false;
        }
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Vary", "Origin");
    }

    // Handle preflight requests
    if (req.method === "OPTIONS") {
        res.status(200).end();
        return false;
    }

    return true;
}
