import type { FastifyRequest } from 'fastify';
import type { Logger } from 'pino';
import { getTraceContext } from '../utils/tracing.js';

/**
 * Generates a unique request ID
 */
function generateRequestId(req: FastifyRequest): string {
  // Use x-request-id header if present, otherwise generate UUID-like ID
  const existingId = req.headers['x-request-id'] as string;
  if (existingId) {
    return existingId;
  }

  return crypto.randomUUID();
}

/**
 * Creates comprehensive Pino logger configuration for Fastify
 */
export function createLoggerConfig(level: string, pretty: boolean) {
  const config: {
    level: string;
    serializers?: Record<string, (input: unknown) => unknown>;
    redact?: string[];
    formatters?: {
      level?: (label: string, number: number) => Record<string, unknown>;
      bindings?: (bindings: Record<string, unknown>) => Record<string, unknown>;
    };
    transport?: {
      target: string;
      options: Record<string, unknown>;
    };
    genReqId?: (req: FastifyRequest) => string;
  } = {
    level,
    serializers: {
      req: (input: unknown) => {
        const req = input as FastifyRequest;
        return {
          method: req.method,
          url: req.url,
          hostname: req.hostname,
          remoteAddress: req.socket?.remoteAddress || 'unknown',
          remotePort: req.socket?.remotePort || 0,
          headers: {
            'user-agent': req.headers['user-agent'],
            'x-forwarded-for': req.headers['x-forwarded-for'],
            'x-real-ip': req.headers['x-real-ip'],
            'x-forwarded-proto': req.headers['x-forwarded-proto'],
            host: req.headers.host,
            referer: req.headers.referer,
          },
        };
      },
      err: (input: unknown) => {
        const err = input as Error;
        return {
          type: err.constructor.name,
          message: err.message,
          stack: err.stack,
          statusCode: 'statusCode' in err ? (err.statusCode as number) : undefined,
        };
      },
    },
    // Redact sensitive information from logs
    redact: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["set-cookie"]',
      'req.headers["x-api-key"]',
      'req.headers["x-auth-token"]',
    ],
    formatters: {
      level: (label: string) => ({ level: label }),
      bindings: (bindings: Record<string, unknown>) => {
        const baseBindings = {
          pid: bindings.pid,
          hostname: bindings.hostname,
          service: 'api-service',
        };

        // Add trace context if available
        const traceContext = getTraceContext();
        if (traceContext) {
          return {
            ...baseBindings,
            traceId: traceContext.traceId,
            spanId: traceContext.spanId,
          };
        }

        return baseBindings;
      },
    },
    genReqId: generateRequestId,
  };

  // Add pretty printing transport for development
  if (pretty) {
    try {
      // Try to require pino-pretty to check if it's available
      require.resolve('pino-pretty');
      config.transport = {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
          messageFormat: '{req.method} {req.url} - {msg}',
          errorLikeObjectKeys: ['err', 'error'],
        },
      };
    } catch (_error) {
      // If pino-pretty is not available, fall back to basic formatting
      console.warn('pino-pretty not found, falling back to JSON logging');
    }
  }

  return config;
}

/**
 * Type guard to check if an object is a Logger
 */
export function isLogger(obj: unknown): obj is Logger {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'info' in obj &&
    'warn' in obj &&
    'error' in obj &&
    'debug' in obj &&
    typeof (obj as Logger).info === 'function'
  );
}
