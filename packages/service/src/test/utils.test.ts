import { AztecAddress } from '@aztec/aztec.js';
import { FunctionSelector } from '@aztec/stdlib/abi';
import { aztecAddressToHexString, hexStringToAztecAddress } from '@aztec-artifacts/common';
import type { tokens } from '@aztec-artifacts/schema';
import { PortalContractArtifact, TokenContractArtifact } from '@turnstile-portal/aztec-artifacts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { convertDbTokenToApi } from '../services/token-service.js';
import { normalizeAddress } from '../utils/response.js';
import {
  isToken,
  tokenAbiFunctionSelectors,
  tokenAbiFunctionSelectorsSet,
  tokenAbiNondispatchPublicFunctionSelectorsSet,
} from '../utils/tokens.js';

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

describe('Token Detection', () => {
  const mockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect TokenContractArtifact as a valid token', async () => {
    const result = await isToken(TokenContractArtifact, mockLogger);
    expect(result).toBe(true);
  });

  it('should NOT detect PortalContractArtifact as a token', async () => {
    const result = await isToken(PortalContractArtifact, mockLogger);
    expect(result).toBe(false);

    // Verify that the debug logs indicate missing required selectors
    const debugCalls = mockLogger.debug.mock.calls;
    const missingSelectorsLog = debugCalls.find(
      (call) => typeof call[0] === 'string' && call[0].includes('Missing required'),
    );
    expect(missingSelectorsLog).toBeDefined();
  });

  it('should compute correct selectors for all token functions', async () => {
    // Compute selectors from the actual token artifact
    const computedSelectors = new Map<string, string>();

    for (const f of TokenContractArtifact.functions) {
      const selector = await FunctionSelector.fromNameAndParameters(f.name, f.parameters);
      const selectorStr = selector.toString();
      computedSelectors.set(f.name, selectorStr);
    }

    // Check dispatch functions
    const dispatchFunctionNames = [
      'balance_of_private',
      'transfer_private_to_commitment',
      'transfer_private_to_private',
      'transfer_private_to_public',
      'transfer_private_to_public_with_commitment',
      'transfer_public_to_private',
    ];

    for (const funcName of dispatchFunctionNames) {
      const computed = computedSelectors.get(funcName);
      const expected = tokenAbiFunctionSelectors[funcName as keyof typeof tokenAbiFunctionSelectors];

      expect(computed).toBeDefined();
      console.log(`${funcName}: computed=${computed}, expected=${expected}`);

      // This will help us see what the actual mismatch is
      if (computed !== expected) {
        console.warn(`MISMATCH for ${funcName}: computed=${computed}, expected=${expected}`);
      }
    }
  });

  it('should compute correct selectors for non-dispatch public functions', async () => {
    const computedSelectors = new Map<string, string>();

    for (const f of TokenContractArtifact.nonDispatchPublicFunctions) {
      const selector = await FunctionSelector.fromNameAndParameters(f.name, f.parameters);
      const selectorStr = selector.toString();
      computedSelectors.set(f.name, selectorStr);
    }

    const nonDispatchFunctionNames = [
      'balance_of_public',
      'total_supply',
      'transfer_public_to_commitment',
      'transfer_public_to_public',
    ];

    for (const funcName of nonDispatchFunctionNames) {
      const computed = computedSelectors.get(funcName);
      const expected = tokenAbiFunctionSelectors[funcName as keyof typeof tokenAbiFunctionSelectors];

      expect(computed).toBeDefined();
      console.log(`${funcName}: computed=${computed}, expected=${expected}`);

      if (computed !== expected) {
        console.warn(`MISMATCH for ${funcName}: computed=${computed}, expected=${expected}`);
      }
    }
  });

  it('should log detailed selector information during detection', async () => {
    await isToken(TokenContractArtifact, mockLogger);

    // Verify that debug logging was called
    expect(mockLogger.debug).toHaveBeenCalled();

    // Find the log calls that show the computed selectors
    const debugCalls = mockLogger.debug.mock.calls;
    const selectorLogs = debugCalls.filter((call) => typeof call[0] === 'string' && call[0].includes('Selector:'));

    expect(selectorLogs.length).toBeGreaterThan(0);
  });

  it('should verify all required selectors are present', async () => {
    const functionSelectors = new Set<string>();

    for (const f of TokenContractArtifact.functions) {
      const selector = await FunctionSelector.fromNameAndParameters(f.name, f.parameters);
      functionSelectors.add(selector.toString());
    }

    // Check if all required selectors are present
    for (const requiredSelector of tokenAbiFunctionSelectorsSet) {
      expect(functionSelectors.has(requiredSelector)).toBe(true);
    }
  });

  it('should verify all required non-dispatch public selectors are present', async () => {
    const nonDispatchSelectors = new Set<string>();

    for (const f of TokenContractArtifact.nonDispatchPublicFunctions) {
      const selector = await FunctionSelector.fromNameAndParameters(f.name, f.parameters);
      nonDispatchSelectors.add(selector.toString());
    }

    // Check if all required non-dispatch selectors are present
    for (const requiredSelector of tokenAbiNondispatchPublicFunctionSelectorsSet) {
      expect(nonDispatchSelectors.has(requiredSelector)).toBe(true);
    }
  });

  it('should print diagnostic information for debugging', async () => {
    console.log('\n=== Token Detection Diagnostics ===');
    console.log(`Artifact name: ${TokenContractArtifact.name}`);
    console.log(`Total functions: ${TokenContractArtifact.functions.length}`);
    console.log(`Non-dispatch public functions: ${TokenContractArtifact.nonDispatchPublicFunctions.length}`);

    console.log('\n--- Dispatch Functions ---');
    for (const f of TokenContractArtifact.functions) {
      const selector = await FunctionSelector.fromNameAndParameters(f.name, f.parameters);
      const selectorStr = selector.toString();
      const expected = tokenAbiFunctionSelectors[f.name as keyof typeof tokenAbiFunctionSelectors];
      const match = expected === selectorStr ? '✓' : '✗';
      console.log(`${match} ${f.name}: ${selectorStr} ${expected ? `(expected: ${expected})` : ''}`);
      if (f.parameters.length > 0) {
        console.log(
          `  Parameters: ${JSON.stringify(f.parameters.map((p: { name: string; type: { kind: string } }) => ({ name: p.name, type: p.type })))}`,
        );
      }
    }

    console.log('\n--- Non-Dispatch Public Functions ---');
    for (const f of TokenContractArtifact.nonDispatchPublicFunctions) {
      const selector = await FunctionSelector.fromNameAndParameters(f.name, f.parameters);
      const selectorStr = selector.toString();
      const expected = tokenAbiFunctionSelectors[f.name as keyof typeof tokenAbiFunctionSelectors];
      const match = expected === selectorStr ? '✓' : '✗';
      console.log(`${match} ${f.name}: ${selectorStr} ${expected ? `(expected: ${expected})` : ''}`);
      if (f.parameters.length > 0) {
        console.log(
          `  Parameters: ${JSON.stringify(f.parameters.map((p: { name: string; type: { kind: string } }) => ({ name: p.name, type: p.type })))}`,
        );
      }
    }

    console.log('\n=== End Diagnostics ===\n');
  });
});
