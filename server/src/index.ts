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

console.log(`Server starting...`);

const port = process.env.PORT || 3000;

const app = express();

// Trust proxy - required for Vercel and other reverse proxies
// This allows express-rate-limit to correctly identify users by IP
// See: https://expressjs.com/en/guide/behind-proxies.html
app.set('trust proxy', 1);

// CORS configuration - allow credentials for cookies
// Support multiple origins for development
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
// Note: Clerk middleware automatically reads CLERK_SECRET_KEY from environment
// If CLERK_SECRET_KEY is not set, the middleware may fail silently or cause 405 errors
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

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
