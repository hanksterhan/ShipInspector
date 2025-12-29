// Vercel Serverless Function Entry Point
// This wraps the Express app to work as a serverless function

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { clerkMiddleware } from "@clerk/express";

import * as routers from "../server/dist/server/src/routes";
import {
    apiLogger,
    errorHandler,
    globalRateLimiter,
} from "../server/dist/server/src/middlewares";
import { swaggerSpec } from "../server/dist/server/src/config/swagger";

// Load environment variables
dotenv.config();

// Log environment info for debugging
console.log('=== API Function Startup ===');
console.log('Environment:', process.env.NODE_ENV);
console.log('VERCEL env:', process.env.VERCEL);
console.log('Clerk Secret Key present:', !!process.env.CLERK_SECRET_KEY);
console.log('Database URL present:', !!process.env.DATABASE_URL);
console.log('===========================');

// Create Express app
const app = express();

// CORS configuration - allow credentials for cookies
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
    : ["http://localhost:4000", "http://localhost:8080"];

const isDevelopment = process.env.NODE_ENV !== "production";

app.use(
    cors({
        origin: (origin: any, callback: any) => {
            console.log(`CORS request from origin: ${origin}`);
            
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) {
                console.log('CORS: Allowing request with no origin');
                return callback(null, true);
            }

            // In development, allow localhost with any port
            if (isDevelopment && origin.startsWith("http://localhost:")) {
                console.log('CORS: Allowing localhost in development');
                return callback(null, true);
            }

            // Allow requests from the same domain (for Vercel deployments)
            // This handles cases where the API is on the same domain as the frontend
            if (origin.includes('.vercel.app') || origin.includes('sipoker.club')) {
                console.log('CORS: Allowing Vercel/production domain');
                return callback(null, true);
            }

            // Check if origin is in allowed list
            if (allowedOrigins.indexOf(origin) !== -1) {
                console.log('CORS: Allowing configured origin');
                callback(null, true);
            } else {
                // In production, log but allow (for now, for debugging)
                console.warn(`CORS: Origin not in allowed list: ${origin}`);
                if (isDevelopment) {
                    callback(null, true); // Allow in development
                } else {
                    // Allow in production for now while debugging
                    callback(null, true);
                    // callback(new Error("Not allowed by CORS"));
                }
            }
        },
        credentials: true,
    })
);

app.use(express.json());

// Clerk authentication middleware
try {
    console.log('Initializing Clerk middleware...');
    app.use(clerkMiddleware());
    console.log("✅ Clerk middleware initialized successfully");
    
    if (!process.env.CLERK_SECRET_KEY) {
        console.error(
            "❌ CLERK_SECRET_KEY is missing! Authentication will fail."
        );
        console.error(
            "Please set CLERK_SECRET_KEY in Vercel environment variables."
        );
    }
} catch (error: any) {
    console.error("❌ Failed to initialize Clerk middleware:", error);
    console.error("Error details:", error.message, error.stack);
    // Don't throw - let the app start but authentication will fail
    console.warn("⚠️  App starting without Clerk authentication");
}

app.use(globalRateLimiter); // Global rate limiting
app.use(apiLogger); // Console logging for debugging

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

// Export for Vercel serverless
export default app;

