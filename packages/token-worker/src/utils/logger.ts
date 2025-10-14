import pino from 'pino';
import type { WorkerConfig } from '../config.js';

export function createLogger(config: WorkerConfig) {
  return pino({
    level: config.LOG_LEVEL,
    ...(config.LOG_PRETTY && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      },
    }),
  });
}

export type Logger = ReturnType<typeof createLogger>;
