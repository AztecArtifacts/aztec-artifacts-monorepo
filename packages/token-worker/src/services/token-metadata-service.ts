import { AztecAddress, type AztecNode } from '@aztec/aztec.js';
import type { DbClient } from '@aztec-artifacts/schema/client';
import { tokenMetadataQueue, tokens } from '@aztec-artifacts/schema/schema';
import { eq } from 'drizzle-orm';
import type { Logger } from '../utils/logger.js';
import { fetchTokenMetadataFromBlockchain, type TokenMetadata } from '../utils/token.js';

export class TokenMetadataService {
  constructor(
    private readonly db: DbClient,
    readonly aztecNode: AztecNode,
    private readonly logger: Logger,
  ) {}

  /**
   * Process a token metadata job by fetching metadata and updating the database
   */
  async processTokenMetadata(jobId: number, address: string): Promise<void> {
    this.logger.info({ jobId, address }, 'Processing token metadata');

    try {
      // Fetch token metadata (static values for now)
      const metadata = await this.fetchTokenMetadata(address);

      // Update the tokens table with metadata
      await this.updateTokenRecord(address, metadata);

      // Mark the job as completed
      await this.markJobCompleted(jobId);

      this.logger.info({ jobId, address, metadata }, 'Successfully processed token metadata');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error({ jobId, address, error: errorMessage }, 'Failed to process token metadata');

      // Mark the job as failed
      await this.markJobFailed(jobId, errorMessage);

      throw error;
    }
  }

  /**
   * Fetch token metadata from the blockchain
   */
  private async fetchTokenMetadata(address: string): Promise<TokenMetadata> {
    return fetchTokenMetadataFromBlockchain(address, this.aztecNode, this.db, this.logger);
  }

  /**
   * Update the tokens table with fetched metadata
   */
  private async updateTokenRecord(address: string, metadata: TokenMetadata): Promise<void> {
    const aztecAddress = AztecAddress.fromString(address);

    await this.db
      .update(tokens)
      .set({
        name: metadata.name,
        symbol: metadata.symbol,
        decimals: metadata.decimals,
        updatedAt: new Date(),
      })
      .where(eq(tokens.address, aztecAddress));

    this.logger.debug({ address, metadata }, 'Updated token record');
  }

  /**
   * Mark a job as completed
   */
  private async markJobCompleted(jobId: number): Promise<void> {
    await this.db
      .update(tokenMetadataQueue)
      .set({
        status: 'completed',
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tokenMetadataQueue.id, jobId));

    this.logger.debug({ jobId }, 'Marked job as completed');
  }

  /**
   * Mark a job as failed and record the error
   */
  private async markJobFailed(jobId: number, error: string): Promise<void> {
    await this.db
      .update(tokenMetadataQueue)
      .set({
        status: 'failed',
        lastError: error,
        updatedAt: new Date(),
      })
      .where(eq(tokenMetadataQueue.id, jobId));

    this.logger.debug({ jobId, error }, 'Marked job as failed');
  }

  /**
   * Determine if a job should be retried based on attempts
   */
  shouldRetryJob(attempts: number, maxAttempts: number): boolean {
    return attempts < maxAttempts;
  }
}
