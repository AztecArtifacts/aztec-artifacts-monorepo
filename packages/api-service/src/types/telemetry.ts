/**
 * TypeScript types and interfaces for OpenTelemetry instrumentation
 */

import type { Counter, Histogram, Meter, Span, Tracer, UpDownCounter } from '@opentelemetry/api';
import type { BaseLogger } from 'pino';

/**
 * Telemetry configuration for the service
 */
export interface TelemetryConfig {
  /** Service name for telemetry identification */
  serviceName: string;
  /** Service version for telemetry identification */
  serviceVersion: string;
  /** OTLP endpoint URL for exporting telemetry data */
  otlpEndpoint: string;
  /** Optional headers for OTLP requests */
  otlpHeaders?: Record<string, string>;
  /** Sampling ratio for traces (0.0 to 1.0) */
  samplingRatio: number;
  /** Whether to enable tracing */
  enableTracing: boolean;
  /** Whether to enable metrics */
  enableMetrics: boolean;
  /** Whether to enable automatic instrumentation */
  enableAutoInstrumentation: boolean;
  /** Deployment environment */
  environment: string;
}

/**
 * Span attributes for consistent tagging across the application
 */
export interface SpanAttributes {
  /** Database operation type (select, insert, update, delete) */
  'db.operation'?: string;
  /** Database table name */
  'db.table'?: string;
  /** Database statement/query */
  'db.statement'?: string;
  /** HTTP route pattern */
  'http.route'?: string;
  /** Token contract address */
  'token.address'?: string;
  /** Contract instance address */
  'contract.address'?: string;
  /** Contract class identifier */
  'contract.class_id'?: string;
  /** API operation name */
  'api.operation'?: string;
  /** API resource being accessed */
  'api.resource'?: string;
  /** Error type classification */
  'error.type'?: string;
  /** Error message */
  'error.message'?: string;
  /** Custom business attributes */
  [key: string]: string | number | boolean | undefined;
}

/**
 * Metrics instruments for collecting telemetry data
 */
export interface ApiMetrics {
  /** HTTP request duration histogram */
  requestDuration: Histogram;
  /** HTTP request counter */
  requestCount: Counter;
  /** Database query duration histogram */
  dbQueryDuration: Histogram;
  /** Database query counter */
  dbQueryCount: Counter;
  /** Error counter by type */
  errorCount: Counter;
  /** Active requests gauge */
  activeRequests: UpDownCounter;
}

/**
 * Enhanced logger interface with trace context
 */
export interface TelemetryLogger extends BaseLogger {
  /** Current span context */
  span?: Span;
  /** Current trace ID */
  traceId?: string;
  /** Current span ID */
  spanId?: string;
}

/**
 * Instrumented service interface
 */
export interface InstrumentedService {
  /** OpenTelemetry tracer instance */
  tracer: Tracer;
  /** OpenTelemetry meter instance */
  meter: Meter;
}

/**
 * Trace context for correlation
 */
export interface TraceContext {
  /** W3C trace ID */
  traceId: string;
  /** W3C span ID */
  spanId: string;
  /** Trace flags */
  traceFlags: string;
  /** Span context state */
  traceState?: string;
}

/**
 * Metric tags for consistent labeling
 */
export interface MetricTags {
  /** HTTP method */
  method?: string;
  /** HTTP route */
  route?: string;
  /** HTTP status code */
  status_code?: string;
  /** Service operation */
  operation?: string;
  /** Resource type */
  resource?: string;
  /** Error type */
  error_type?: string;
  /** Allow additional string keys */
  [key: string]: string | number | boolean | undefined;
}

/**
 * Custom span options
 */
export interface SpanOptions {
  /** Span name */
  name: string;
  /** Span attributes */
  attributes?: SpanAttributes;
  /** Parent span context */
  parent?: Span;
  /** Span kind */
  kind?: 'client' | 'server' | 'producer' | 'consumer' | 'internal';
}
