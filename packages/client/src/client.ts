import type { ContractArtifact, ContractInstanceWithAddress } from '@aztec/aztec.js';
import { contractArtifactCodec, type InitializationData, serializeContractInstance } from '@aztec-artifacts/common';
import { BASE_URL } from './constants.js';
import { apiResponseToArtifact, apiResponseToContract } from './converters.js';
import {
  type ApiClientOptions,
  type ApiToken,
  type ClientConfig,
  type ContractAddressesByClassResponse,
  type ContractAddressesResponse,
  type PaginationParams,
  RawApiClient,
  type TokensResponse,
} from './raw-client.js';
import { createConsoleLogger, emitLog, type Logger } from './utils.js';
/**
 * Creates an `AztecArtifactsApiClient` preconfigured with the default service URL.
 *
 * @param config - Optional overrides for headers or the fetch implementation.
 * @returns A high-level API client targeting the production service.
 */
export function createDefaultClient(config?: Omit<ClientConfig, 'baseUrl'>) {
  return new AztecArtifactsApiClient({ baseUrl: BASE_URL, ...config });
}

/**
 * High-level client that wraps the raw API and returns strongly typed Aztec primitives.
 */
export class AztecArtifactsApiClient {
  private readonly rawClient: RawApiClient;
  private readonly logger: Logger;

  /**
   * Creates a new API client instance.
   *
   * @param config - Connection details such as the base URL and default headers.
   */
  constructor(config: ClientConfig) {
    const logger = config.logger ?? createConsoleLogger();
    this.logger = logger;
    this.rawClient = new RawApiClient({ ...config, logger });
    // Bind getAllPages method to preserve context
    this.getAllPages = this.rawClient.getAllPages.bind(this.rawClient);
  }

  // Token methods (no deserialization needed)
  /**
   * Retrieves a paginated list of tokens.
   *
   * @param params - Pagination parameters controlling limit and cursor.
   * @param options - Request options such as fetch cache behaviour.
   * @returns A page of tokens together with pagination metadata.
   */
  async getTokens(params?: PaginationParams, options?: { cache?: RequestCache }): Promise<TokensResponse> {
    return this.rawClient.getTokens(params, options);
  }

  /**
   * Retrieves metadata for a token by its address.
   *
   * @param address - Contract address of the token.
   * @param options - Request options such as fetch cache behaviour.
   * @returns Token metadata as returned by the API.
   */
  async getTokenByAddress(address: string, options?: { cache?: RequestCache }): Promise<ApiToken> {
    return this.rawClient.getTokenByAddress(address, options);
  }

  /**
   * Fetches all tokens using automatic pagination.
   *
   * @param options - Options including limit, cursor, and cache settings.
   * @returns Every token known to the API at the time of the request.
   */
  async getAllTokens(options?: ApiClientOptions): Promise<ApiToken[]> {
    return this.rawClient.getAllTokens(options);
  }

  /**
   * Retrieves a contract instance by address and deserializes it into Aztec types.
   *
   * @param address - Contract address to fetch.
   * @param includeArtifact - Whether to include the compiled artifact in the response.
   * @param options - Request options such as fetch cache behaviour.
   * @returns A deserialized contract instance with optional artifact.
   */
  async getContract(
    address: string,
    includeArtifact?: boolean,
    options?: { cache?: RequestCache },
  ): Promise<{ instance: ContractInstanceWithAddress; artifact?: ContractArtifact }> {
    emitLog(this.logger, 'debug', 'client.getContract.start', { scope: 'client', address, includeArtifact });
    const rawResponse = await this.rawClient.getContractRaw(address, includeArtifact, options);
    const { instance, artifact } = apiResponseToContract(rawResponse);
    emitLog(this.logger, 'debug', 'client.getContract.success', {
      scope: 'client',
      address,
      includeArtifact,
      hasArtifact: Boolean(artifact),
    });
    return { instance, artifact };
  }

  /**
   * Retrieves a contract artifact and deserializes it into an Aztec `ContractArtifact`.
   *
   * @param identifier - Contract class ID or artifact hash.
   * @param options - Request options such as fetch cache behaviour.
   * @returns The decoded contract artifact.
   */
  async getArtifact(identifier: string, options?: { cache?: RequestCache }): Promise<ContractArtifact> {
    emitLog(this.logger, 'debug', 'client.getArtifact.start', { scope: 'client', identifier });
    const rawResponse = await this.rawClient.getArtifactRaw(identifier, options);
    const { artifact } = apiResponseToArtifact(rawResponse);
    emitLog(this.logger, 'debug', 'client.getArtifact.success', {
      scope: 'client',
      identifier,
    });
    return artifact;
  }

  /**
   * Uploads a contract artifact.
   *
   * @param artifact - Contract artifact to upload.
   * @param options - Request options such as fetch cache behaviour.
   * @returns The contract class ID associated with the uploaded artifact.
   */
  async uploadContractArtifact(
    artifact: ContractArtifact,
    options?: { cache?: RequestCache },
  ): Promise<{ contractClassId: string }> {
    emitLog(this.logger, 'info', 'client.uploadContractArtifact.start', {
      scope: 'client',
      artifactProvided: true,
    });
    return this.rawClient.uploadContractArtifactRaw(contractArtifactCodec.encode(artifact), options);
  }

  /**
   * Uploads a contract instance along with optional initialization data and artifact.
   *
   * @param params - Object containing:
   *   - instance: Contract instance to upload.
   *   - initializationData: Optional initialization data for the contract.
   *   - artifact: Optional artifact to store alongside the instance.
   * @param options - Request options such as fetch cache behaviour.
   * @returns The deployed address plus current contract class ID.
   */
  async uploadContractInstance(
    {
      instance,
      initializationData,
      artifact,
    }: {
      instance: ContractInstanceWithAddress;
      initializationData?: InitializationData;
      artifact?: ContractArtifact;
    },
    options?: { cache?: RequestCache },
  ): Promise<{ address: string; currentContractClassId: string }> {
    const serializedInstance = serializeContractInstance(instance, initializationData);

    emitLog(this.logger, 'info', 'client.uploadContractInstance.start', {
      scope: 'client',
      contractAddress: String(instance.address),
      hasInitializationData: Boolean(initializationData),
      hasArtifact: Boolean(artifact),
    });

    return this.rawClient.uploadContractInstanceRaw(
      {
        instance: serializedInstance,
        artifact: artifact ? contractArtifactCodec.encode(artifact) : undefined,
      },
      options,
    );
  }

  // Contract address methods
  /**
   * Retrieves a paginated list of contract addresses.
   *
   * @param params - Pagination parameters controlling limit and cursor.
   * @param options - Request options such as fetch cache behaviour.
   * @returns A page of contract addresses together with pagination metadata.
   */
  async getContractAddresses(
    params?: PaginationParams,
    options?: { cache?: RequestCache },
  ): Promise<ContractAddressesResponse> {
    return this.rawClient.getContractAddresses(params, options);
  }

  /**
   * Retrieves contract addresses matching a specific contract class ID.
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
    return this.rawClient.getContractAddressesByClassId(contractClassId, query, options);
  }

  /**
   * Fetches all contract addresses using automatic pagination.
   *
   * @param options - Options including limit, cursor, and cache settings.
   * @returns Every contract address known to the API at the time of the request.
   */
  async getAllContractAddresses(options?: ApiClientOptions): Promise<string[]> {
    return this.rawClient.getAllContractAddresses(options);
  }

  /**
   * Fetches all contract addresses that match a specific contract class ID using automatic pagination.
   *
   * @param contractClassId - Contract class ID to match.
   * @param query - Optional query parameters including match scope.
   * @param options - Options including limit, cursor, and cache settings.
   * @returns Contract addresses whose class matches the provided ID.
   */
  async getAllContractAddressesByClassId(
    contractClassId: string,
    query?: { match?: 'current' | 'original' | 'any' },
    options?: ApiClientOptions,
  ): Promise<string[]> {
    emitLog(this.logger, 'debug', 'client.getAllContractAddressesByClassId.start', {
      scope: 'client',
      contractClassId,
      match: query?.match,
    });
    return this.rawClient.getAllContractAddressesByClassId(contractClassId, query, options);
  }

  // Delegate to raw client's getAllPages implementation
  /**
   * Exposes the underlying pagination helper for advanced scenarios.
   */
  getAllPages: typeof RawApiClient.prototype.getAllPages;
}
