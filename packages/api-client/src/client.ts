import { BASE_URL } from './constants.js';
import type { paths } from './types.js';
import {
  type DeserializedContractArtifact,
  type DeserializedContractInstance,
  deserializeContractArtifact,
  deserializeContractInstance,
} from './utils/deserializers.js';
import { serializeContractArtifact, serializeContractInstance } from './utils/serializers.js';

export type TokensResponse = paths['/tokens']['get']['responses']['200']['content']['application/json'];
export type ApiToken = paths['/tokens/{address}']['get']['responses']['200']['content']['application/json'];
export type ApiContractInstance =
  paths['/contracts/{address}']['get']['responses']['200']['content']['application/json'];
export type ApiContractArtifact =
  paths['/artifacts/{identifier}']['get']['responses']['200']['content']['application/json'];
export type ContractInstancesResponse =
  paths['/contracts/by-class/{contractClassId}/addresses']['get']['responses']['200']['content']['application/json'];
export type ErrorResponse = { error: string };

export interface ClientConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  fetch?: typeof fetch;
}

export interface PaginationParams {
  limit?: number;
  cursor?: number;
}

export interface ApiClientOptions {
  limit?: number;
  cursor?: number;
  cache?: RequestCache; // 'default' | 'no-store' | 'reload' | 'no-cache' | 'force-cache' | 'only-if-cached'
}

export function createDefaultClient(config?: Omit<ClientConfig, 'baseUrl'>) {
  return new AztecArtifactsApiClient({ baseUrl: BASE_URL, ...config });
}

export class AztecArtifactsApiClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;
  private readonly fetchFn: typeof fetch;

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
    this.fetchFn = config.fetch || fetch;
  }

  private async request<T>(path: string, options?: RequestInit & { cache?: RequestCache }): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await this.fetchFn.call(globalThis, url, {
      ...options,
      cache: options?.cache,
      headers: {
        ...this.headers,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = (await response.json()) as ErrorResponse;
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {
        // Ignore JSON parse errors
      }
      throw new Error(errorMessage);
    }

    return response.json() as Promise<T>;
  }

  private buildQueryString(params: PaginationParams | Record<string, string | number | boolean | undefined>): string {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Get a paginated list of all tokens
   */
  async getTokens(params?: PaginationParams, options?: { cache?: RequestCache }): Promise<TokensResponse> {
    const queryString = this.buildQueryString(params || {});
    return this.request<TokensResponse>(`/tokens${queryString}`, options);
  }

  /**
   * Get a token by its address
   */
  async getTokenByAddress(address: string, options?: { cache?: RequestCache }): Promise<ApiToken> {
    return this.request<ApiToken>(`/tokens/${address}`, options);
  }

  /**
   * Get a contract instance by its address, optionally including artifact data
   * Returns deserialized Aztec types (AztecAddress, Fr, PublicKeys, etc.)
   */
  async getContract(
    address: string,
    includeArtifact?: boolean,
    options?: { cache?: RequestCache },
  ): Promise<DeserializedContractInstance> {
    const queryString = this.buildQueryString(includeArtifact ? { includeArtifact: 'true' } : {});
    const rawResponse = await this.request<ApiContractInstance>(`/contracts/${address}${queryString}`, options);
    return deserializeContractInstance(rawResponse);
  }

  /**
   * Get a contract artifact by contract class ID or artifact hash
   * Returns deserialized Aztec types (Fr fields and properly typed ContractArtifact)
   */
  async getArtifact(identifier: string, options?: { cache?: RequestCache }): Promise<DeserializedContractArtifact> {
    const rawResponse = await this.request<ApiContractArtifact>(`/artifacts/${identifier}`, options);
    return deserializeContractArtifact(rawResponse);
  }

  /**
   * Get a contract instance by its address (raw response without deserialization)
   * Use this if you need the raw hex strings instead of Aztec types
   */
  async getContractRaw(
    address: string,
    includeArtifact?: boolean,
    options?: { cache?: RequestCache },
  ): Promise<ApiContractInstance> {
    const queryString = this.buildQueryString(includeArtifact ? { includeArtifact: 'true' } : {});
    return this.request<ApiContractInstance>(`/contracts/${address}${queryString}`, options);
  }

  /**
   * Get a contract artifact by contract class ID or artifact hash (raw response without deserialization)
   * Use this if you need the raw hex strings instead of Aztec types
   */
  async getArtifactRaw(identifier: string, options?: { cache?: RequestCache }): Promise<ApiContractArtifact> {
    return this.request<ApiContractArtifact>(`/artifacts/${identifier}`, options);
  }

  /**
   * Get all contract instance addresses that match the given contract class ID
   */
  async getContractInstancesByClassId(
    contractClassId: string,
    query?: { match?: 'current' | 'original' | 'any' },
    options?: { cache?: RequestCache },
  ): Promise<ContractInstancesResponse> {
    const queryString = this.buildQueryString(query ?? {});
    return this.request<ContractInstancesResponse>(
      `/contracts/by-class/${contractClassId}/addresses${queryString}`,
      options,
    );
  }

  /**
   * Helper method to fetch all pages of a paginated endpoint
   */
  async *getAllPages<T extends TokensResponse>(
    fetcher: (params: PaginationParams, options?: { cache?: RequestCache }) => Promise<T>,
    options?: ApiClientOptions,
  ): AsyncGenerator<T['data'][number], void, unknown> {
    const limit = options?.limit ?? 100;
    let cursor = options?.cursor ?? 0;
    let hasMore = true;

    while (hasMore) {
      const response = await fetcher({ limit, cursor }, options);

      for (const item of response.data) {
        yield item;
      }

      hasMore = response.pagination.hasMore;
      if (hasMore && response.pagination.nextCursor !== undefined) {
        cursor = response.pagination.nextCursor;
      } else {
        hasMore = false;
      }
    }
  }

  /**
   * Fetch all tokens (auto-paginated)
   * @param options - Options including limit, cursor, and cache settings
   */
  async getAllTokens(options?: ApiClientOptions): Promise<ApiToken[]> {
    const tokens: ApiToken[] = [];
    for await (const token of this.getAllPages((params, options) => this.getTokens(params, options), options)) {
      tokens.push(token);
    }
    return tokens;
  }

  /**
   * Upload a contract artifact to the API
   * @param artifact - The ContractArtifact to upload
   * @param options - Options including cache settings
   * @returns Deserialized artifact response from the API
   * @throws Error if upload fails or artifact is invalid
   */
  async uploadContractArtifact(
    artifact: import('@aztec/aztec.js').ContractArtifact,
    options?: { cache?: RequestCache },
  ): Promise<DeserializedContractArtifact> {
    const serializedArtifact = serializeContractArtifact(artifact);

    const requestBody = {
      artifact: serializedArtifact,
    };

    const rawResponse = await this.request<
      paths['/artifacts']['post']['responses']['201']['content']['application/json']
    >('/artifacts', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      ...options,
    });

    return deserializeContractArtifact(rawResponse);
  }

  /**
   * Upload a contract instance to the API
   * @param instance - The DeserializedContractInstance to upload
   * @param artifact - Optional ContractArtifact to upload with the instance
   * @param options - Options including cache settings
   * @returns Deserialized contract instance response from the API
   * @throws Error if upload fails or instance/artifact is invalid
   */
  async uploadContractInstance(
    instance: DeserializedContractInstance,
    artifact?: import('@aztec/aztec.js').ContractArtifact,
    options?: { cache?: RequestCache },
  ): Promise<DeserializedContractInstance> {
    const serializedInstance = serializeContractInstance(instance);

    const requestBody: paths['/contracts']['post']['requestBody']['content']['application/json'] = {
      instance: serializedInstance,
    };

    if (artifact) {
      requestBody.artifact = serializeContractArtifact(artifact);
    }

    const rawResponse = await this.request<
      paths['/contracts']['post']['responses']['201']['content']['application/json']
    >('/contracts', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      ...options,
    });

    return deserializeContractInstance(rawResponse);
  }
}
