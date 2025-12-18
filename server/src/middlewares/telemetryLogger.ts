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
    // Use originalUrl for the full path, route will be updated after route matching
    const spanName = `HTTP ${req.method} ${req.originalUrl || req.url}`;

    // Prepare span attributes
    const spanAttributes: Record<string, any> = {
        "http.method": req.method,
        "http.url": req.originalUrl || req.url,
        "http.target": req.originalUrl || req.url,
        "http.scheme": req.protocol,
        "http.host": req.get("host") || "",
    };

    // Add request body for POST/PUT/PATCH requests (with size limit to avoid huge payloads)
    if (["POST", "PUT", "PATCH"].includes(req.method) && req.body) {
        try {
            const bodyStr = JSON.stringify(req.body);
            // Limit body size to 10KB to avoid huge span attributes
            if (bodyStr.length <= 10240) {
                spanAttributes["http.request.body"] = bodyStr;
            } else {
                spanAttributes["http.request.body"] =
                    bodyStr.substring(0, 10240) + "... (truncated)";
                spanAttributes["http.request.body.size"] = bodyStr.length;
            }
        } catch (e) {
            // If body can't be stringified, skip it
            spanAttributes["http.request.body.error"] =
                "Failed to serialize body";
        }
    }

    const span = tracer.startSpan(spanName, {
        kind: 1, // SERVER
        attributes: spanAttributes,
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

        // Update route attribute with the actual matched route if available
        const routePath = (req as any).route?.path || req.path;
        const attributes: Record<string, any> = {
            "http.status_code": res.statusCode,
            "http.response_size": res.get("content-length") || 0,
            "http.duration_ms": duration,
        };

        // Set route if we have a matched route (not a catch-all)
        if ((req as any).route?.path) {
            attributes["http.route"] = routePath;
        } else {
            // For unmatched routes, use the original path
            attributes["http.route"] = req.originalUrl || req.url;
        }

        span.setAttributes(attributes);

        // Set span status based on HTTP status code
        if (res.statusCode >= 500) {
            // Server errors (5xx)
            span.setStatus({
                code: 2, // ERROR
                message: `HTTP ${res.statusCode}`,
            });
        } else if (res.statusCode >= 400) {
            // Client errors (4xx)
            span.setStatus({
                code: 2, // ERROR
                message: `HTTP ${res.statusCode}`,
            });
        } else if (res.statusCode >= 200 && res.statusCode < 300) {
            // Success (2xx)
            span.setStatus({
                code: 1, // OK
            });
        }
        // Other status codes (1xx, 3xx) remain UNSET

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
