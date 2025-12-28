// Vercel Serverless Function Entry Point
// This wraps the Express app to work as a serverless function

// Conditionally initialize telemetry only if not in serverless environment
const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;

if (!isServerless) {
    // Only initialize telemetry in traditional server environments
    const { initializeTelemetry } = require('../server/src/config/telemetry');
    initializeTelemetry();
}

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { clerkMiddleware } from "@clerk/express";

import * as routers from "../server/src/routes";
import {
    apiLogger,
    telemetryLogger,
    errorHandler,
    globalRateLimiter,
} from "../server/src/middlewares";
import { swaggerSpec } from "../server/src/config/swagger";

// Load environment variables
dotenv.config();

// Initialize user metrics (in serverless, this will run on cold start)
import { getUserCount } from "../server/src/services/userService";
import { totalUsersGauge } from "../server/src/config/metrics";

// Track if metrics have been initialized to avoid duplicate work
let metricsInitialized = false;

async function initializeUserMetrics() {
    if (metricsInitialized) return;
    
    try {
        const userCount = await getUserCount();
        totalUsersGauge.add(userCount);
        console.log(`Initialized user metrics with ${userCount} users`);
        metricsInitialized = true;
    } catch (error) {
        console.error("Failed to initialize user metrics:", error);
    }
}

// Create Express app
const app = express();

// CORS configuration - allow credentials for cookies
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
    : ["http://localhost:4000", "http://localhost:8080"];

const isDevelopment = process.env.NODE_ENV !== "production";

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) {
                return callback(null, true);
            }

            // In development, allow localhost with any port
            if (isDevelopment && origin.startsWith("http://localhost:")) {
                return callback(null, true);
            }

            // Check if origin is in allowed list
            if (allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                // In production, reject unknown origins
                if (isDevelopment) {
                    callback(null, true); // Allow in development
                } else {
                    callback(new Error("Not allowed by CORS"));
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

app.use(globalRateLimiter); // Global rate limiting
app.use(apiLogger); // Console logging for debugging
app.use(telemetryLogger); // OpenTelemetry tracing

// Swagger UI (primarily for development)
app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle: "Poker Utilities API Documentation",
    })
);

// Register all API routes
Object.values(routers).forEach((router) => {
    app.use(router);
});

// Error handler
app.use(errorHandler);

// Initialize metrics asynchronously (don't block function execution)
if (isServerless) {
    initializeUserMetrics().catch((error) => {
        console.error("Failed to initialize user metrics:", error);
    });
}

// Export for Vercel serverless
export default app;

