import { afterEach, describe, expect, it } from 'vitest';
import { getTelemetryConfig, initializeTelemetry, isTelemetryEnabled, shutdownTelemetry } from '../config/telemetry.js';
import { createMetrics, getMetrics } from '../utils/metrics.js';
import { addSpanAttributes, getTracer, withSpan } from '../utils/tracing.js';

describe('Telemetry Configuration', () => {
  afterEach(async () => {
    await shutdownTelemetry();
  });

  it('should load configuration from environment variables', () => {
    process.env.OTEL_SERVICE_NAME = 'test-service';
    process.env.OTEL_SERVICE_VERSION = '1.0.0';
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://test:4318';
    process.env.OTEL_ENVIRONMENT = 'test';

    const config = getTelemetryConfig();

    expect(config.serviceName).toBe('test-service');
    expect(config.serviceVersion).toBe('1.0.0');
    expect(config.otlpEndpoint).toBe('http://test:4318');
    expect(config.environment).toBe('test');
  });

  it('should use default values when environment variables are not set', () => {
    delete process.env.OTEL_SERVICE_NAME;
    delete process.env.OTEL_SERVICE_VERSION;
    delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

    const config = getTelemetryConfig();

    expect(config.serviceName).toBe('api-service');
    expect(config.serviceVersion).toBe('0.0.19');
    expect(config.otlpEndpoint).toBe('http://localhost:4318');
  });

  it('should not initialize telemetry in test environment', () => {
    process.env.NODE_ENV = 'test';
    initializeTelemetry();
    expect(isTelemetryEnabled()).toBe(false);
  });
});

describe('Tracing Utilities', () => {
  it('should get tracer instance', () => {
    const tracer = getTracer();
    expect(tracer).toBeDefined();
  });

  it('should execute function within span', async () => {
    const result = await withSpan(
      {
        name: 'test-span',
        attributes: { 'test.attribute': 'value' },
      },
      async (span) => {
        expect(span).toBeDefined();
        return 'test-result';
      },
    );

    expect(result).toBe('test-result');
  });

  it('should handle errors in spans', async () => {
    await expect(
      withSpan(
        {
          name: 'error-span',
        },
        async () => {
          throw new Error('Test error');
        },
      ),
    ).rejects.toThrow('Test error');
  });
});

describe('Metrics Utilities', () => {
  it('should create and get metrics', () => {
    const metrics = createMetrics();
    expect(metrics).toBeDefined();
    expect(metrics.requestDuration).toBeDefined();
    expect(metrics.requestCount).toBeDefined();
    expect(metrics.dbQueryDuration).toBeDefined();
    expect(metrics.dbQueryCount).toBeDefined();
    expect(metrics.errorCount).toBeDefined();
    expect(metrics.activeRequests).toBeDefined();

    const metricsAgain = getMetrics();
    expect(metricsAgain).toBe(metrics); // Should return the same instance
  });
});

describe('Service Integration', () => {
  it('should work with disabled telemetry', () => {
    // This test verifies that telemetry functions don't break when telemetry is disabled
    process.env.NODE_ENV = 'test';

    // These should not throw errors even with telemetry disabled
    expect(() => addSpanAttributes({ 'test.key': 'value' })).not.toThrow();
    expect(() => getTracer()).not.toThrow();
    expect(() => createMetrics()).not.toThrow();
  });
});
