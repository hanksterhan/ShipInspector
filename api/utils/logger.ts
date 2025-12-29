import { VercelRequest } from "@vercel/node";
import { sanitizeObject } from "../../server/src/middlewares/sanitize";

const PATHS_TO_SKIP = [
    "/favicon.ico",
    "/apple-touch-icon.png",
    "/apple-touch-icon-precomposed.png",
];

/**
 * Log API request for serverless functions
 */
export function logRequest(req: VercelRequest, startTime: number = Date.now()) {
    const path = req.url || "";
    
    // Skip logging for certain paths
    if (PATHS_TO_SKIP.some(skipPath => path.includes(skipPath))) {
        return;
    }

    const apiMetadata = `API Logger: ${req.method} ${path}`;
    console.info(apiMetadata);

    // Sanitize request body before logging
    if (req.body) {
        const sanitizedBody = sanitizeObject(req.body);
        console.info(`    body: ${JSON.stringify(sanitizedBody)}`);
    }

    return {
        logComplete: () => {
            const endTime = Date.now();
            const duration = endTime - startTime;
            console.info(`${apiMetadata} completed in ${duration}ms \n`);
        },
    };
}

