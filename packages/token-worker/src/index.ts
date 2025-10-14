import { createAztecNodeClient } from '@aztec/aztec.js';
import { createDbClient } from '@aztec-artifacts/schema/client';
import { getConfig } from './config.js';
import { createLogger } from './utils/logger.js';
import { Worker } from './worker.js';

async function main() {
  // Load configuration
  const config = getConfig();

  // Create logger
  const logger = createLogger(config);

  logger.info({ config: { ...config, DATABASE_URL: '***' } }, 'Starting token metadata worker');

  // Create database client
  const db = createDbClient(config.DATABASE_URL);

  const aztecNode = createAztecNodeClient(config.AZTEC_NODE_URL);

  // Create and start worker
  const worker = new Worker(config, db, aztecNode, logger);
  await worker.start();
}

// Start the worker
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
