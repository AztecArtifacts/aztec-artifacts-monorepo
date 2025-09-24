import { AztecAddress } from '@aztec/aztec.js';
import { aztecAddressToHexString, hexStringToAztecAddress } from '@aztec-artifacts/common';
import type { tokens } from '@aztec-artifacts/schema';
import { describe, expect, it, vi } from 'vitest';
import { convertDbTokenToApi } from '../services/token-service.js';
import { normalizeAddress } from '../utils/response.js';

vi.mock('@aztec-artifacts/common', async () => {
  const actual = await vi.importActual<typeof import('@aztec-artifacts/common')>('@aztec-artifacts/common');
  return {
    ...actual,
    aztecAddressToHexString: vi.fn(actual.aztecAddressToHexString),
    hexStringToAztecAddress: vi.fn(actual.hexStringToAztecAddress),
  };
});

describe('API utility helpers', () => {
  const mockAztecAddress = AztecAddress.fromBigInt(
    BigInt('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'),
  );

  describe('normalizeAddress', () => {
    it('lowercases valid 0x-prefixed hex', () => {
      const upper = '0x1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF';
      expect(normalizeAddress(upper)).toBe(upper.toLowerCase());
    });

    it('throws on missing 0x prefix', () => {
      expect(() => normalizeAddress('123')).toThrow('Invalid address format: must start with 0x');
    });
  });

  describe('convertDbTokenToApi', () => {
    it('converts database token to API token without id by default', () => {
      const tokenRow: typeof tokens.$inferSelect = {
        id: 42,
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        address: mockAztecAddress,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const apiToken = convertDbTokenToApi(tokenRow);
      expect(apiToken).toEqual({
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        address: aztecAddressToHexString(tokenRow.address),
      });
    });

    it('includes id when requested', () => {
      const tokenRow: typeof tokens.$inferSelect = {
        id: 7,
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        address: mockAztecAddress,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const apiToken = convertDbTokenToApi(tokenRow, true);
      expect(apiToken).toEqual({
        id: 7,
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        address: aztecAddressToHexString(tokenRow.address),
      });
    });
  });

  describe('hex conversion helpers', () => {
    it('round-trips addresses via hex helpers', () => {
      const hex = aztecAddressToHexString(mockAztecAddress);
      expect(hexStringToAztecAddress(hex).equals(mockAztecAddress)).toBe(true);
    });
  });
});
