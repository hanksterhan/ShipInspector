import { Request, Response, NextFunction } from "express";
import { context, trace } from "@opentelemetry/api";
import { logs } from "@opentelemetry/api-logs";

const PATHS_TO_SKIP = [
    "/favicon.ico",
    "/apple-touch-icon.png",
    "/apple-touch-icon-precomposed.png",
];

/**
 * Enhanced API logger that integrates with OpenTelemetry
 * Creates spans for each request and logs structured data
 */
export async function telemetryLogger(
    req: Request,
    res: Response,
    next: NextFunction
) {
    // Skip logging for certain paths
    if (PATHS_TO_SKIP.includes(req.path)) {
        next();
        return;
    }

    const tracer = trace.getTracer("express-http");
    const span = tracer.startSpan(`HTTP ${req.method} ${req.path}`, {
        kind: 1, // SERVER
        attributes: {
            "http.method": req.method,
            "http.route": req.path,
            "http.url": req.url,
            "http.target": req.path,
        },
    });

    const startTime = Date.now();

    // Set span context
    const spanContext = trace.setSpan(context.active(), span);

    // Log request start
    const logger = logs.getLogger("express-logger");
    logger.emit({
        severityNumber: 9, // INFO
        severityText: "INFO",
        body: `API Request: ${req.method} ${req.originalUrl}`,
        attributes: {
            method: req.method,
            url: req.originalUrl,
            body: JSON.stringify(req.body),
        },
    });

    // Add span to request for use in handlers
    (req as any).span = span;

    res.on("finish", () => {
        const duration = Date.now() - startTime;

        span.setAttributes({
            "http.status_code": res.statusCode,
            "http.response_size": res.get("content-length") || 0,
            "http.duration_ms": duration,
        });

        // Set span status based on HTTP status code
        if (res.statusCode >= 400) {
            span.setStatus({
                code: 2, // ERROR
                message: `HTTP ${res.statusCode}`,
            });
        }

        // Log response
        const logLevel = res.statusCode >= 400 ? 17 : 9; // ERROR or INFO
        logger.emit({
            severityNumber: logLevel,
            severityText: res.statusCode >= 400 ? "ERROR" : "INFO",
            body: `API Response: ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`,
            attributes: {
                method: req.method,
                url: req.originalUrl,
                statusCode: res.statusCode,
                duration: duration,
            },
        });

        span.end();
    });

    // Run the rest of the middleware chain with span context
    context.with(spanContext, () => {
        next();
    });
}
