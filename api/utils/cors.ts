import { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * CORS handler for serverless functions
 */
export function handleCors(req: VercelRequest, res: VercelResponse): boolean {
    const origin = req.headers.origin;
    const allowedOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
        : ["http://localhost:4000", "http://localhost:8080"];

    const isDevelopment = process.env.NODE_ENV !== "production";

    // Set CORS headers
    if (!origin) {
        // Allow requests with no origin
        res.setHeader("Access-Control-Allow-Origin", "*");
    } else if (
        isDevelopment && origin.startsWith("http://localhost:")
    ) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    } else if (
        origin.includes(".vercel.app") ||
        origin.includes("sipoker.club") ||
        allowedOrigins.includes(origin)
    ) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    } else if (isDevelopment) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
        // In production, reject unknown origins
        res.status(403).json({ error: "Not allowed by CORS" });
        return false;
    }

    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
        res.status(200).end();
        return false;
    }

    return true;
}

