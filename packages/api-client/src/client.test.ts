/** biome-ignore-all lint/suspicious/noExplicitAny: tests */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type Token, TurnstileApiClient } from './client.js';
import { deserializeContractArtifact, deserializeContractInstance } from './utils/deserializers.js';
import { serializeContractArtifact, serializeContractInstance } from './utils/serializers.js';

// Mock the deserializer and serializer functions
vi.mock('./utils/deserializers.js', () => ({
  deserializeContractInstance: vi.fn(),
  deserializeContractArtifact: vi.fn(),
}));

vi.mock('./utils/serializers.js', () => ({
  serializeContractArtifact: vi.fn(),
  serializeContractInstance: vi.fn(),
}));

describe('TurnstileApiClient', () => {
  const mockFetch = vi.fn();
  const client = new TurnstileApiClient({
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

      const tokens: Token[] = [];
      for await (const token of client.getAllPages((params) => client.getTokens(params), { limit: 1 })) {
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

      const tokens: Token[] = [];
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
    it('should fetch a contract and deserialize it', async () => {
      const rawResponse = {
        id: 1,
        address: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        version: 1,
        salt: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        deployer: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        current_contract_class_id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        original_contract_class_id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        initialization_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        public_keys: {
          masterNullifierPublicKey: { x: '0x123', y: '0x456' },
          masterIncomingViewingPublicKey: { x: '0x789', y: '0xabc' },
          masterOutgoingViewingPublicKey: { x: '0xdef', y: '0x012' },
          masterTaggingPublicKey: { x: '0x345', y: '0x678' },
        },
        initialization_data: {
          constructorArtifact: 'test',
          constructorArgs: [42],
        },
      };

      const deserializedResponse = { ...rawResponse, address: 'deserialized_address' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => rawResponse,
      });

      vi.mocked(deserializeContractInstance).mockReturnValue(deserializedResponse as any);

      const result = await client.getContract('0x123');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/contracts/0x123', expect.any(Object));
      expect(deserializeContractInstance).toHaveBeenCalledWith(rawResponse);
      expect(result).toEqual(deserializedResponse);
    });

    it('should include artifact when requested', async () => {
      const rawResponse = {
        id: 1,
        address: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        version: 1,
        salt: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        deployer: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        current_contract_class_id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        original_contract_class_id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        initialization_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        public_keys: {
          masterNullifierPublicKey: { x: '0x123', y: '0x456' },
          masterIncomingViewingPublicKey: { x: '0x789', y: '0xabc' },
          masterOutgoingViewingPublicKey: { x: '0xdef', y: '0x012' },
          masterTaggingPublicKey: { x: '0x345', y: '0x678' },
        },
        initialization_data: null,
        artifact: { name: 'TestContract' },
      };

      const deserializedResponse = { ...rawResponse, address: 'deserialized_address' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => rawResponse,
      });

      vi.mocked(deserializeContractInstance).mockReturnValue(deserializedResponse as any);

      const result = await client.getContract('0x123', true);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/contracts/0x123?includeArtifact=true',
        expect.any(Object),
      );
      expect(deserializeContractInstance).toHaveBeenCalledWith(rawResponse);
      expect(result).toEqual(deserializedResponse);
    });
  });

  describe('getArtifact', () => {
    it('should fetch an artifact and deserialize it', async () => {
      const rawResponse = {
        id: 1,
        artifact_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        contract_class_id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        artifact: { name: 'TestContract' },
      };

      const deserializedResponse = { ...rawResponse, artifact_hash: 'deserialized_hash' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => rawResponse,
      });

      vi.mocked(deserializeContractArtifact).mockReturnValue(deserializedResponse as any);

      const result = await client.getArtifact('0x123');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/artifacts/0x123', expect.any(Object));
      expect(deserializeContractArtifact).toHaveBeenCalledWith(rawResponse);
      expect(result).toEqual(deserializedResponse);
    });
  });

  describe('raw contract methods', () => {
    it('should fetch raw contract without deserialization', async () => {
      const rawResponse = {
        id: 1,
        address: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        version: 1,
        salt: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        deployer: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        current_contract_class_id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        original_contract_class_id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        initialization_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        public_keys: {
          masterNullifierPublicKey: { x: '0x123', y: '0x456' },
          masterIncomingViewingPublicKey: { x: '0x789', y: '0xabc' },
          masterOutgoingViewingPublicKey: { x: '0xdef', y: '0x012' },
          masterTaggingPublicKey: { x: '0x345', y: '0x678' },
        },
        initialization_data: null,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => rawResponse,
      });

      const result = await client.getContractRaw('0x123');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/contracts/0x123', expect.any(Object));
      expect(deserializeContractInstance).not.toHaveBeenCalled();
      expect(result).toEqual(rawResponse);
    });

    it('should fetch raw artifact without deserialization', async () => {
      const rawResponse = {
        id: 1,
        artifact_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        contract_class_id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        artifact: { name: 'TestContract' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => rawResponse,
      });

      const result = await client.getArtifactRaw('0x123');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/artifacts/0x123', expect.any(Object));
      expect(deserializeContractArtifact).not.toHaveBeenCalled();
      expect(result).toEqual(rawResponse);
    });
  });

  describe('query string building', () => {
    it('should handle complex query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], pagination: { hasMore: false } }),
      });

      await client.getContractInstancesByClassId('0x123', { match: 'current' });

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

      await client.getContractInstancesByClassId('0x123');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/contracts/by-class/0x123/addresses',
        expect.any(Object),
      );
    });
  });

  describe('uploadContractArtifact', () => {
    it('should upload an artifact successfully', async () => {
      const mockArtifact = { name: 'TestContract' } as any;
      const mockSerializedArtifact = '0x1234abcd';
      const mockRawResponse = {
        id: 1,
        artifact_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        contract_class_id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        artifact: '0x1234abcd',
        isToken: false,
      };
      const mockDeserializedResponse = { ...mockRawResponse, artifact_hash: 'deserialized_hash' } as any;

      vi.mocked(serializeContractArtifact).mockReturnValue(mockSerializedArtifact);
      vi.mocked(deserializeContractArtifact).mockReturnValue(mockDeserializedResponse);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRawResponse,
      });

      const result = await client.uploadContractArtifact(mockArtifact);

      expect(serializeContractArtifact).toHaveBeenCalledWith(mockArtifact);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/artifacts', {
        method: 'POST',
        body: JSON.stringify({ artifact: mockSerializedArtifact }),
        cache: undefined,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(deserializeContractArtifact).toHaveBeenCalledWith(mockRawResponse);
      expect(result).toEqual(mockDeserializedResponse);
    });

    it('should handle upload errors', async () => {
      const mockArtifact = { name: 'TestContract' } as any;
      vi.mocked(serializeContractArtifact).mockReturnValue('0x1234');

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid artifact' }),
      });

      await expect(client.uploadContractArtifact(mockArtifact)).rejects.toThrow('Invalid artifact');
    });

    it('should handle serialization errors', async () => {
      const mockArtifact = { name: 'TestContract' } as any;
      vi.mocked(serializeContractArtifact).mockImplementation(() => {
        throw new Error('Serialization failed');
      });

      await expect(client.uploadContractArtifact(mockArtifact)).rejects.toThrow('Serialization failed');
    });
  });

  describe('uploadContractInstance', () => {
    it('should upload a contract instance without artifact', async () => {
      const mockInstance = {
        address: 'mock_address',
        version: 1,
        salt: 'mock_salt',
        deployer: 'mock_deployer',
        current_contract_class_id: 'mock_class_id',
        original_contract_class_id: 'mock_class_id',
        initialization_hash: 'mock_hash',
        public_keys: 'mock_keys',
        initialization_data: null,
      } as any;

      const mockSerializedInstance = {
        address: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        version: 1,
        salt: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        deployer: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        current_contract_class_id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        original_contract_class_id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        initialization_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        public_keys: '0x1234567890abcdef',
        initialization_data: null,
      };

      const mockRawResponse = {
        id: 1,
        ...mockSerializedInstance,
        isToken: false,
      };

      const mockDeserializedResponse = { ...mockRawResponse, address: 'deserialized_address' } as any;

      vi.mocked(serializeContractInstance).mockReturnValue(mockSerializedInstance);
      vi.mocked(deserializeContractInstance).mockReturnValue(mockDeserializedResponse);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRawResponse,
      });

      const result = await client.uploadContractInstance(mockInstance);

      expect(serializeContractInstance).toHaveBeenCalledWith(mockInstance);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/contracts', {
        method: 'POST',
        body: JSON.stringify({ instance: mockSerializedInstance }),
        cache: undefined,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(deserializeContractInstance).toHaveBeenCalledWith(mockRawResponse);
      expect(result).toEqual(mockDeserializedResponse);
    });

    it('should upload a contract instance with artifact', async () => {
      const mockInstance = {
        address: 'mock_address',
        version: 1,
      } as any;

      const mockArtifact = { name: 'TestContract' } as any;
      const mockSerializedInstance = { address: '0x123', version: 1 } as any;
      const mockSerializedArtifact = '0x1234abcd';

      const mockRawResponse = {
        id: 1,
        address: '0x123',
        version: 1,
        salt: '0x456',
        deployer: '0x789',
        current_contract_class_id: '0xabc',
        original_contract_class_id: '0xdef',
        initialization_hash: '0x012',
        public_keys: '0x345',
        initialization_data: null,
        artifact: '0x1234abcd',
        isToken: false,
      };

      const mockDeserializedResponse = { ...mockRawResponse, address: 'deserialized_address' } as any;

      vi.mocked(serializeContractInstance).mockReturnValue(mockSerializedInstance);
      vi.mocked(serializeContractArtifact).mockReturnValue(mockSerializedArtifact);
      vi.mocked(deserializeContractInstance).mockReturnValue(mockDeserializedResponse);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRawResponse,
      });

      const result = await client.uploadContractInstance(mockInstance, mockArtifact);

      expect(serializeContractInstance).toHaveBeenCalledWith(mockInstance);
      expect(serializeContractArtifact).toHaveBeenCalledWith(mockArtifact);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/contracts', {
        method: 'POST',
        body: JSON.stringify({
          instance: mockSerializedInstance,
          artifact: mockSerializedArtifact,
        }),
        cache: undefined,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(deserializeContractInstance).toHaveBeenCalledWith(mockRawResponse);
      expect(result).toEqual(mockDeserializedResponse);
    });

    it('should handle upload errors for contract instances', async () => {
      const mockInstance = { address: 'mock_address' } as any;
      vi.mocked(serializeContractInstance).mockReturnValue({} as any);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        statusText: 'Conflict',
        json: async () => ({ error: 'Contract instance already exists' }),
      });

      await expect(client.uploadContractInstance(mockInstance)).rejects.toThrow('Contract instance already exists');
    });

    it('should handle serialization errors for contract instances', async () => {
      const mockInstance = { address: 'mock_address' } as any;
      vi.mocked(serializeContractInstance).mockImplementation(() => {
        throw new Error('Instance serialization failed');
      });

      await expect(client.uploadContractInstance(mockInstance)).rejects.toThrow('Instance serialization failed');
    });

    it('should handle artifact serialization errors when artifact is provided', async () => {
      const mockInstance = { address: 'mock_address' } as any;
      const mockArtifact = { name: 'TestContract' } as any;

      vi.mocked(serializeContractInstance).mockReturnValue({} as any);
      vi.mocked(serializeContractArtifact).mockImplementation(() => {
        throw new Error('Artifact serialization failed');
      });

      await expect(client.uploadContractInstance(mockInstance, mockArtifact)).rejects.toThrow(
        'Artifact serialization failed',
      );
    });
  });
});
