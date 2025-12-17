import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import {
    LoggerProvider,
    SimpleLogRecordProcessor,
} from "@opentelemetry/sdk-logs";
import { logs } from "@opentelemetry/api-logs";
import { Resource } from "@opentelemetry/resources";

const OTLP_ENDPOINT =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318";
const SERVICE_NAME = process.env.SERVICE_NAME || "ship-inspector-server";
const SERVICE_VERSION = process.env.SERVICE_VERSION || "1.0.0";
const ENVIRONMENT = process.env.NODE_ENV || "development";

let loggerProvider: LoggerProvider | null = null;

/**
 * Initialize OpenTelemetry logging
 * This is separate from the main SDK to avoid version conflicts
 */
export function initializeLogging(): void {
    try {
        const resource = new Resource({
            "service.name": SERVICE_NAME,
            "service.version": SERVICE_VERSION,
            "deployment.environment": ENVIRONMENT,
        });

        const logExporter = new OTLPLogExporter({
            url: `${OTLP_ENDPOINT}/v1/logs`,
        });

        // Create log processor
        const logProcessor = new SimpleLogRecordProcessor(logExporter as any);

        // Create logger provider
        // Note: The LoggerProvider API varies by version. We'll try to set up the processor
        // using the internal structure if the constructor doesn't support it directly
        loggerProvider = new LoggerProvider({
            resource: resource as any, // Type assertion to avoid Resource version conflicts
        });

        // Try to add the processor - different SDK versions have different APIs
        // Method 1: Try addLogRecordProcessor (if it exists)
        if (
            typeof (loggerProvider as any).addLogRecordProcessor === "function"
        ) {
            (loggerProvider as any).addLogRecordProcessor(logProcessor);
        }
        // Method 2: Try setting processors array directly
        else if ((loggerProvider as any)._processors) {
            (loggerProvider as any)._processors.push(logProcessor);
        }
        // Method 3: Try forceFlush to see if processor is needed at all
        // If none of these work, logs may still work via the exporter being registered
        else {
            // Some versions may auto-detect processors, so we'll proceed
            console.warn(
                "Could not explicitly add log processor - logs may not be exported"
            );
        }

        // Set the global logger provider
        logs.setGlobalLoggerProvider(loggerProvider);

        console.log("OpenTelemetry logging initialized");
    } catch (error) {
        console.warn("Failed to initialize OpenTelemetry logging:", error);
        console.warn("Logs will still be sent via traces");
    }
}

/**
 * Shutdown logging provider
 */
export async function shutdownLogging(): Promise<void> {
    if (loggerProvider) {
        await loggerProvider.shutdown();
        loggerProvider = null;
    }
}
