import type { Logger } from 'pino';

// Simple interface for any logger that has the basic methods we need
export interface BasicLogger {
  debug(obj: unknown, msg?: string, ...args: unknown[]): void;
  debug(msg: string, ...args: unknown[]): void;
  info(obj: unknown, msg?: string, ...args: unknown[]): void;
  info(msg: string, ...args: unknown[]): void;
  warn(obj: unknown, msg?: string, ...args: unknown[]): void;
  warn(msg: string, ...args: unknown[]): void;
  error(obj: unknown, msg?: string, ...args: unknown[]): void;
  error(msg: string, ...args: unknown[]): void;
}

/**
 * Log levels for structured logging
 */
export const LogLevel = {
  TRACE: 'trace',
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal',
} as const;

/**
 * Database operation types for logging
 */
export const DatabaseOperation = {
  SELECT: 'select',
  INSERT: 'insert',
  UPDATE: 'update',
  DELETE: 'delete',
  COUNT: 'count',
} as const;

/**
 * Service operation types for logging
 */
export const ServiceOperation = {
  GET: 'get',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  VALIDATE: 'validate',
  TRANSFORM: 'transform',
} as const;

/**
 * Database table names for consistent logging
 */
export const DatabaseTable = {
  TOKENS: 'tokens',
  CONTRACT_INSTANCES: 'contract_instances',
  CONTRACT_ARTIFACTS: 'contract_artifacts',
} as const;

/**
 * Logs database query operations with structured context
 */
export function logDatabaseQuery(
  logger: BasicLogger,
  operation: string,
  table: string,
  conditions?: Record<string, unknown>,
  resultCount?: number,
): void {
  logger.debug(
    {
      component: 'database',
      operation,
      table,
      conditions,
      resultCount,
    },
    `Database ${operation} on ${table}`,
  );
}

/**
 * Logs service operations with structured context
 */
export function logServiceOperation(
  logger: BasicLogger,
  service: string,
  operation: string,
  params?: Record<string, unknown>,
  result?: { success: boolean; count?: number; error?: string },
): void {
  const logData = {
    component: 'service',
    service,
    operation,
    params,
    ...result,
  };

  if (result?.success === false) {
    logger.warn(logData, `Service ${service}.${operation} failed`);
  } else {
    logger.info(logData, `Service ${service}.${operation} completed`);
  }
}

/**
 * Logs API request processing with structured context
 */
export function logApiRequest(
  logger: BasicLogger,
  method: string,
  path: string,
  params?: Record<string, unknown>,
  query?: Record<string, unknown>,
): void {
  logger.debug(
    {
      component: 'api',
      method,
      path,
      params,
      query,
    },
    `Processing ${method} ${path}`,
  );
}

/**
 * Logs API response with structured context
 */
export function logApiResponse(
  logger: BasicLogger,
  method: string,
  path: string,
  statusCode: number,
  responseTime?: number,
  error?: string,
): void {
  const logData = {
    component: 'api',
    method,
    path,
    statusCode,
    responseTime,
    error,
  };

  if (statusCode >= 400) {
    logger.warn(logData, `${method} ${path} responded with ${statusCode}`);
  } else {
    logger.info(logData, `${method} ${path} responded with ${statusCode}`);
  }
}

/**
 * Logs validation errors with structured context
 */
export function logValidationError(
  logger: BasicLogger,
  component: string,
  field: string,
  value: unknown,
  reason: string,
): void {
  logger.warn(
    {
      component: 'validation',
      validatedBy: component,
      field,
      value: typeof value === 'string' ? value : JSON.stringify(value),
      reason,
    },
    `Validation failed for ${field}: ${reason}`,
  );
}

/**
 * Logs performance metrics with structured context
 */
export function logPerformanceMetric(
  logger: Logger,
  operation: string,
  durationMs: number,
  metadata?: Record<string, unknown>,
): void {
  logger.info(
    {
      component: 'performance',
      operation,
      durationMs,
      ...metadata,
    },
    `Operation ${operation} took ${durationMs}ms`,
  );
}

/**
 * Logs cache operations with structured context
 */
export function logCacheOperation(
  logger: Logger,
  operation: 'hit' | 'miss' | 'set' | 'delete',
  key: string,
  ttl?: number,
): void {
  logger.debug(
    {
      component: 'cache',
      operation,
      key,
      ttl,
    },
    `Cache ${operation} for key ${key}`,
  );
}

/**
 * Creates a child logger with additional context
 */
export function createChildLogger(logger: Logger, context: Record<string, unknown>): Logger {
  return logger.child(context);
}

/**
 * Safely logs an object, handling circular references and large objects
 */
export function safeLogObject(logger: Logger, level: keyof Logger, message: string, obj: unknown): void {
  try {
    if (typeof obj === 'object' && obj !== null) {
      // Limit the depth and handle circular references
      const safeObj = JSON.parse(JSON.stringify(obj, null, 2));
      (logger[level] as (data: unknown, message: string) => void)(safeObj, message);
    } else {
      (logger[level] as (message: string) => void)(message);
    }
  } catch (error) {
    logger.warn(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      `Failed to log object safely: ${message}`,
    );
  }
}

/**
 * Logs HTTP client operations (for external API calls)
 */
export function logHttpClient(
  logger: Logger,
  method: string,
  url: string,
  statusCode?: number,
  responseTime?: number,
  error?: Error,
): void {
  const logData = {
    component: 'http-client',
    method,
    url,
    statusCode,
    responseTime,
    error: error ? { message: error.message, stack: error.stack } : undefined,
  };

  if (error || (statusCode && statusCode >= 400)) {
    logger.error(logData, `HTTP ${method} ${url} failed`);
  } else {
    logger.debug(logData, `HTTP ${method} ${url} completed`);
  }
}

/**
 * Logs authentication and authorization events
 */
export function logSecurityEvent(
  logger: Logger,
  event: 'auth_attempt' | 'auth_success' | 'auth_failure' | 'auth_denied',
  userId?: string,
  ipAddress?: string,
  userAgent?: string,
  details?: Record<string, unknown>,
): void {
  logger.warn(
    {
      component: 'security',
      event,
      userId,
      ipAddress,
      userAgent,
      ...details,
    },
    `Security event: ${event}`,
  );
}
