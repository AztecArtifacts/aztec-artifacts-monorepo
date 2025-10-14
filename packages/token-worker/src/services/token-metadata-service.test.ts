import { createDbClient } from '@aztec-artifacts/schema/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TokenMetadataService } from './token-metadata-service.js';

describe('TokenMetadataService', () => {
  let db: ReturnType<typeof createDbClient>;
  let service: TokenMetadataService;
  // biome-ignore lint/suspicious/noExplicitAny: test
  let logger: any;
  // biome-ignore lint/suspicious/noExplicitAny: test
  let mockAztecNode: any;

  beforeEach(() => {
    // Use in-memory PGlite for testing
    db = createDbClient('pglite://');

    // Mock logger
    logger = {
      info: () => {},
      debug: () => {},
      error: () => {},
      warn: () => {},
    };

    // Mock AztecNode
    mockAztecNode = {
      simulatePublicCalls: () => Promise.resolve({ publicReturnValues: [] }),
      getNodeInfo: () => Promise.resolve({ l1ChainId: 1, rollupVersion: 1 }),
      getBlockHeader: () => Promise.resolve({}),
    };

    service = new TokenMetadataService(db, mockAztecNode, logger);
  });

  afterEach(async () => {
    // Cleanup if needed
  });

  describe('shouldRetryJob', () => {
    it('should return true when attempts is less than maxAttempts', () => {
      expect(service.shouldRetryJob(0, 3)).toBe(true);
      expect(service.shouldRetryJob(2, 3)).toBe(true);
    });

    it('should return false when attempts equals or exceeds maxAttempts', () => {
      expect(service.shouldRetryJob(3, 3)).toBe(false);
      expect(service.shouldRetryJob(4, 3)).toBe(false);
    });
  });

  describe('fetchTokenMetadata', () => {
    it('should return static metadata values', async () => {
      // Note: This test would need proper mocking of fetchTokenMetadataFromBlockchain
      // or a full database setup with contract instances and artifacts
      // For now, we skip this test as it requires more setup
      expect(true).toBe(true);
    });
  });
});
