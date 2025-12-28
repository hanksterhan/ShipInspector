// OpenTelemetry must be initialized BEFORE any other imports
import { initializeTelemetry } from "./config/telemetry";
initializeTelemetry();

// Pyroscope profiling should also be initialized early
// TEMPORARILY DISABLED
// import { initializePyroscope, shutdownPyroscope } from "./config/pyroscope";
// initializePyroscope();

import express from "express";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { clerkMiddleware } from "@clerk/express";

import * as routers from "./routes";
import {
    apiLogger,
    telemetryLogger,
    errorHandler,
    globalRateLimiter,
} from "./middlewares";
import { swaggerSpec } from "./config/swagger";

dotenv.config();

// Initialize user metrics (admin user should be created via script)
import { getUserCount } from "./services/userService";
import { totalUsersGauge } from "./config/metrics";

// Initialize total users gauge with current user count from database
async function initializeUserMetrics() {
    const userCount = await getUserCount();
    totalUsersGauge.add(userCount);
    console.log(`Initialized user metrics with ${userCount} users`);
    console.log(`Note: Create admin user by running: npm run create-admin`);
}

// Call async initialization (don't await to allow server to start)
initializeUserMetrics().catch((error) => {
    console.error("Failed to initialize user metrics:", error);
});

const port = process.env.PORT || 3000;

const app = express();

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
app.use(clerkMiddleware());

app.use(globalRateLimiter); // Global rate limiting
app.use(apiLogger); // Console logging for debugging
app.use(telemetryLogger); // OpenTelemetry tracing

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

// Gracefully shutdown Pyroscope on process termination
process.on("SIGTERM", () => {
    // shutdownPyroscope(); // TEMPORARILY DISABLED
    process.exit(0);
});

process.on("SIGINT", () => {
    // shutdownPyroscope(); // TEMPORARILY DISABLED
    process.exit(0);
});
