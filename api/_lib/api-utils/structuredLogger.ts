import { VercelRequest } from "@vercel/node";

const PATHS_TO_SKIP = [
    "/favicon.ico",
    "/apple-touch-icon.png",
    "/apple-touch-icon-precomposed.png",
];

interface LogEntry {
    timestamp: string;
    requestId: string;
    level: "info" | "warn" | "error";
    message: string;
    method?: string;
    endpoint?: string;
    userId?: string;
    statusCode?: number;
    latencyMs?: number;
    errorType?: string;
    errorMessage?: string;
    wasmLoadTimeMs?: number;
    computeTimeMs?: number;
    dbQueryTimeMs?: number;
    [key: string]: unknown;
}

export class StructuredLogger {
    readonly requestId: string;
    private startTime: number;
    private method: string;
    private endpoint: string;
    private userId?: string;
    private skip: boolean;

    constructor(req: VercelRequest, startTime: number) {
        this.requestId = crypto.randomUUID();
        this.startTime = startTime;
        this.method = req.method || "UNKNOWN";
        this.endpoint = req.url || "";
        this.skip = PATHS_TO_SKIP.some((p) => this.endpoint.includes(p));

        if (!this.skip) {
            this.info("Request received");
        }
    }

    setUserId(userId: string): void {
        this.userId = userId;
    }

    info(message: string, extras?: Record<string, unknown>): void {
        if (this.skip) return;
        this.emit("info", message, extras);
    }

    warn(message: string, extras?: Record<string, unknown>): void {
        if (this.skip) return;
        this.emit("warn", message, extras);
    }

    error(
        message: string,
        error?: Error | unknown,
        extras?: Record<string, unknown>
    ): void {
        const errorExtras: Record<string, unknown> = { ...extras };
        if (error instanceof Error) {
            errorExtras.errorType = error.constructor.name;
            errorExtras.errorMessage = error.message;
        } else if (error) {
            errorExtras.errorType = "UnknownError";
            errorExtras.errorMessage = String(error);
        }
        this.emit("error", message, errorExtras);
    }

    logComplete(statusCode?: number, extras?: Record<string, unknown>): void {
        if (this.skip) return;
        const latencyMs = Date.now() - this.startTime;
        this.emit("info", "Request completed", {
            statusCode,
            latencyMs,
            ...extras,
        });
    }

    private emit(
        level: LogEntry["level"],
        message: string,
        extras?: Record<string, unknown>
    ): void {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            requestId: this.requestId,
            level,
            message,
            method: this.method,
            endpoint: this.endpoint,
            userId: this.userId,
            ...extras,
        };

        // Remove undefined values for cleaner output
        const clean = Object.fromEntries(
            Object.entries(entry).filter(([, v]) => v !== undefined)
        );

        console.log(JSON.stringify(clean));
    }
}
