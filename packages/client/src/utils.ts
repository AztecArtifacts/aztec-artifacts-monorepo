import type { ContractArtifact, FunctionAbi } from '@aztec/aztec.js';
import { getAllFunctionAbis } from '@aztec/aztec.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export interface Logger {
  level?: LogLevel;
  debug?(...args: unknown[]): void;
  info?(...args: unknown[]): void;
  warn?(...args: unknown[]): void;
  error?(...args: unknown[]): void;
}

type LogMethod = Exclude<LogLevel, 'silent'>;

const LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error', 'silent'];
const LOG_LEVEL_ENV_VAR = 'LOG_LEVEL';

const LOG_LEVEL_ALIASES: Record<string, LogLevel> = {
  debug: 'debug',
  trace: 'debug',
  verbose: 'debug',
  info: 'info',
  warn: 'warn',
  warning: 'warn',
  error: 'error',
  fatal: 'error',
  silent: 'silent',
  none: 'silent',
  off: 'silent',
};

function shouldLog(targetLevel: LogLevel, method: LogMethod): boolean {
  return LEVELS.indexOf(method) >= LEVELS.indexOf(targetLevel);
}

function invokeConsole(method: LogMethod, namespace: string, level: LogLevel, ...args: unknown[]) {
  if (!shouldLog(level, method)) {
    return;
  }

  const prefix = `[${namespace}]`;
  switch (method) {
    case 'debug':
      console.debug(prefix, ...args);
      break;
    case 'info':
      console.info(prefix, ...args);
      break;
    case 'warn':
      console.warn(prefix, ...args);
      break;
    case 'error':
      console.error(prefix, ...args);
      break;
    default:
      console.log(prefix, ...args);
  }
}

function resolveLogLevel(level?: LogLevel): LogLevel {
  if (level) {
    return level;
  }

  const envLevel = getEnvLogLevel();
  return envLevel ?? 'info';
}

export function createConsoleLogger(level?: LogLevel, namespace = 'AztecArtifactsClient'): Logger {
  const resolvedLevel = resolveLogLevel(level);
  return {
    level: resolvedLevel,
    debug: (...args: unknown[]) => invokeConsole('debug', namespace, resolvedLevel, ...args),
    info: (...args: unknown[]) => invokeConsole('info', namespace, resolvedLevel, ...args),
    warn: (...args: unknown[]) => invokeConsole('warn', namespace, resolvedLevel, ...args),
    error: (...args: unknown[]) => invokeConsole('error', namespace, resolvedLevel, ...args),
  } satisfies Logger;
}

export function parseLogLevel(value: string | undefined | null): LogLevel | undefined {
  if (!value) {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  return LOG_LEVEL_ALIASES[normalized];
}

export function getEnvLogLevel(envVar = LOG_LEVEL_ENV_VAR): LogLevel | undefined {
  if (typeof process === 'undefined' || typeof process.env === 'undefined') {
    return undefined;
  }

  return parseLogLevel(process.env[envVar]);
}

export function emitLog(
  logger: Logger | undefined,
  level: LogMethod,
  message: string,
  meta?: Record<string, unknown>,
): void {
  const logFn = logger?.[level];
  if (typeof logFn !== 'function') {
    return;
  }

  const payload = meta ? { msg: message, ...meta } : { msg: message };
  try {
    logFn(payload, message);
  } catch {
    // Best-effort logging; never let logger failures surface to the caller.
  }
}

export function getFunctionAbi(artifact: ContractArtifact, functionName: string): FunctionAbi {
  const functionAbi = getAllFunctionAbis(artifact).find(({ name }) => name === functionName);
  if (!functionAbi) {
    throw new Error(`Function ${functionName} not found in artifact ABI`);
  }
  return functionAbi;
}
