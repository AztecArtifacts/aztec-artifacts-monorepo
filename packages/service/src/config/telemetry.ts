/**
 * OpenTelemetry configuration and initialization module
 */

import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { type Resource, resourceFromAttributes } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { ATTR_DEPLOYMENT_ENVIRONMENT_NAME } from '@opentelemetry/semantic-conventions/incubating';
import type { TelemetryConfig } from '../types/telemetry.js';

let sdk: NodeSDK | null = null;

/**
 * Get telemetry configuration from environment variables
 */
export function getTelemetryConfig(): TelemetryConfig {
  return {
    serviceName: process.env.OTEL_SERVICE_NAME || 'api-service',
    serviceVersion: process.env.OTEL_SERVICE_VERSION || '0.0.19',
    otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318',
    otlpHeaders: process.env.OTEL_EXPORTER_OTLP_HEADERS
      ? JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS)
      : undefined,
    samplingRatio: Number.parseFloat(process.env.OTEL_TRACES_SAMPLER_ARG || '1.0'),
    enableTracing: process.env.OTEL_ENABLE_TRACING !== 'false',
    enableMetrics: process.env.OTEL_ENABLE_METRICS !== 'false',
    enableAutoInstrumentation: process.env.OTEL_ENABLE_AUTO_INSTRUMENTATION !== 'false',
    environment: process.env.OTEL_ENVIRONMENT || process.env.NODE_ENV || 'development',
  };
}

/**
 * Create OpenTelemetry trace exporter
 */
function createTraceExporter(config: TelemetryConfig): OTLPTraceExporter {
  return new OTLPTraceExporter({
    url: `${config.otlpEndpoint}/v1/traces`,
    headers: config.otlpHeaders,
  });
}

/**
 * Create OpenTelemetry metric reader with OTLP exporter
 */
function createMetricReader(config: TelemetryConfig): PeriodicExportingMetricReader {
  const metricExporter = new OTLPMetricExporter({
    url: `${config.otlpEndpoint}/v1/metrics`,
    headers: config.otlpHeaders,
  });

  return new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 60000, // Export every 60 seconds
    exportTimeoutMillis: 30000, // 30 second timeout
  });
}

/**
 * Create OpenTelemetry resource with service metadata
 */
function createResource(config: TelemetryConfig): Resource {
  // Create custom resource with your service metadata
  const customResource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: config.serviceName,
    [ATTR_SERVICE_VERSION]: config.serviceVersion,
    [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: config.environment,
  });

  return customResource;
}

/**
 * Initialize OpenTelemetry SDK with configuration
 */
export function initializeTelemetry(): void {
  // Skip initialization if already initialized or in test environment
  if (sdk || process.env.NODE_ENV === 'test') {
    return;
  }

  const config = getTelemetryConfig();

  // Skip initialization if telemetry is disabled
  if (!config.enableTracing && !config.enableMetrics) {
    return;
  }

  try {
    // Create resource with service information
    const resource = createResource(config);

    // Configure instrumentations
    const instrumentations = config.enableAutoInstrumentation
      ? getNodeAutoInstrumentations({
          // Disable file system instrumentation to reduce noise
          '@opentelemetry/instrumentation-fs': {
            enabled: false,
          },
          // Configure HTTP instrumentation
          '@opentelemetry/instrumentation-http': {
            enabled: true,
          },
          // Configure PostgreSQL instrumentation if available
          '@opentelemetry/instrumentation-pg': {
            enabled: true,
          },
          // Configure Pino instrumentation
          '@opentelemetry/instrumentation-pino': {
            enabled: true,
          },
        })
      : [];

    // Initialize SDK
    sdk = new NodeSDK({
      resource,
      instrumentations,
      traceExporter: config.enableTracing ? createTraceExporter(config) : undefined,
      metricReader: config.enableMetrics ? createMetricReader(config) : undefined,
    });

    // Start the SDK
    sdk.start();

    // OpenTelemetry initialized successfully
  } catch (_error) {
    // Failed to initialize OpenTelemetry - continue execution
    // Continue execution even if telemetry fails to initialize
  }
}

/**
 * Gracefully shutdown OpenTelemetry SDK
 */
export async function shutdownTelemetry(): Promise<void> {
  if (!sdk) {
    return;
  }

  try {
    await sdk.shutdown();
    sdk = null;
    // OpenTelemetry shutdown successfully
  } catch (_error) {
    // Error shutting down OpenTelemetry
  }
}

/**
 * Check if telemetry is initialized and active
 */
export function isTelemetryEnabled(): boolean {
  return sdk !== null;
}

/**
 * Get current telemetry configuration (for debugging/monitoring)
 */
export function getCurrentTelemetryConfig(): TelemetryConfig | null {
  if (!sdk) {
    return null;
  }
  return getTelemetryConfig();
}
