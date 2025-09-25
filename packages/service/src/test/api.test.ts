import { hexStringToAztecAddress } from '@aztec-artifacts/common';
import type { DbToken } from '@aztec-artifacts/schema';
import { describe, expect, it } from 'vitest';
import { convertDbTokenToApi } from '../services/token-service.js';
import { createPaginatedResponse } from '../utils/pagination.js';
import { normalizeAddress } from '../utils/response.js';

describe('response helpers', () => {
  it('normalizes valid address and throws on invalid format', () => {
    const upper = '0x1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF';
    expect(normalizeAddress(upper)).toBe(upper.toLowerCase());
    expect(() => normalizeAddress('1234')).toThrow('Invalid address format: must start with 0x');
  });

  it('creates paginated response with next cursor when more data available', () => {
    const tokens = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const response = createPaginatedResponse(tokens, 2, 0, (item) => item.id ?? 0);

    expect(response.pagination).toMatchObject({ limit: 2, hasMore: true, nextCursor: 2 });
    expect(response.data).toHaveLength(2);
  });
});

describe('convertDbTokenToApi', () => {
  const address = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

  const makeToken = (id: number): DbToken => ({
    id,
    symbol: 'TEST',
    name: 'Test Token',
    decimals: 18,
    address: hexStringToAztecAddress(address),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  it('omits id by default', () => {
    const apiToken = convertDbTokenToApi(makeToken(42));
    expect(apiToken).toEqual({
      symbol: 'TEST',
      name: 'Test Token',
      decimals: 18,
      address,
    });
  });

  it('includes id when requested', () => {
    const apiToken = convertDbTokenToApi(makeToken(42), true);
    expect(apiToken).toEqual({
      id: 42,
      symbol: 'TEST',
      name: 'Test Token',
      decimals: 18,
      address,
    });
  });
});
