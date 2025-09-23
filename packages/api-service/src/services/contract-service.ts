import { AztecAddress, Fr, PublicKeys } from '@aztec/aztec.js';
import { contractArtifactFromBuffer } from '@aztec/stdlib/abi';
import { getContractClassFromArtifact } from '@aztec/stdlib/contract';
import {
  aztecAddressToHexString,
  contractArtifacts,
  contractArtifactToHexString,
  contractInstances,
  type DbClient,
  type DbContractArtifact,
  type DbContractInstance,
  frToHexString,
  hexStringToAztecAddress,
  hexStringToFr,
  hexStringToPublicKeys,
  publicKeysToHexString,
} from '@aztec-artifacts/api-common';
import { eq, or } from 'drizzle-orm';
import type {
  apiContractArtifact,
  apiContractClassInstanceMatch,
  apiContractInstance,
  UploadContractInstance,
} from '../schemas/contracts.js';
import { createDbMetricTags, recordDbMetrics, recordErrorMetrics } from '../utils/metrics.js';
import { isToken } from '../utils/tokens.js';
import {
  addSpanAttributes,
  createDbSpanAttributes,
  createServiceSpanAttributes,
  recordSpanError,
  withSpan,
} from '../utils/tracing.js';

const ZERO_HEX_256 = `0x${'0'.repeat(64)}`;

type UploadContractInstancePayload = UploadContractInstance['instance'];

export enum ContractInstanceError {
  MissingArtifactData = 'Missing current_contract_class_id or artifact data',
  ArtifactMismatch = 'Current contract class ID does not match uploaded artifact',
  MissingCurrentArtifact = 'Contract artifact not found for current contract class ID',
  MissingOriginalArtifact = 'Contract artifact not found for original contract class ID',
}

function parsePublicKeysInput(input: UploadContractInstancePayload['public_keys']): PublicKeys {
  if (typeof input === 'string') {
    try {
      return hexStringToPublicKeys(input);
    } catch (error) {
      try {
        const parsed = JSON.parse(input);
        return PublicKeys.schema.parse(parsed);
      } catch (parseError) {
        throw new Error('Invalid public keys string format', { cause: parseError ?? error });
      }
    }
  }

  try {
    return PublicKeys.schema.parse(input);
  } catch (error) {
    throw new Error('Invalid public keys object format', { cause: error });
  }
}

export function convertDbContractInstanceToApi(
  dbInstance: DbContractInstance,
  includeArtifact?: boolean,
  artifact?: DbContractArtifact,
): apiContractInstance {
  const instance: apiContractInstance = {
    id: dbInstance.id,
    address: aztecAddressToHexString(dbInstance.address),
    version: dbInstance.version,
    salt: frToHexString(dbInstance.salt),
    deployer: aztecAddressToHexString(dbInstance.deployer),
    current_contract_class_id: dbInstance.currentContractClassId
      ? frToHexString(dbInstance.currentContractClassId)
      : ZERO_HEX_256,
    original_contract_class_id: dbInstance.originalContractClassId
      ? frToHexString(dbInstance.originalContractClassId)
      : ZERO_HEX_256,
    initialization_hash: frToHexString(dbInstance.initializationHash),
    public_keys: publicKeysToHexString(dbInstance.publicKeys),
    initialization_data: dbInstance.initializationData as
      | {
          constructorArtifact?: string | null;
          constructorArgs?: unknown[] | null;
        }
      | null
      | undefined,
    artifact: includeArtifact && artifact ? contractArtifactToHexString(artifact.artifact) : undefined,
    isToken: artifact?.isToken ?? false,
  };

  return instance;
}

export function convertDbArtifactToApi(dbArtifact: DbContractArtifact): apiContractArtifact {
  return {
    id: dbArtifact.id,
    artifact_hash: frToHexString(dbArtifact.artifactHash),
    artifact: contractArtifactToHexString(dbArtifact.artifact),
    contract_class_id: frToHexString(dbArtifact.contractClassId),
    isToken: dbArtifact.isToken ?? false,
  };
}

export class ContractService {
  constructor(private db: DbClient) {}

  async getContractInstance(address: AztecAddress | string): Promise<DbContractInstance | null> {
    return withSpan(
      {
        name: 'ContractService.getContractInstance',
        attributes: createServiceSpanAttributes('getContractInstance', 'contract_instances'),
      },
      async (span) => {
        const startTime = performance.now();

        if (typeof address === 'string') {
          // biome-ignore lint/style/noParameterAssign: convenience
          address = AztecAddress.fromString(address);
        }

        // Add span attributes for operation context
        addSpanAttributes({
          'contract.address': address.toString(),
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
                .where(eq(contractInstances.address, address as AztecAddress))
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
    if (typeof identifier === 'string') {
      // biome-ignore lint/style/noParameterAssign: convenience
      identifier = Fr.fromString(identifier);
    }
    const result = await this.db
      .select()
      .from(contractArtifacts)
      .where(or(eq(contractArtifacts.contractClassId, identifier), eq(contractArtifacts.artifactHash, identifier)))
      .limit(1);

    return result[0] || null;
  }

  async getContractInstancesByClassId(
    contractClassId: Fr | string,
    matchScope: apiContractClassInstanceMatch,
  ): Promise<string[]> {
    if (typeof contractClassId === 'string') {
      // biome-ignore lint/style/noParameterAssign: convenience
      contractClassId = Fr.fromString(contractClassId);
    }
    const whereCondition =
      matchScope === 'any'
        ? or(
            eq(contractInstances.currentContractClassId, contractClassId),
            eq(contractInstances.originalContractClassId, contractClassId),
          )
        : matchScope === 'current'
          ? eq(contractInstances.currentContractClassId, contractClassId)
          : eq(contractInstances.originalContractClassId, contractClassId);

    const result = await this.db
      .select({ address: contractInstances.address })
      .from(contractInstances)
      .where(whereCondition);

    return result.map((row) => aztecAddressToHexString(row.address));
  }

  async createContractInstance(payload: UploadContractInstance): Promise<{
    instance: DbContractInstance;
    artifact: DbContractArtifact | null;
    created: boolean;
  }> {
    const { instance, artifact } = payload;
    const address = AztecAddress.fromString(instance.address);
    const existingInstance = await this.getContractInstance(address);

    if (existingInstance) {
      const existingArtifact = await this.getContractArtifactByInstance(existingInstance);
      return { instance: existingInstance, artifact: existingArtifact, created: false };
    }

    const currentContractClassId = Fr.fromHexString(instance.current_contract_class_id);
    const originalContractClassId = Fr.fromHexString(instance.original_contract_class_id);
    let artifactForResponse: DbContractArtifact | null = null;

    if (artifact !== undefined) {
      // If the artifact is provided, we should ensure it matches one of the contract class IDs.
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

    const publicKeys = parsePublicKeysInput(instance.public_keys);
    const [createdInstance] = await this.db
      .insert(contractInstances)
      .values({
        address,
        version: instance.version ?? 1, // Default to version 1 if not provided -- this is what is hardcoded in aztec packages
        salt: hexStringToFr(instance.salt),
        deployer: hexStringToAztecAddress(instance.deployer),
        currentContractClassId,
        originalContractClassId,
        initializationHash: hexStringToFr(instance.initialization_hash),
        publicKeys,
        initializationData: instance.initialization_data ?? null,
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

  async createContractArtifact(hex: string): Promise<DbContractArtifact> {
    // Parse the artifact to ensure it's valid
    const artifact = contractArtifactFromBuffer(Buffer.from(hex.replace(/^0x/, ''), 'hex'));

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
    const isTokenContract = await isToken(artifact);

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

    return result[0];
  }

  async testConnection(): Promise<DbContractInstance[]> {
    return this.db.select().from(contractInstances).limit(1);
  }
}
