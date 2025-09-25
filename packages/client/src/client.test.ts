import { PublicKeys } from '@aztec/aztec.js';
import { randomContractArtifact, randomContractInstanceWithAddress } from '@aztec/stdlib/testing';
import { contractArtifactCodec } from '@aztec-artifacts/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AztecArtifactsApiClient } from './client.js';
import { type ApiToken, RawApiClient } from './raw-client.js';

describe('AztecArtifactsApiClient', () => {
  const mockFetch = vi.fn();
  const client = new AztecArtifactsApiClient({
    baseUrl: 'http://localhost:8080',
    fetch: mockFetch as unknown as typeof fetch,
  });
  const rawClient = new RawApiClient({
    baseUrl: 'http://localhost:8080',
    fetch: mockFetch as unknown as typeof fetch,
  });

  afterEach(() => {
    mockFetch.mockClear();
    vi.clearAllMocks();
  });

  describe('getTokens', () => {
    it('should fetch tokens with pagination', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            symbol: 'USDC',
            name: 'USD Coin',
            decimals: 6,
            address: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          },
        ],
        pagination: {
          limit: 10,
          cursor: 0,
          nextCursor: 1,
          hasMore: true,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getTokens({ limit: 10, cursor: 0 });

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/tokens?limit=10&cursor=0', expect.any(Object));
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty params', async () => {
      const mockResponse = {
        data: [],
        pagination: {
          limit: 100,
          hasMore: false,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getTokens();

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/tokens', expect.any(Object));
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getTokenByAddress', () => {
    it('should fetch a token by address', async () => {
      const mockToken = {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        address: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockToken,
      });

      const result = await client.getTokenByAddress(
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/tokens/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
        expect.any(Object),
      );
      expect(result).toEqual(mockToken);
    });

    it('should handle L2 address format', async () => {
      const mockToken = {
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        address: '0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef98',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockToken,
      });

      const result = await client.getTokenByAddress(
        '0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef98',
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/tokens/0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef98',
        expect.any(Object),
      );
      expect(result).toEqual(mockToken);
    });
  });

  describe('error handling', () => {
    it('should throw an error for non-ok responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Token not found' }),
      });

      await expect(client.getTokenByAddress('0x123')).rejects.toThrow('Token not found');
    });

    it('should handle JSON parse errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(client.getTokens()).rejects.toThrow('HTTP 500: Internal Server Error');
    });
  });

  describe('getAllPages', () => {
    it('should iterate through all pages', async () => {
      const page1 = {
        data: [
          {
            id: 1,
            symbol: 'TOKEN1',
            name: 'Token 1',
            decimals: 18,
            address: '0x1111111111111111111111111111111111111111111111111111111111111111',
          },
        ],
        pagination: { limit: 1, hasMore: true, nextCursor: 2 },
      };

      const page2 = {
        data: [
          {
            id: 2,
            symbol: 'TOKEN2',
            name: 'Token 2',
            decimals: 18,
            address: '0x2222222222222222222222222222222222222222222222222222222222222222',
          },
        ],
        pagination: { limit: 1, hasMore: false },
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => page1 })
        .mockResolvedValueOnce({ ok: true, json: async () => page2 });

      const tokens: ApiToken[] = [];
      for await (const token of client.getAllPages((params, options) => client.getTokens(params, options), {
        limit: 1,
      })) {
        tokens.push(token);
      }

      expect(tokens).toHaveLength(2);
      expect(tokens[0]?.symbol).toBe('TOKEN1');
      expect(tokens[1]?.symbol).toBe('TOKEN2');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('getAllTokens', () => {
    it('should fetch all tokens with auto-pagination', async () => {
      const page1 = {
        data: [
          {
            id: 1,
            symbol: 'TOKEN1',
            name: 'Token 1',
            decimals: 18,
            address: '0x1111111111111111111111111111111111111111111111111111111111111111',
          },
        ],
        pagination: { limit: 1, hasMore: true, nextCursor: 2 },
      };

      const page2 = {
        data: [
          {
            id: 2,
            symbol: 'TOKEN2',
            name: 'Token 2',
            decimals: 18,
            address: '0x2222222222222222222222222222222222222222222222222222222222222222',
          },
        ],
        pagination: { limit: 1, hasMore: false },
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => page1 })
        .mockResolvedValueOnce({ ok: true, json: async () => page2 });

      const tokens = await client.getAllTokens({ limit: 1 });

      expect(tokens).toHaveLength(2);
      expect(tokens[0]?.symbol).toBe('TOKEN1');
      expect(tokens[1]?.symbol).toBe('TOKEN2');
      expect(tokens[0]?.address).toBe('0x1111111111111111111111111111111111111111111111111111111111111111');
      expect(tokens[1]?.address).toBe('0x2222222222222222222222222222222222222222222222222222222222222222');
    });

    it('should start from specified cursor when provided', async () => {
      const page1 = {
        data: [
          {
            id: 5,
            symbol: 'TOKEN5',
            name: 'Token 5',
            decimals: 18,
            address: '0x5555555555555555555555555555555555555555555555555555555555555555',
          },
        ],
        pagination: { limit: 1, hasMore: true, nextCursor: 6 },
      };

      const page2 = {
        data: [
          {
            id: 6,
            symbol: 'TOKEN6',
            name: 'Token 6',
            decimals: 18,
            address: '0x6666666666666666666666666666666666666666666666666666666666666666',
          },
        ],
        pagination: { limit: 1, hasMore: false },
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => page1 })
        .mockResolvedValueOnce({ ok: true, json: async () => page2 });

      const tokens = await client.getAllTokens({ limit: 1, cursor: 5 });

      expect(tokens).toHaveLength(2);
      expect(tokens[0]?.symbol).toBe('TOKEN5');
      expect(tokens[1]?.symbol).toBe('TOKEN6');
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/tokens?limit=1&cursor=5', expect.any(Object));
    });
  });

  describe('getAllPages with startCursor', () => {
    it('should start fetching from the specified cursor', async () => {
      const page1 = {
        data: [
          {
            id: 10,
            symbol: 'TOKEN10',
            name: 'Token 10',
            decimals: 18,
            address: '0x1010101010101010101010101010101010101010101010101010101010101010',
          },
        ],
        pagination: { limit: 1, hasMore: true, nextCursor: 11 },
      };

      const page2 = {
        data: [
          {
            id: 11,
            symbol: 'TOKEN11',
            name: 'Token 11',
            decimals: 18,
            address: '0x1111111111111111111111111111111111111111111111111111111111111111',
          },
        ],
        pagination: { limit: 1, hasMore: false },
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => page1 })
        .mockResolvedValueOnce({ ok: true, json: async () => page2 });

      const tokens: ApiToken[] = [];
      for await (const token of client.getAllPages((params) => client.getTokens(params), { limit: 1, cursor: 10 })) {
        tokens.push(token);
      }

      expect(tokens).toHaveLength(2);
      expect(tokens[0]?.id).toBe(10);
      expect(tokens[1]?.id).toBe(11);
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        'http://localhost:8080/tokens?limit=1&cursor=10',
        expect.any(Object),
      );
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        'http://localhost:8080/tokens?limit=1&cursor=11',
        expect.any(Object),
      );
    });
  });

  describe('getContract', () => {
    it('should fetch a contract and return Aztec types', async () => {
      const publicKeys = await PublicKeys.random();
      const rawResponse = {
        id: 1,
        address: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        version: 1,
        salt: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        deployer: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        currentContractClassId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        originalContractClassId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        initializationHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        publicKeys: publicKeys.toString(),
        initializationData: {
          constructorName: 'test',
          encodedArgs: ['0x0000000000000000000000000000000000000000000000000000000000000042'],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => rawResponse,
      });

      const result = await client.getContract('0x123');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/contracts/0x123', expect.any(Object));
      // Check that the result is properly formatted as ContractInstanceWithAddress
      expect(result.instance).toHaveProperty('address');
      expect(result.instance).toHaveProperty('currentContractClassId');
      expect(result.instance).toHaveProperty('originalContractClassId');
      expect(result.instance).toHaveProperty('initializationHash');
      expect(result.instance).toHaveProperty('publicKeys');
      expect(result.instance).toHaveProperty('salt');
      expect(result.instance).toHaveProperty('deployer');
      expect(result.instance).toHaveProperty('version', 1);
    });

    it('should include artifact when requested', async () => {
      const mockArtifact = randomContractArtifact();
      const publicKeys = await PublicKeys.random();

      const rawResponse = {
        id: 1,
        address: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        version: 1,
        salt: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        deployer: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        currentContractClassId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        originalContractClassId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        initializationHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        publicKeys: publicKeys.toString(),
        initializationData: null,
        artifact: contractArtifactCodec.encode(mockArtifact),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => rawResponse,
      });

      const result = await client.getContract('0x123', true);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/contracts/0x123?includeArtifact=true',
        expect.any(Object),
      );

      expect(result.artifact).toBeDefined();
    });
  });

  describe('getArtifact', () => {
    it('should fetch an artifact and return the ContractArtifact', async () => {
      const mockArtifact = randomContractArtifact();

      const rawResponse = {
        id: 1,
        artifactHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        contractClassId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        artifact: contractArtifactCodec.encode(mockArtifact),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => rawResponse,
      });

      const result = await client.getArtifact('0x123');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/artifacts/0x123', expect.any(Object));
      // Now client returns just the artifact, not the entire response
      expect(result).toBeDefined();
    });
  });

  describe('raw client methods', () => {
    it('should fetch raw contract without deserialization', async () => {
      const publicKeys = await PublicKeys.random();
      const rawResponse = {
        id: 1,
        address: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        version: 1,
        salt: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        deployer: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        currentContractClassId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        originalContractClassId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        initializationHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        publicKeys: publicKeys.toString(),
        initializationData: null,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => rawResponse,
      });

      const result = await rawClient.getContractRaw('0x123');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/contracts/0x123', expect.any(Object));
      expect(result).toEqual(rawResponse);
    });

    it('should fetch raw artifact without deserialization', async () => {
      const mockArtifact = randomContractArtifact();

      const rawResponse = {
        id: 1,
        artifactHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        contractClassId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        artifact: contractArtifactCodec.encode(mockArtifact),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => rawResponse,
      });

      const result = await rawClient.getArtifactRaw('0x123');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/artifacts/0x123', expect.any(Object));
      expect(result).toEqual(rawResponse);
    });
  });

  describe('query string building', () => {
    it('should handle complex query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], pagination: { hasMore: false } }),
      });

      await client.getContractAddressesByClassId('0x123', { match: 'current' });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/contracts/by-class/0x123/addresses?match=current',
        expect.any(Object),
      );
    });

    it('should handle undefined query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], pagination: { hasMore: false } }),
      });

      await client.getContractAddressesByClassId('0x123');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/contracts/by-class/0x123/addresses',
        expect.any(Object),
      );
    });
  });

  describe('uploadContractArtifact', () => {
    it('should upload an artifact successfully', async () => {
      const mockArtifact = randomContractArtifact();
      const mockRawResponse = {
        id: 1,
        artifactHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        contractClassId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        artifact: contractArtifactCodec.encode(mockArtifact),
        isToken: false,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRawResponse,
      });

      const result = await client.uploadContractArtifact(mockArtifact);

      // Note: serializeContractArtifact is called internally by rawClient
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/artifacts',
        expect.objectContaining({
          method: 'POST',
        }),
      );
      expect(result).toBeDefined();
    });

    it('should handle upload errors', async () => {
      const mockArtifact = randomContractArtifact();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid artifact' }),
      });

      await expect(client.uploadContractArtifact(mockArtifact)).rejects.toThrow('Invalid artifact');
    });
  });

  describe('uploadContractInstance', () => {
    it('should upload a contract instance without artifact', async () => {
      const mockInstance = await randomContractInstanceWithAddress();

      const mockRawResponse = {
        id: 1,
        address: mockInstance.address.toString(),
        version: 1,
        salt: mockInstance.salt.toString(),
        deployer: mockInstance.deployer.toString(),
        currentContractClassId: mockInstance.currentContractClassId.toString(),
        originalContractClassId: mockInstance.originalContractClassId.toString(),
        initializationHash: mockInstance.initializationHash.toString(),
        publicKeys: mockInstance.publicKeys.toString(),
        initializationData: null,
        isToken: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRawResponse,
      });

      const result = await client.uploadContractInstance({ instance: mockInstance });

      // Note: serializeContractInstance is called internally by rawClient
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/contracts',
        expect.objectContaining({
          method: 'POST',
        }),
      );
      expect(result).toBeDefined();
    });

    it('should upload a contract instance with artifact', async () => {
      const mockInstance = await randomContractInstanceWithAddress();
      const mockArtifact = randomContractArtifact();

      const mockRawResponse = {
        id: 1,
        address: mockInstance.address.toString(),
        version: 1,
        salt: mockInstance.salt.toString(),
        deployer: mockInstance.deployer.toString(),
        currentContractClassId: mockInstance.currentContractClassId.toString(),
        originalContractClassId: mockInstance.originalContractClassId.toString(),
        initializationHash: mockInstance.initializationHash.toString(),
        publicKeys: mockInstance.publicKeys.toString(),
        artifact: contractArtifactCodec.encode(mockArtifact),
        isToken: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRawResponse,
      });

      const result = await client.uploadContractInstance({ instance: mockInstance, artifact: mockArtifact });

      // Note: serialization is handled internally by rawClient
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/contracts',
        expect.objectContaining({
          method: 'POST',
        }),
      );
      expect(result).toBeDefined();
    });

    it('should handle upload errors for contract instances', async () => {
      const mockInstance = await randomContractInstanceWithAddress();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        statusText: 'Conflict',
        json: async () => ({ error: 'Contract instance already exists' }),
      });

      await expect(client.uploadContractInstance({ instance: mockInstance })).rejects.toThrow(
        'Contract instance already exists',
      );
    });
  });
});
