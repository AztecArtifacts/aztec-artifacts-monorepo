import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getConfig } from './config.js';

const ORIGINAL_ENV = process.env;

describe('config', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it('reads WORKER_JOB_LEASE_MS from environment variable', () => {
    process.env.DATABASE_URL = 'https://example.com';
    process.env.AZTEC_NODE_URL = 'https://node.example.com';
    process.env.WORKER_JOB_LEASE_MS = '12345';

    const config = getConfig();
    expect(config.WORKER_JOB_LEASE_MS).toBe(12345);
  });
});
