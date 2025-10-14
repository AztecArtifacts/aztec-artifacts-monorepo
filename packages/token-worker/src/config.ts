import { z } from 'zod';

const configSchema = z.object({
  DATABASE_URL: z.url(),
  AZTEC_NODE_URL: z.url(),
  WORKER_POLL_INTERVAL_MS: z.coerce.number().positive().default(5000),
  WORKER_BATCH_SIZE: z.coerce.number().positive().default(10),
  WORKER_JOB_LEASE_MS: z.coerce.number().positive().default(60_000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_PRETTY: z.coerce.boolean().default(false),
});

export type WorkerConfig = z.infer<typeof configSchema>;

export function getConfig(): WorkerConfig {
  const result = configSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Configuration validation failed:');
    console.error(z.treeifyError(result.error));
    throw new Error('Invalid configuration');
  }

  return result.data;
}
