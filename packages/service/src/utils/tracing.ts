/**
 * OpenTelemetry tracing utilities and helper functions
 */

import type { Span, Tracer } from '@opentelemetry/api';
import { context, SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import type { SpanAttributes, SpanOptions } from '../types/telemetry.js';

/**
 * Get the default tracer for the API service
 */
export function getTracer(): Tracer {
  return trace.getTracer('api-service');
}

/**
 * Get the currently active span
 */
export function getActiveSpan(): Span | undefined {
  return trace.getActiveSpan();
}

/**
 * Create a new span with the given options
 */
export function createSpan(options: SpanOptions): Span {
  const tracer = getTracer();

  const spanKindMap = {
    client: SpanKind.CLIENT,
    server: SpanKind.SERVER,
    producer: SpanKind.PRODUCER,
    consumer: SpanKind.CONSUMER,
    internal: SpanKind.INTERNAL,
  };

  return tracer.startSpan(
    options.name,
    {
      kind: options.kind ? spanKindMap[options.kind] : SpanKind.INTERNAL,
      attributes: options.attributes,
    },
    options.parent ? trace.setSpan(context.active(), options.parent) : undefined,
  );
}

/**
 * Add attributes to the currently active span
 */
export function addSpanAttributes(attributes: SpanAttributes): void {
  const span = getActiveSpan();
  if (span) {
    span.setAttributes(attributes);
  }
}

/**
 * Record an error in the currently active span
 */
export function recordSpanError(error: Error | unknown, span?: Span): void {
  const targetSpan = span || getActiveSpan();
  if (!targetSpan) {
    return;
  }

  let errorMessage = 'Unknown error';
  let errorName = 'Error';

  if (error instanceof Error) {
    errorMessage = error.message;
    errorName = error.name;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object') {
    errorMessage = JSON.stringify(error);
  }

  targetSpan.recordException(error instanceof Error ? error : new Error(errorMessage));
  targetSpan.setStatus({
    code: SpanStatusCode.ERROR,
    message: errorMessage,
  });

  targetSpan.setAttributes({
    'error.type': errorName,
    'error.message': errorMessage,
  });
}

/**
 * Set span status to OK
 */
export function setSpanSuccess(span?: Span): void {
  const targetSpan = span || getActiveSpan();
  if (targetSpan) {
    targetSpan.setStatus({ code: SpanStatusCode.OK });
  }
}

/**
 * Execute a function within a span context
 */
export async function withSpan<T>(options: SpanOptions, fn: (span: Span) => T | Promise<T>): Promise<T> {
  const span = createSpan(options);

  try {
    const result = await context.with(trace.setSpan(context.active(), span), () => fn(span));
    setSpanSuccess(span);
    return result;
  } catch (error) {
    recordSpanError(error, span);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Get trace context from the currently active span
 */
export function getTraceContext(): { traceId: string; spanId: string } | null {
  const span = getActiveSpan();
  if (!span) {
    return null;
  }

  const spanContext = span.spanContext();
  if (!spanContext.traceId || !spanContext.spanId) {
    return null;
  }

  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
  };
}

/**
 * Create database operation span attributes
 */
export function createDbSpanAttributes(operation: string, table: string, statement?: string): SpanAttributes {
  return {
    'db.system': 'postgresql',
    'db.operation': operation,
    'db.table': table,
    'db.statement': statement,
  };
}

/**
 * Create HTTP operation span attributes
 */
export function createHttpSpanAttributes(method: string, route: string, statusCode?: number): SpanAttributes {
  const attributes: SpanAttributes = {
    'http.method': method,
    'http.route': route,
  };

  if (statusCode) {
    attributes['http.status_code'] = statusCode.toString();
  }

  return attributes;
}

/**
 * Create service operation span attributes
 */
export function createServiceSpanAttributes(operation: string, resource: string): SpanAttributes {
  return {
    'api.operation': operation,
    'api.resource': resource,
  };
}
