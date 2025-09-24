import type { ContractArtifact, ContractInstanceWithAddress } from '@aztec/aztec.js';
import { BASE_URL } from './constants.js';
import { artifactToApiRequest, contractToApiRequest } from './converters.js';
import { BadRequestError, ConflictError, NotFoundError, ServerError, UnexpectedStatusError } from './errors.js';
import type { paths } from './types.js';

/**
 * Response payload returned by the `/tokens` endpoint.
 */
export type TokensResponse = paths['/tokens']['get']['responses']['200']['content']['application/json'];

/**
 * Token metadata returned by the `/tokens/{address}` endpoint.
 */
export type ApiToken = paths['/tokens/{address}']['get']['responses']['200']['content']['application/json'];

/**
 * Raw contract instance payload returned by the `/contracts/{address}` endpoint.
 */
export type ApiContractInstance =
  paths['/contracts/{address}']['get']['responses']['200']['content']['application/json'];

/**
 * Raw contract artifact payload returned by the `/artifacts/{identifier}` endpoint.
 */
export type ApiContractArtifact =
  paths['/artifacts/{identifier}']['get']['responses']['200']['content']['application/json'];

/**
 * Response payload returned by the `/contracts/addresses` endpoint.
 */
export type ContractAddressesResponse =
  paths['/contracts/addresses']['get']['responses']['200']['content']['application/json'];

/**
 * Response payload returned by the `/contracts/by-class/{contractClassId}/addresses` endpoint.
 */
export type ContractAddressesByClassResponse =
  paths['/contracts/by-class/{contractClassId}/addresses']['get']['responses']['200']['content']['application/json'];

/**
 * Standard error envelope returned by the API on failure.
 */
export type ErrorResponse = { error: string };

/**
 * Configuration for constructing a raw API client.
 */
export interface ClientConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  fetch?: typeof fetch;
}

/**
 * Cursor-based pagination parameters accepted by list endpoints.
 */
export interface PaginationParams {
  limit?: number;
  cursor?: number;
}

/**
 * Options shared by helper utilities that hydrate paginated resources.
 */
export interface ApiClientOptions {
  limit?: number;
  cursor?: number;
  cache?: RequestCache; // 'default' | 'no-store' | 'reload' | 'no-cache' | 'force-cache' | 'only-if-cached'
}

/**
 * Creates a `RawApiClient` preconfigured with the default service URL.
 *
 * @param config - Optional overrides for headers or the fetch implementation.
 * @returns A raw client instance targeting the production API.
 */
export function createDefaultRawClient(config?: Omit<ClientConfig, 'baseUrl'>) {
  return new RawApiClient({ baseUrl: BASE_URL, ...config });
}

/**
 * Raw API client that returns unprocessed API responses (hex strings, raw JSON).
 * Use this when you need the raw data without Aztec type deserialization.
 */
export class RawApiClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;
  private readonly fetchFn: typeof fetch;

  /**
   * Creates a new raw API client instance.
   *
   * @param config - Connection details such as base URL, headers, and fetch implementation.
   */
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

      // Throw specific error types based on status code
      switch (response.status) {
        case 400:
          throw new BadRequestError(errorMessage);
        case 404:
          throw new NotFoundError(errorMessage);
        case 409:
          throw new ConflictError(errorMessage);
        case 500:
        case 502:
        case 503:
        case 504:
          throw new ServerError(response.status, response.statusText, errorMessage);
        default:
          throw new UnexpectedStatusError(response.status, response.statusText, errorMessage);
      }
    }

    return response.json() as Promise<T>;
  }

  private buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }
    return searchParams.toString() ? `?${searchParams}` : '';
  }

  /**
   * Retrieves a paginated list of all tokens.
   *
   * @param params - Pagination parameters controlling limit and cursor.
   * @param options - Request options such as fetch cache behaviour.
   * @returns A page of tokens together with pagination metadata.
   */
  async getTokens(params?: PaginationParams, options?: { cache?: RequestCache }): Promise<TokensResponse> {
    const queryString = this.buildQueryString({ ...(params || {}) });
    return this.request<TokensResponse>(`/tokens${queryString}`, options);
  }

  /**
   * Retrieves metadata for a token by its address.
   *
   * @param address - Contract address of the token.
   * @param options - Request options such as fetch cache behaviour.
   * @returns Token metadata as returned by the API.
   */
  async getTokenByAddress(address: string, options?: { cache?: RequestCache }): Promise<ApiToken> {
    return this.request<ApiToken>(`/tokens/${address}`, options);
  }

  /**
   * Retrieves a contract instance by address without performing deserialization.
   *
   * @param address - Contract address to fetch.
   * @param includeArtifact - Whether to include the compiled artifact in the response.
   * @param options - Request options such as fetch cache behaviour.
   * @returns The raw contract instance payload provided by the API.
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
   * Retrieves a contract artifact by contract class ID or artifact hash without deserialization.
   *
   * @param identifier - Contract class ID or artifact hash.
   * @param options - Request options such as fetch cache behaviour.
   * @returns The raw contract artifact as stored by the API.
   */
  async getArtifactRaw(identifier: string, options?: { cache?: RequestCache }): Promise<ApiContractArtifact> {
    return this.request<ApiContractArtifact>(`/artifacts/${identifier}`, options);
  }

  /**
   * Retrieves a paginated list of all contract addresses.
   *
   * @param params - Pagination parameters controlling limit and cursor.
   * @param options - Request options such as fetch cache behaviour.
   * @returns A page of contract addresses together with pagination metadata.
   */
  async getContractAddresses(
    params?: PaginationParams,
    options?: { cache?: RequestCache },
  ): Promise<ContractAddressesResponse> {
    const queryString = this.buildQueryString({ ...(params || {}) });
    return this.request<ContractAddressesResponse>(`/contracts/addresses${queryString}`, options);
  }

  /**
   * Retrieves contract addresses that match a specific contract class ID.
   *
   * @param contractClassId - Contract class ID to match.
   * @param query - Additional filters (match scope) plus pagination parameters.
   * @param options - Request options such as fetch cache behaviour.
   * @returns A page of contract addresses filtered by class ID.
   */
  async getContractAddressesByClassId(
    contractClassId: string,
    query?: { match?: 'current' | 'original' | 'any' } & PaginationParams,
    options?: { cache?: RequestCache },
  ): Promise<ContractAddressesByClassResponse> {
    const queryString = this.buildQueryString({ ...(query || {}) });
    return this.request<ContractAddressesByClassResponse>(
      `/contracts/by-class/${contractClassId}/addresses${queryString}`,
      options,
    );
  }

  /**
   * Helper generator that yields every item from a paginated endpoint.
   *
   * @typeParam T - Shape of the paginated response envelope.
   * @param fetcher - Function that performs a single page fetch.
   * @param options - Options controlling pagination behaviour and caching.
   * @returns An async generator producing each item from all pages in order.
   */
  async *getAllPages<T extends { data: readonly unknown[]; pagination: { hasMore: boolean; nextCursor?: number } }>(
    fetcher: (params: PaginationParams, options?: { cache?: RequestCache }) => Promise<T>,
    options?: ApiClientOptions,
  ): AsyncGenerator<T['data'][number], void, unknown> {
    const limit = options?.limit ?? 100;
    let cursor = options?.cursor ?? 0;
    let hasMore = true;

    while (hasMore) {
      const response = await fetcher({ limit, cursor }, options);

      for (const item of response.data) {
        yield item as T['data'][number];
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
   * Fetches all tokens using automatic pagination.
   *
   * @param options - Options including limit, cursor, and cache settings.
   * @returns Every token known to the API at the time of the request.
   */
  async getAllTokens(options?: ApiClientOptions): Promise<ApiToken[]> {
    const tokens: ApiToken[] = [];
    for await (const token of this.getAllPages((params, options) => this.getTokens(params, options), options)) {
      tokens.push(token);
    }
    return tokens;
  }

  /**
   * Fetches all contract addresses using automatic pagination.
   *
   * @param options - Options including limit, cursor, and cache settings.
   * @returns Every contract address known to the API at the time of the request.
   */
  async getAllContractAddresses(options?: ApiClientOptions): Promise<string[]> {
    const addresses: string[] = [];
    for await (const address of this.getAllPages((params, opts) => this.getContractAddresses(params, opts), options)) {
      addresses.push(address);
    }
    return addresses;
  }

  /**
   * Fetches all contract addresses for a given class using automatic pagination.
   *
   * @param contractClassId - The contract class ID to filter by.
   * @param query - Optional query parameters including match scope.
   * @param options - Options including limit, cursor, and cache settings.
   * @returns Contract addresses whose class matches the provided ID.
   */
  async getAllContractAddressesByClassId(
    contractClassId: string,
    query?: { match?: 'current' | 'original' | 'any' },
    options?: ApiClientOptions,
  ): Promise<string[]> {
    const addresses: string[] = [];
    for await (const address of this.getAllPages(
      (params, opts) => this.getContractAddressesByClassId(contractClassId, { ...query, ...params }, opts),
      options,
    )) {
      addresses.push(address);
    }
    return addresses;
  }

  /**
   * Uploads a contract artifact to the API without deserialization.
   *
   * @param artifact - The `ContractArtifact` to upload.
   * @param options - Options including cache settings.
   * @returns Contract class ID of the uploaded artifact.
   * @throws Error if upload fails or the artifact payload is invalid.
   */
  async uploadContractArtifactRaw(
    artifact: ContractArtifact,
    options?: { cache?: RequestCache },
  ): Promise<{ contractClassId: string }> {
    const requestBody = artifactToApiRequest(artifact);

    return this.request<paths['/artifacts']['post']['responses']['201']['content']['application/json']>('/artifacts', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      ...options,
    });
  }

  /**
   * Uploads a contract instance (and optional artifact) without deserialization.
   *
   * @param instance - The `ContractInstanceWithAddress` to upload.
   * @param artifact - Optional `ContractArtifact` to upload with the instance.
   * @param options - Options including cache settings.
   * @returns Address and current contract class ID of the uploaded instance.
   * @throws Error if upload fails or the instance/artifact payload is invalid.
   */
  async uploadContractInstanceRaw(
    instance: ContractInstanceWithAddress,
    artifact?: ContractArtifact,
    options?: { cache?: RequestCache },
  ): Promise<{ address: string; currentContractClassId: string }> {
    const requestBody = contractToApiRequest(instance, artifact);

    return this.request<paths['/contracts']['post']['responses']['201']['content']['application/json']>('/contracts', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      ...options,
    });
  }
}
