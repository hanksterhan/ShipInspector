/**
 * @deprecated This Express server is deprecated for Vercel deployment.
 * 
 * All serverless functions have been migrated to /api directory.
 * This file is kept for local development/testing purposes only.
 * 
 * For production deployment, use the serverless functions in /api.
 * 
 * To run locally for testing:
 *   npm run start (in server directory)
 */

import express from "express";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { clerkMiddleware } from "@clerk/express";

import * as routers from "./routes";
import {
    apiLogger,
    errorHandler,
    globalRateLimiter,
} from "./middlewares";
import { swaggerSpec } from "./config/swagger";

dotenv.config();

console.log(`⚠️  DEPRECATED: Express server starting (for local dev only)`);
console.log(`   For production, use serverless functions in /api directory`);

const port = process.env.PORT || 3000;

const app = express();

// Trust proxy - required for Vercel and other reverse proxies
app.set('trust proxy', 1);

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
    : ["http://localhost:4000", "http://localhost:8080"];

const normalizeHost = (host: string): string => host.replace(/^www\./, "");

const isSameDomain = (origin1: string, origin2: string): boolean => {
    try {
        const url1 = new URL(origin1);
        const url2 = new URL(origin2);
        return normalizeHost(url1.hostname) === normalizeHost(url2.hostname);
    } catch {
        return false;
    }
};

const isDevelopment = process.env.NODE_ENV !== "production";

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) {
                return callback(null, true);
            }

            if (isDevelopment && origin.startsWith("http://localhost:")) {
                return callback(null, true);
            }

            if (allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                const matchesAllowedOrigin = allowedOrigins.some((allowedOrigin) =>
                    isSameDomain(origin, allowedOrigin)
                );
                
                if (matchesAllowedOrigin) {
                    callback(null, true);
                } else {
                    if (isDevelopment) {
                        callback(null, true);
                    } else {
                        callback(new Error("Not allowed by CORS"));
                    }
                }
            }
        },
        credentials: true,
    })
);

app.use(express.json());

// Clerk authentication middleware
try {
    app.use(clerkMiddleware());
    if (process.env.CLERK_SECRET_KEY) {
        console.log("Clerk middleware initialized successfully");
    } else {
        console.warn(
            "Clerk middleware initialized but CLERK_SECRET_KEY is missing - authentication may fail"
        );
    }
} catch (error) {
    console.error("Failed to initialize Clerk middleware:", error);
    throw error;
}

app.use(globalRateLimiter);
app.use(apiLogger);

// Swagger UI
app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle: "Poker Utilities API Documentation",
    })
);

Object.values(routers).forEach((router) => {
    app.use(router);
});

app.get("*", (_, res) => {
    res.setHeader("Cache-Control", "public, no-store");
    res.sendFile(path.resolve(__dirname, "../../../../web/public/index.html"));
});

app.use(errorHandler);

// Only start server if not in Vercel environment
if (!process.env.VERCEL) {
    app.listen(port, () => {
        console.log(`⚠️  DEPRECATED Express server running at http://localhost:${port}`);
        console.log(`   This is for local development only. Use /api functions for production.`);
    });
} else {
    console.log("Running in Vercel - serverless functions should be used instead");
}

// Export app for potential use in other contexts (though deprecated)
export default app;
