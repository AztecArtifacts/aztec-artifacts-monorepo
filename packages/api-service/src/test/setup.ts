import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { shutdownTelemetry } from '../config/telemetry.js';

// Global test setup
beforeAll(async () => {
  // Set NODE_ENV to test to disable telemetry initialization
  process.env.NODE_ENV = 'test';

  // Disable telemetry for tests by default
  process.env.OTEL_ENABLE_TRACING = 'false';
  process.env.OTEL_ENABLE_METRICS = 'false';
  process.env.OTEL_ENABLE_AUTO_INSTRUMENTATION = 'false';

  // Set test-specific telemetry configuration
  process.env.OTEL_SERVICE_NAME = 'api-service-test';
  process.env.OTEL_ENVIRONMENT = 'test';

  // Setup before all tests
});

afterAll(async () => {
  // Ensure telemetry is properly shutdown after tests
  await shutdownTelemetry();

  // Cleanup after all tests
});

beforeEach(async () => {
  // Setup before each test
});

afterEach(async () => {
  // Cleanup after each test
});
