import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { SimpleLogRecordProcessor } from "@opentelemetry/sdk-logs";

const OTLP_ENDPOINT =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318";
const SERVICE_NAME = process.env.SERVICE_NAME || "ship-inspector-server";
const SERVICE_VERSION = process.env.SERVICE_VERSION || "1.0.0";
const ENVIRONMENT = process.env.NODE_ENV || "development";

/**
 * Initialize OpenTelemetry instrumentation
 * Should be called before importing any other modules
 */
export function initializeTelemetry(): NodeSDK {
    const resource = new Resource({
        "service.name": SERVICE_NAME,
        "service.version": SERVICE_VERSION,
        "deployment.environment": ENVIRONMENT,
    });

    const traceExporter = new OTLPTraceExporter({
        url: `${OTLP_ENDPOINT}/v1/traces`,
    });

    const metricExporter = new OTLPMetricExporter({
        url: `${OTLP_ENDPOINT}/v1/metrics`,
    });

    const logExporter = new OTLPLogExporter({
        url: `${OTLP_ENDPOINT}/v1/logs`,
    });

    const logProcessor = new SimpleLogRecordProcessor(logExporter as any);

    // Initialize the SDK with traces, metrics, and logs
    const sdk = new NodeSDK({
        resource,
        traceExporter,
        instrumentations: [
            getNodeAutoInstrumentations({
                // Enable all auto-instrumentations
                "@opentelemetry/instrumentation-fs": {
                    enabled: false, // Disable file system instrumentation to reduce noise
                },
            }),
        ],
        metricReader: new PeriodicExportingMetricReader({
            exporter: metricExporter,
            exportIntervalMillis: 10000, // Export metrics every 10 seconds
        }) as any, // Type assertion to work around version conflicts between nested dependencies
        logRecordProcessor: logProcessor as any, // Type assertion for version compatibility
    });

    // Start the SDK
    sdk.start();

    console.log(`OpenTelemetry initialized for service: ${SERVICE_NAME}`);
    console.log(`OTLP endpoint: ${OTLP_ENDPOINT}`);
    console.log(`Traces, metrics, and logs enabled.`);

    // Gracefully shutdown the SDK on process termination
    process.on("SIGTERM", () => {
        sdk.shutdown()
            .then(() => console.log("OpenTelemetry terminated"))
            .catch((error) =>
                console.log("Error terminating OpenTelemetry", error)
            )
            .finally(() => process.exit(0));
    });

    return sdk;
}
