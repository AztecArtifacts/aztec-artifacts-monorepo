import { AztecAddress, type ContractArtifact, Fr, type PublicKeys } from '@aztec/aztec.js';
import { getContractClassFromArtifact } from '@aztec/stdlib/contract';
import {
  aztecAddressCodec,
  contractArtifactCodec,
  frCodec,
  type Hex,
  isHex,
  publicKeysCodec,
} from '@aztec-artifacts/common';
import {
  contractArtifacts,
  contractInstances,
  type DbClient,
  type DbContractArtifact,
  type DbContractInstance,
  functionSelectors,
} from '@aztec-artifacts/schema';
import { and, asc, eq, gt, or } from 'drizzle-orm';
import type {
  apiContractArtifact,
  apiContractClassInstanceMatch,
  apiContractInstance,
  UploadContractInstance,
} from '../schemas/contracts.js';
import type { BasicLogger } from '../utils/logging.js';
import { createDbMetricTags, recordDbMetrics, recordErrorMetrics } from '../utils/metrics.js';
import { getSelectorsAndSignatureFromArtifact } from '../utils/selectors.js';
import { isToken } from '../utils/tokens.js';
import {
  addSpanAttributes,
  createDbSpanAttributes,
  createServiceSpanAttributes,
  recordSpanError,
  withSpan,
} from '../utils/tracing.js';

type UploadContractInstancePayload = UploadContractInstance['instance'];

export enum ContractInstanceError {
  MissingArtifactData = 'Missing currentContractClassId or artifact data',
  ArtifactMismatch = 'Current contract class ID does not match uploaded artifact',
  MissingCurrentArtifact = 'Contract artifact not found for current contract class ID',
  MissingOriginalArtifact = 'Contract artifact not found for original contract class ID',
}

function parsePublicKeysInput(input: UploadContractInstancePayload['publicKeys']): PublicKeys {
  try {
    if (!isHex(input)) {
      throw new Error('Public keys must be a hex string');
    }
    return publicKeysCodec.decode(input);
  } catch (error) {
    throw new Error('Failed to deserialize public keys', { cause: error });
  }
}

export function convertDbContractInstanceToApi(
  dbInstance: DbContractInstance,
  includeArtifact?: boolean,
  artifact?: DbContractArtifact,
): apiContractInstance {
  return {
    id: dbInstance.id,
    address: aztecAddressCodec.encode(dbInstance.address),
    version: dbInstance.version,
    salt: frCodec.encode(dbInstance.salt),
    deployer: aztecAddressCodec.encode(dbInstance.deployer),
    currentContractClassId: frCodec.encode(dbInstance.currentContractClassId),
    originalContractClassId: frCodec.encode(dbInstance.originalContractClassId),
    initializationHash: frCodec.encode(dbInstance.initializationHash),
    publicKeys: publicKeysCodec.encode(dbInstance.publicKeys),
    initializationData: dbInstance.initializationData
      ? {
          constructorName: dbInstance.initializationData.constructorName,
          encodedArgs: dbInstance.initializationData.encodedArgs?.map(frCodec.encode),
        }
      : undefined,
    artifact: includeArtifact && artifact ? contractArtifactCodec.encode(artifact.artifact) : undefined,
    isToken: artifact?.isToken ?? false,
  };
}

export function convertDbArtifactToApi(dbArtifact: DbContractArtifact): apiContractArtifact {
  return {
    id: dbArtifact.id,
    artifactHash: frCodec.encode(dbArtifact.artifactHash),
    artifact: contractArtifactCodec.encode(dbArtifact.artifact),
    contractClassId: frCodec.encode(dbArtifact.contractClassId),
    isToken: dbArtifact.isToken ?? false,
  };
}

export class ContractService {
  constructor(
    private db: DbClient,
    private logger: BasicLogger,
  ) {}

  async getContractInstance(address: AztecAddress | string): Promise<DbContractInstance | null> {
    return withSpan(
      {
        name: 'ContractService.getContractInstance',
        attributes: createServiceSpanAttributes('getContractInstance', 'contract_instances'),
      },
      async (span) => {
        const startTime = performance.now();

        const aztecAddress = typeof address === 'string' ? AztecAddress.fromString(address) : address;

        // Add span attributes for operation context
        addSpanAttributes({
          'contract.address': aztecAddress.toString(),
        });

        try {
          const result = await withSpan(
            {
              name: 'db.query.contract_instances.select_by_address',
              attributes: createDbSpanAttributes(
                'select',
                'contract_instances',
                'SELECT * FROM contract_instances WHERE address = ?',
              ),
            },
            async () => {
              return this.db
                .select()
                .from(contractInstances)
                .where(eq(contractInstances.address, aztecAddress))
                .limit(1);
            },
          );

          const instance = result[0] || null;
          const duration = performance.now() - startTime;

          // Record metrics
          recordDbMetrics(createDbMetricTags('select', 'contract_instances'), duration);

          // Add result attributes to span
          addSpanAttributes({
            'api.found': instance ? 'true' : 'false',
            'api.duration_ms': duration.toString(),
          });

          return instance;
        } catch (error) {
          // Record error metrics and span
          recordErrorMetrics('contract_service_error');
          recordSpanError(error, span);
          throw error;
        }
      },
    );
  }

  async getContractArtifactByInstance(instance: DbContractInstance): Promise<DbContractArtifact | null> {
    if (!instance.currentContractClassId) {
      return null;
    }

    const result = await this.db
      .select()
      .from(contractArtifacts)
      .where(eq(contractArtifacts.contractClassId, instance.currentContractClassId))
      .limit(1);

    return result[0] || null;
  }

  async getContractArtifact(identifier: Fr | string): Promise<DbContractArtifact | null> {
    const frIdentifier = typeof identifier === 'string' ? Fr.fromString(identifier) : identifier;
    const result = await this.db
      .select()
      .from(contractArtifacts)
      .where(or(eq(contractArtifacts.contractClassId, frIdentifier), eq(contractArtifacts.artifactHash, frIdentifier)))
      .limit(1);

    return result[0] || null;
  }

  async getContractAddresses(
    cursor = 0,
    limit = 100,
  ): Promise<{ addresses: string[]; hasMore: boolean; items: Array<{ id: number; address: string }> }> {
    const conditions = cursor > 0 ? [gt(contractInstances.id, cursor)] : [];

    const result = await this.db
      .select({
        id: contractInstances.id,
        address: contractInstances.address,
      })
      .from(contractInstances)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(contractInstances.id))
      .limit(limit + 1);

    const hasMore = result.length > limit;
    const items = (hasMore ? result.slice(0, -1) : result).map((row: { id: number; address: AztecAddress }) => ({
      id: row.id,
      address: aztecAddressCodec.encode(row.address),
    }));

    return {
      addresses: items.map((item) => item.address),
      hasMore,
      items,
    };
  }

  async getContractInstancesByClassId(
    contractClassId: Fr | string,
    matchScope: apiContractClassInstanceMatch,
    cursor = 0,
    limit = 100,
  ): Promise<{ addresses: string[]; hasMore: boolean; items: Array<{ id: number; address: string }> }> {
    const classId = typeof contractClassId === 'string' ? Fr.fromString(contractClassId) : contractClassId;

    const conditions = [];

    // Add cursor condition if provided
    if (cursor > 0) {
      conditions.push(gt(contractInstances.id, cursor));
    }

    // Add match scope condition
    const matchCondition =
      matchScope === 'any'
        ? or(
            eq(contractInstances.currentContractClassId, classId),
            eq(contractInstances.originalContractClassId, classId),
          )
        : matchScope === 'current'
          ? eq(contractInstances.currentContractClassId, classId)
          : eq(contractInstances.originalContractClassId, classId);

    conditions.push(matchCondition);

    const result = await this.db
      .select({
        id: contractInstances.id,
        address: contractInstances.address,
      })
      .from(contractInstances)
      .where(and(...conditions))
      .orderBy(asc(contractInstances.id))
      .limit(limit + 1);

    const hasMore = result.length > limit;
    const items = (hasMore ? result.slice(0, -1) : result).map((row: { id: number; address: AztecAddress }) => ({
      id: row.id,
      address: aztecAddressCodec.encode(row.address),
    }));

    return {
      addresses: items.map((item) => item.address),
      hasMore,
      items,
    };
  }

  async createContractInstance(payload: UploadContractInstance): Promise<{
    instance: DbContractInstance;
    artifact: DbContractArtifact | null;
    created: boolean;
  }> {
    // TODO: Validate that the contract address provided matches the address from computeContractAddressFromInstance()
    // TODO: Validate initializationData is correct by manually computing the hash with `computeInitializationHash` and comparing to the provided initializationHash

    const { instance, artifact } = payload;
    const address = AztecAddress.fromString(instance.address);
    const existingInstance = await this.getContractInstance(address);

    if (existingInstance) {
      const existingArtifact = await this.getContractArtifactByInstance(existingInstance);
      return { instance: existingInstance, artifact: existingArtifact, created: false };
    }

    const currentContractClassId = Fr.fromHexString(instance.currentContractClassId);
    const originalContractClassId = Fr.fromHexString(instance.originalContractClassId);
    let artifactForResponse: DbContractArtifact | null = null;

    if (artifact !== undefined) {
      // If the artifact is provided, we should ensure it matches one of the contract class IDs.
      if (!isHex(artifact)) {
        throw new Error('Artifact must be a valid hex string');
      }
      artifactForResponse = await this.createContractArtifact(artifact);

      if (
        currentContractClassId.equals(artifactForResponse.contractClassId) === false &&
        originalContractClassId.equals(artifactForResponse.contractClassId) === false
      ) {
        throw new Error(ContractInstanceError.ArtifactMismatch);
      }
    }

    if (!artifactForResponse?.contractClassId.equals(currentContractClassId)) {
      // Either no artifact was provided or it does not match the current contract class ID, so we need to fetch it
      try {
        artifactForResponse = await this.getContractArtifact(currentContractClassId);
        if (!artifactForResponse) {
          throw new Error(ContractInstanceError.MissingCurrentArtifact);
        }
      } catch (error) {
        if ((error as Error).message === ContractInstanceError.MissingCurrentArtifact) {
          throw error;
        }
        throw new Error(ContractInstanceError.MissingArtifactData, { cause: error });
      }
    }
    // At this point we have a valid artifact for the current contract class ID

    const publicKeys = parsePublicKeysInput(instance.publicKeys);

    // Convert encodedArgs from hex strings to Fr objects for storage
    const initData = instance.initializationData
      ? {
          constructorName: instance.initializationData.constructorName,
          encodedArgs: instance.initializationData.encodedArgs?.map((hex) => Fr.fromHexString(hex)) ?? null,
        }
      : null;

    // Validate hex strings before decoding
    if (!isHex(instance.salt)) {
      throw new Error('Salt must be a valid hex string');
    }
    if (!isHex(instance.deployer)) {
      throw new Error('Deployer must be a valid hex string');
    }
    if (!isHex(instance.initializationHash)) {
      throw new Error('Initialization hash must be a valid hex string');
    }

    const [createdInstance] = await this.db
      .insert(contractInstances)
      .values({
        address,
        version: instance.version ?? 1, // Default to version 1 if not provided -- this is what is hardcoded in aztec packages
        salt: frCodec.decode(instance.salt),
        deployer: aztecAddressCodec.decode(instance.deployer),
        currentContractClassId,
        originalContractClassId,
        initializationHash: frCodec.decode(instance.initializationHash),
        publicKeys,
        initializationData: initData,
      })
      .returning();

    if (!createdInstance) {
      throw new Error('Failed to create contract instance');
    }

    return {
      instance: createdInstance,
      artifact: artifactForResponse,
      created: true,
    };
  }

  async createContractArtifact(hex: Hex): Promise<DbContractArtifact> {
    // TODO: We should extract the constructor function ABIs and store them separately to enable using it for initialization data encoding/decoding

    const artifact = contractArtifactCodec.decode(hex);

    // Extract contract class information
    const contractClass = await getContractClassFromArtifact(artifact);

    // Check if artifact already exists
    const existing = await this.getContractArtifact(contractClass.id);
    if (existing) {
      return existing;
    }

    // Convert to Aztec objects for database storage
    const contractClassId = contractClass.id;
    const artifactHash = contractClass.artifactHash;

    // Detect if this artifact is a token contract
    const isTokenContract = await isToken(artifact, this.logger);

    // Insert new artifact into database
    const result = await this.db
      .insert(contractArtifacts)
      .values({
        contractClassId,
        artifactHash,
        artifact,
        isToken: isTokenContract,
      })
      .returning();

    if (!result[0]) {
      throw new Error('Failed to create contract artifact');
    }

    await this.persistFunctionSelectors(artifact);

    return result[0];
  }

  async testConnection(): Promise<DbContractInstance[]> {
    return this.db.select().from(contractInstances).limit(1);
  }

  private async persistFunctionSelectors(artifact: ContractArtifact): Promise<void> {
    const selectors = await getSelectorsAndSignatureFromArtifact(artifact);
    if (!selectors.length) {
      return;
    }

    const rows = selectors.map(({ selector, signature }) => ({
      selector: selector.toString().toLowerCase(),
      signature,
    }));

    await this.db
      .insert(functionSelectors)
      .values(rows)
      .onConflictDoNothing({ target: [functionSelectors.selector, functionSelectors.signature] });
  }
}
