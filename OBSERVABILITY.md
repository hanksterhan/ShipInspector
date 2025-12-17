# Observability Setup Guide

This document explains how to set up and use the OpenTelemetry observability stack for the Ship Inspector server.

## Architecture Overview

The observability stack consists of:

- **OpenTelemetry Collector**: Receives traces, metrics, and logs from your application and routes them to appropriate backends
- **ClickHouse**: Stores traces and logs
- **Prometheus**: Stores metrics
- **Pyroscope**: Continuous profiling for performance analysis
- **Grafana**: Visualizes data from all sources

All services run in Docker containers for easy local development.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for the server)

## Quick Start

1. **Install server dependencies** (if not already done):
   ```bash
   cd server
   npm install
   ```

2. **Start the observability stack**:
   ```bash
   docker-compose up -d
   ```

   This will start:
   - OpenTelemetry Collector on port 4317 (gRPC) and 4318 (HTTP)
   - ClickHouse on ports 8123 (HTTP) and 9000 (native)
   - Prometheus on port 9090
   - Pyroscope on port 4040
   - Grafana on port 3001

3. **Start your server**:
   ```bash
   cd server
   npm run start
   ```

   The server will automatically send telemetry data to the OpenTelemetry Collector.

4. **Access the services**:
   - **Grafana**: http://localhost:3001 (admin/ShipInspector)
   - **Prometheus**: http://localhost:9090
   - **Pyroscope**: http://localhost:4040
   - **ClickHouse HTTP**: http://localhost:8123

## Configuration

### Environment Variables

You can configure OpenTelemetry using environment variables:

- `OTEL_EXPORTER_OTLP_ENDPOINT`: OTLP endpoint URL (default: `http://localhost:4318`)
- `SERVICE_NAME`: Service name for traces/metrics (default: `ship-inspector-server`)
- `SERVICE_VERSION`: Service version (default: `1.0.0`)
- `NODE_ENV`: Environment name (default: `development`)

You can configure Pyroscope using environment variables:

- `PYROSCOPE_SERVER_URL`: Pyroscope server URL (default: `http://localhost:4040`)
- `SERVICE_NAME`: Service name for profiling (default: `ship-inspector-server`)
- `SERVICE_VERSION`: Service version (default: `1.0.0`)
- `NODE_ENV`: Environment name (default: `development`)

### OpenTelemetry Collector

The collector configuration is in `otel-collector-config.yaml`. It:
- Receives data via OTLP (gRPC and HTTP)
- Exports traces and logs to ClickHouse
- Exports metrics to Prometheus
- Includes resource attributes (service name, version, environment)

### Prometheus

Prometheus configuration is in `prometheus.yml`. It scrapes:
- OpenTelemetry Collector metrics endpoint
- Your application metrics (if exposed)

### ClickHouse

ClickHouse is initialized with:
- `traces` table for trace data
- `logs` table for log data
- 7-day TTL (data older than 7 days is automatically deleted)

### Pyroscope

Pyroscope provides continuous profiling for performance analysis:
- CPU profiling to identify hot paths and bottlenecks
- Memory profiling to detect memory leaks and high allocations
- Automatic profiling with minimal overhead
- Integrated with Grafana for visualization

## Using OpenTelemetry in Your Code

### Automatic Instrumentation

Most common libraries are automatically instrumented:
- Express.js HTTP requests
- HTTP client requests (axios, fetch)
- Database operations
- And more...

### Manual Instrumentation

You can create custom spans, add metrics, and emit logs:

```typescript
import { trace, metrics, logs } from "@opentelemetry/api";

// Create a custom span
const tracer = trace.getTracer("my-tracer");
const span = tracer.startSpan("my-operation");
try {
  // Your code here
  span.setAttribute("custom.attribute", "value");
} finally {
  span.end();
}

// Create a custom metric
const meter = metrics.getMeter("my-meter");
const counter = meter.createCounter("my.counter");
counter.add(1, { label: "value" });

// Emit a log
const logger = logs.getLogger("my-logger");
logger.emit({
  severityNumber: 9, // INFO
  severityText: "INFO",
  body: "My log message",
  attributes: { key: "value" },
});
```

### Using the Telemetry Logger Middleware

The server includes a `telemetryLogger` middleware that automatically creates spans and logs for each HTTP request. To use it, replace `apiLogger` with `telemetryLogger`:

```typescript
import { telemetryLogger } from "./middlewares/telemetryLogger";

app.use(telemetryLogger);
```

## Querying Data

### Prometheus Queries

Access Prometheus UI at http://localhost:9090 and try queries like:

- Request rate: `rate(http_server_request_duration_seconds_count[5m])`
- Request duration p95: `histogram_quantile(0.95, rate(http_server_request_duration_seconds_bucket[5m]))`
- Error rate: `rate(http_server_request_duration_seconds_count{http_status_code=~"5.."}[5m])`

### ClickHouse Queries

You can query ClickHouse directly:

```sql
-- View recent traces
SELECT * FROM observability.traces 
ORDER BY timestamp DESC 
LIMIT 100;

-- View recent logs
SELECT * FROM observability.logs 
ORDER BY timestamp DESC 
LIMIT 100;

-- Find traces by service
SELECT * FROM observability.traces 
WHERE service_name = 'ship-inspector-server' 
ORDER BY timestamp DESC;
```

### Grafana Dashboards

Access Grafana at http://localhost:3001 and:
1. Go to Dashboards
2. Import the default dashboard or create your own
3. Explore data from Prometheus, ClickHouse, and Pyroscope datasources

### Pyroscope Profiling

Access Pyroscope UI at http://localhost:4040 to:
- View real-time CPU and memory profiles
- Analyze performance over time
- Identify hot functions and bottlenecks
- Compare profiles across different time ranges

In Grafana, you can also:
- Use the Pyroscope datasource to create profiling visualizations
- Correlate profiling data with metrics and traces
- Set up alerts based on profiling data

## Troubleshooting

### Services not starting

Check if ports are already in use:
- 4317, 4318: OTLP ports
- 8123, 9000: ClickHouse
- 9090: Prometheus
- 4040: Pyroscope
- 3001: Grafana

### No data appearing

1. Verify the OpenTelemetry Collector is running: `docker-compose ps`
2. Check collector logs: `docker-compose logs otel-collector`
3. Verify your server is connecting to the collector (check server logs)
4. Ensure `OTEL_EXPORTER_OTLP_ENDPOINT` is set correctly

### High memory usage

If ClickHouse or Prometheus use too much memory, you can:
- Reduce the TTL in ClickHouse (currently 7 days)
- Adjust retention in Prometheus
- Reduce scrape intervals

## Stopping the Stack

To stop all services:

```bash
docker-compose down
```

To stop and remove all data:

```bash
docker-compose down -v
```

## Production Considerations

For production deployment, consider:

1. **Security**: 
   - Change default Grafana credentials
   - Use authentication for all services
   - Secure ClickHouse and Prometheus

2. **Scalability**:
   - Run ClickHouse and Prometheus on separate infrastructure
   - Use managed services (e.g., Grafana Cloud, ClickHouse Cloud)
   - Configure proper retention policies

3. **Monitoring**:
   - Monitor the observability stack itself
   - Set up alerts in Grafana
   - Configure proper sampling for high-traffic services

4. **Data Management**:
   - Increase retention periods as needed
   - Set up data archival for long-term storage
   - Configure appropriate TTLs based on your needs

## Additional Resources

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [ClickHouse Documentation](https://clickhouse.com/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Pyroscope Documentation](https://grafana.com/docs/pyroscope/latest/)

