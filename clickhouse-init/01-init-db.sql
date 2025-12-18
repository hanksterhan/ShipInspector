CREATE DATABASE IF NOT EXISTS observability;

USE observability;

-- Note: The otel_traces table will be automatically created by the OpenTelemetry
-- ClickHouse exporter with the correct schema. No need to create it manually.

-- Logs table for OpenTelemetry logs
CREATE TABLE IF NOT EXISTS logs
(
    `timestamp` DateTime64(9),
    `trace_id` String,
    `span_id` String,
    `trace_flags` UInt32,
    `severity_text` LowCardinality(String),
    `severity_number` Int32,
    `body` String,
    `resource_attributes` Map(String, String),
    `log_attributes` Map(String, String),
    INDEX idx_trace_id trace_id TYPE bloom_filter(0.001) GRANULARITY 1,
    INDEX idx_severity_text severity_text TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_resource_attributes_key mapKeys(resource_attributes) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_log_attributes_key mapKeys(log_attributes) TYPE bloom_filter(0.01) GRANULARITY 1
)
ENGINE = MergeTree()
PARTITION BY toDate(timestamp)
ORDER BY (timestamp, severity_number)
TTL timestamp + INTERVAL 7 DAY
SETTINGS index_granularity = 8192;

