import { VercelResponse } from "@vercel/node";

/**
 * Handle errors in serverless functions
 */
export function handleError(error: any, res: VercelResponse, statusCode: number = 500) {
    console.error("Error:", error);
    console.error("Stack:", error.stack);
    
    res.status(statusCode).json({
        error: error.message || "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
}

