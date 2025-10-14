import type { AztecNode } from '@aztec/aztec.js';
import type { DbClient } from '@aztec-artifacts/schema/client';
import { type DbTokenMetadataJob, tokenMetadataQueue } from '@aztec-artifacts/schema/schema';
import { eq, inArray, sql } from 'drizzle-orm';
import type { WorkerConfig } from './config.js';
import { TokenMetadataService } from './services/token-metadata-service.js';
import type { Logger } from './utils/logger.js';

type ClaimedJob = DbTokenMetadataJob & {
  originalAttempts: number;
  previousStatus: DbTokenMetadataJob['status'];
};

export class Worker {
  private isRunning = false;
  private service: TokenMetadataService;
  private pollTimeout?: NodeJS.Timeout;
  private currentBatchPromise?: Promise<void>;
  private shutdownHandlersInstalled = false;

  private readonly handleSigint = () => void this.handleShutdown('SIGINT');
  private readonly handleSigterm = () => void this.handleShutdown('SIGTERM');

  constructor(
    private readonly config: WorkerConfig,
    private readonly db: DbClient,
    readonly aztecNode: AztecNode,
    private readonly logger: Logger,
  ) {
    this.service = new TokenMetadataService(db, aztecNode, logger);
  }

  /**
   * Start the worker polling loop
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Worker is already running');
      return;
    }

    this.isRunning = true;
    this.logger.info('Starting token metadata worker');

    // Set up graceful shutdown handlers
    this.setupShutdownHandlers();

    // Start polling
    await this.poll();
  }

  /**
   * Stop the worker gracefully
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.logger.info('Stopping token metadata worker');
    this.isRunning = false;
    this.teardownShutdownHandlers();

    // Clear any pending poll timeout
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = undefined;
    }

    if (this.currentBatchPromise) {
      try {
        await this.currentBatchPromise;
      } catch (error) {
        this.logger.error({ error }, 'Error while awaiting in-flight batch during stop');
      } finally {
        this.currentBatchPromise = undefined;
      }
    }

    this.logger.info('Worker stopped');
  }

  /**
   * Main polling loop
   */
  private async poll(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      this.currentBatchPromise = this.processNextBatch();
      await this.currentBatchPromise;
    } catch (error) {
      this.logger.error({ error }, 'Error in polling loop');
    } finally {
      this.currentBatchPromise = undefined;
    }

    // Schedule next poll
    if (this.isRunning) {
      this.pollTimeout = setTimeout(() => {
        void this.poll();
      }, this.config.WORKER_POLL_INTERVAL_MS);
    }
  }

  /**
   * Process the next batch of jobs
   */
  private async processNextBatch(): Promise<void> {
    const jobs = await this.claimNextBatch(this.config.WORKER_BATCH_SIZE);

    if (jobs.length === 0) {
      this.logger.debug('No pending jobs found');
      return;
    }

    this.logger.info({ count: jobs.length }, 'Processing batch of jobs');

    // Process jobs in parallel
    await Promise.allSettled(
      jobs.map(async (job) => {
        try {
          const effectiveAttempts =
            job.previousStatus === 'processing' ? Math.max(0, job.originalAttempts - 1) : job.originalAttempts;

          // Check if we should retry this job
          if (!this.service.shouldRetryJob(effectiveAttempts, job.maxAttempts)) {
            this.logger.warn({ jobId: job.id, attempts: effectiveAttempts }, 'Job exceeded max attempts');
            await this.markJobUnsupported(job.id);
            return;
          }

          // Process the job (convert AztecAddress to string)
          await this.service.processTokenMetadata(job.id, job.address.toString());
        } catch (error) {
          this.logger.error({ jobId: job.id, error }, 'Failed to process job');
          // Error is already handled by the service
        }
      }),
    );

    this.logger.info({ count: jobs.length }, 'Batch processing complete');
  }

  /**
   * Claim a batch of jobs for processing using a lease-based lock
   */
  private async claimNextBatch(batchSize: number): Promise<ClaimedJob[]> {
    if (batchSize <= 0) {
      return [];
    }

    return await this.db.transaction(async (tx) => {
      const leaseCutoff = new Date(Date.now() - this.config.WORKER_JOB_LEASE_MS);

      const selection = await tx.execute(
        sql<DbTokenMetadataJob>`
          select *
          from ${tokenMetadataQueue}
          where (
            ${tokenMetadataQueue.status} = ${'pending'} and ${tokenMetadataQueue.attempts} < ${tokenMetadataQueue.maxAttempts}
          )
          or (
            ${tokenMetadataQueue.status} = ${'failed'} and ${tokenMetadataQueue.attempts} < ${tokenMetadataQueue.maxAttempts}
          )
          or (
            ${tokenMetadataQueue.status} = ${'processing'}
            and ${tokenMetadataQueue.updatedAt} < ${leaseCutoff}
            and ${tokenMetadataQueue.attempts} <= ${tokenMetadataQueue.maxAttempts}
          )
          order by ${tokenMetadataQueue.createdAt}
          limit ${batchSize}
          for update skip locked
        `,
      );

      const jobs = selection.rows as DbTokenMetadataJob[];

      if (jobs.length === 0) {
        return [];
      }

      const now = new Date();
      const processingJobs = jobs.filter((job) => job.status === 'processing');
      const newAttemptJobs = jobs.filter((job) => job.status !== 'processing');

      if (newAttemptJobs.length > 0) {
        await tx
          .update(tokenMetadataQueue)
          .set({
            status: 'processing',
            attempts: sql`${tokenMetadataQueue.attempts} + 1`,
            updatedAt: now,
          })
          .where(
            inArray(
              tokenMetadataQueue.id,
              newAttemptJobs.map((job) => job.id),
            ),
          );
      }

      if (processingJobs.length > 0) {
        await tx
          .update(tokenMetadataQueue)
          .set({
            updatedAt: now,
          })
          .where(
            inArray(
              tokenMetadataQueue.id,
              processingJobs.map((job) => job.id),
            ),
          );
      }

      return jobs.map((job) => ({
        ...job,
        status: 'processing',
        attempts: job.status === 'processing' ? job.attempts : job.attempts + 1,
        updatedAt: now,
        originalAttempts: job.attempts,
        previousStatus: job.status,
      }));
    });
  }

  /**
   * Mark a job as unsupported (exceeded max attempts)
   */
  private async markJobUnsupported(jobId: number): Promise<void> {
    await this.db
      .update(tokenMetadataQueue)
      .set({
        status: 'unsupported',
        updatedAt: new Date(),
      })
      .where(eq(tokenMetadataQueue.id, jobId));
  }

  /**
   * Set up graceful shutdown handlers
   */
  private setupShutdownHandlers(): void {
    if (this.shutdownHandlersInstalled) {
      return;
    }

    process.on('SIGINT', this.handleSigint);
    process.on('SIGTERM', this.handleSigterm);
    this.shutdownHandlersInstalled = true;
  }

  private teardownShutdownHandlers(): void {
    if (!this.shutdownHandlersInstalled) {
      return;
    }

    process.off('SIGINT', this.handleSigint);
    process.off('SIGTERM', this.handleSigterm);
    this.shutdownHandlersInstalled = false;
  }

  private async handleShutdown(signal: NodeJS.Signals): Promise<void> {
    this.logger.info({ signal }, 'Received shutdown signal');
    this.teardownShutdownHandlers();
    try {
      await this.stop();
      this.logger.info('Shutdown complete');
    } catch (error) {
      this.logger.error({ error }, 'Error during shutdown');
    } finally {
      process.exitCode = 0;
    }
  }
}
