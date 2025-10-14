import { createDbClient } from '@aztec-artifacts/schema/client';
import { tokenMetadataQueue } from '@aztec-artifacts/schema/schema';
import { eq } from 'drizzle-orm';
import { getConfig } from '../config.js';
import { createLogger } from '../utils/logger.js';

/**
 * Reset jobs that were incorrectly marked as 'unsupported' back to 'pending'
 * This script is useful after fixing bugs that caused jobs to fail prematurely
 */
async function resetJobs() {
  // Load configuration
  const config = getConfig();

  // Create logger
  const logger = createLogger(config);

  logger.info('Starting job reset script');

  // Create database client
  const db = createDbClient(config.DATABASE_URL);

  try {
    // Count jobs before reset
    const beforeCount = await db.select().from(tokenMetadataQueue).where(eq(tokenMetadataQueue.status, 'unsupported'));

    logger.info({ count: beforeCount.length }, 'Found unsupported jobs to reset');

    if (beforeCount.length === 0) {
      logger.info('No jobs to reset');
      return;
    }

    // Reset all unsupported jobs to pending with attempts reset to 0
    const result = await db
      .update(tokenMetadataQueue)
      .set({
        status: 'pending',
        attempts: 0,
        lastError: null,
        updatedAt: new Date(),
      })
      .where(eq(tokenMetadataQueue.status, 'unsupported'))
      .returning();

    logger.info({ count: result.length }, 'Successfully reset jobs to pending status');

    // Log some examples
    if (result.length > 0) {
      logger.info(
        { examples: result.slice(0, 5).map((job) => ({ id: job.id, address: job.address.toString() })) },
        'Example reset jobs',
      );
    }
  } catch (error) {
    logger.error({ error }, 'Failed to reset jobs');
    throw error;
  } finally {
    // Close database connection (only for Pool, not PGlite)
    if ('end' in db.$client && typeof db.$client.end === 'function') {
      await db.$client.end();
      logger.info('Database connection closed');
    }
  }
}

// Run the script
resetJobs()
  .then(() => {
    console.log('✓ Job reset complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Job reset failed:', error);
    process.exit(1);
  });
