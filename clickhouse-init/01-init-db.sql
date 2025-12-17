CREATE DATABASE IF NOT EXISTS observability;

USE observability;

-- Traces table for OpenTelemetry traces
CREATE TABLE IF NOT EXISTS traces
(
    `timestamp` DateTime64(9),
    `trace_id` String,
    `span_id` String,
    `parent_span_id` String,
    `trace_state` String,
    `span_name` LowCardinality(String),
    `span_kind` LowCardinality(String),
    `service_name` LowCardinality(String),
    `resource_attributes` Map(String, String),
    `span_attributes` Map(String, String),
    `duration` Int64,
    `status_code` LowCardinality(String),
    `status_message` String,
    `events` Nested(
        timestamp DateTime64(9),
        name LowCardinality(String),
        attributes Map(String, String)
    ),
    `links` Nested(
        trace_id String,
        span_id String,
        trace_state String,
        attributes Map(String, String)
    ),
    INDEX idx_trace_id trace_id TYPE bloom_filter(0.001) GRANULARITY 1,
    INDEX idx_service_name service_name TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_span_name span_name TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_resource_attributes_key mapKeys(resource_attributes) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_span_attributes_key mapKeys(span_attributes) TYPE bloom_filter(0.01) GRANULARITY 1
)
ENGINE = MergeTree()
PARTITION BY toDate(timestamp)
ORDER BY (service_name, timestamp)
TTL timestamp + INTERVAL 7 DAY
SETTINGS index_granularity = 8192;

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

