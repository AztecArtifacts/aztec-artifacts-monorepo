/**
 * OpenTelemetry metrics utilities and helper functions
 */

import type { Meter } from '@opentelemetry/api';
import { metrics } from '@opentelemetry/api';
import type { ApiMetrics, MetricTags } from '../types/telemetry.js';

let apiMetrics: ApiMetrics | null = null;

/**
 * Get the default meter for the API service
 */
export function getMeter(): Meter {
  return metrics.getMeter('api-service');
}

/**
 * Initialize and create all metric instruments
 */
export function createMetrics(): ApiMetrics {
  if (apiMetrics) {
    return apiMetrics;
  }

  const meter = getMeter();

  apiMetrics = {
    requestDuration: meter.createHistogram('http_request_duration_ms', {
      description: 'Duration of HTTP requests in milliseconds',
      unit: 'ms',
    }),
    requestCount: meter.createCounter('http_requests_total', {
      description: 'Total number of HTTP requests',
    }),
    dbQueryDuration: meter.createHistogram('db_query_duration_ms', {
      description: 'Duration of database queries in milliseconds',
      unit: 'ms',
    }),
    dbQueryCount: meter.createCounter('db_queries_total', {
      description: 'Total number of database queries',
    }),
    errorCount: meter.createCounter('errors_total', {
      description: 'Total number of errors by type',
    }),
    activeRequests: meter.createUpDownCounter('http_requests_active', {
      description: 'Number of active HTTP requests',
    }),
  };

  return apiMetrics;
}

/**
 * Get the initialized metrics instruments
 */
export function getMetrics(): ApiMetrics {
  if (!apiMetrics) {
    return createMetrics();
  }
  return apiMetrics;
}

/**
 * Record HTTP request metrics
 */
export function recordHttpMetrics(tags: MetricTags, duration?: number): void {
  const metrics = getMetrics();

  // Record request count
  metrics.requestCount.add(1, tags);

  // Record request duration if provided
  if (duration !== undefined) {
    metrics.requestDuration.record(duration, tags);
  }
}

/**
 * Record database operation metrics
 */
export function recordDbMetrics(tags: MetricTags, duration?: number): void {
  const metrics = getMetrics();

  // Record query count
  metrics.dbQueryCount.add(1, tags);

  // Record query duration if provided
  if (duration !== undefined) {
    metrics.dbQueryDuration.record(duration, tags);
  }
}

/**
 * Record error metrics
 */
export function recordErrorMetrics(errorType: string, tags?: MetricTags): void {
  const metrics = getMetrics();
  const errorTags = { ...tags, error_type: errorType };
  metrics.errorCount.add(1, errorTags);
}

/**
 * Increment active requests counter
 */
export function incrementActiveRequests(tags?: MetricTags): void {
  const metrics = getMetrics();
  metrics.activeRequests.add(1, tags);
}

/**
 * Decrement active requests counter
 */
export function decrementActiveRequests(tags?: MetricTags): void {
  const metrics = getMetrics();
  metrics.activeRequests.add(-1, tags);
}

/**
 * Create HTTP metric tags from request information
 */
export function createHttpMetricTags(method: string, route: string, statusCode?: number): MetricTags {
  const tags: MetricTags = {
    method: method.toUpperCase(),
    route,
  };

  if (statusCode) {
    tags.status_code = statusCode.toString();
  }

  return tags;
}

/**
 * Create database metric tags from operation information
 */
export function createDbMetricTags(operation: string, table: string): MetricTags {
  return {
    operation: operation.toLowerCase(),
    resource: table,
  };
}

/**
 * Create service operation metric tags
 */
export function createServiceMetricTags(operation: string, resource: string): MetricTags {
  return {
    operation,
    resource,
  };
}

/**
 * Measure execution time and record metrics
 */
export async function measureExecutionTime<T>(
  fn: () => Promise<T>,
  metricRecorder: (duration: number) => void,
): Promise<T> {
  const start = performance.now();

  try {
    const result = await fn();
    return result;
  } finally {
    const duration = performance.now() - start;
    metricRecorder(duration);
  }
}

/**
 * Measure synchronous execution time and record metrics
 */
export function measureExecutionTimeSync<T>(fn: () => T, metricRecorder: (duration: number) => void): T {
  const start = performance.now();

  try {
    return fn();
  } finally {
    const duration = performance.now() - start;
    metricRecorder(duration);
  }
}

/**
 * Create a timing function for consistent metric recording
 */
export function createTimer(): {
  start: () => void;
  end: () => number;
} {
  let startTime: number | null = null;

  return {
    start: () => {
      startTime = performance.now();
    },
    end: () => {
      if (startTime === null) {
        throw new Error('Timer was not started');
      }
      const duration = performance.now() - startTime;
      startTime = null;
      return duration;
    },
  };
}
