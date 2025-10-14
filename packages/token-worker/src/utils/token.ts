import {
  AztecAddress,
  type AztecNode,
  type ContractArtifact,
  type ContractInstanceWithAddress,
  type FunctionCall,
  FunctionSelector,
  type NodeInfo,
  readFieldCompressedString,
} from '@aztec/aztec.js';
import type { BlockHeader } from '@aztec/stdlib/tx';
import type { DbClient, DbContractArtifact, DbContractInstance } from '@aztec-artifacts/schema';
import { contractArtifacts, contractInstances } from '@aztec-artifacts/schema';
import { eq } from 'drizzle-orm';
import { getFunctionAbi } from './abi.js';
import type { Logger } from './logger.js';
import { createTxFromPublicCalls, getNodeInfo } from './public-tx.js';

export async function fetchInstanceAndArtifact(
  address: string,
  db: DbClient,
  logger: Logger,
): Promise<{ instance: ContractInstanceWithAddress; artifact: ContractArtifact }> {
  logger.debug({ address }, 'Fetching contract instance and artifact');

  const dbInstance = await db
    .select()
    .from(contractInstances)
    .where(eq(contractInstances.address, AztecAddress.fromString(address)))
    .limit(1);
  if (dbInstance.length === 0 || !dbInstance[0]) {
    throw new Error(`Contract instance not found for address: ${address}`);
  }
  const dbArtifact = await db
    .select()
    .from(contractArtifacts)
    .where(eq(contractArtifacts.contractClassId, dbInstance[0].currentContractClassId))
    .limit(1);
  if (dbArtifact.length === 0 || !dbArtifact[0]) {
    throw new Error(`Contract artifact not found for class ID: ${dbInstance[0].currentContractClassId}`);
  }
  return convertDbContractInstanceAndArtifact(dbInstance[0], dbArtifact[0]);
}

export async function convertDbContractInstanceAndArtifact(
  dbInstance: DbContractInstance,
  dbArtifact: DbContractArtifact,
): Promise<{ instance: ContractInstanceWithAddress; artifact: ContractArtifact }> {
  const instance: ContractInstanceWithAddress = {
    address: dbInstance.address,
    salt: dbInstance.salt,
    deployer: dbInstance.deployer,
    currentContractClassId: dbInstance.currentContractClassId,
    originalContractClassId: dbInstance.originalContractClassId,
    initializationHash: dbInstance.initializationHash,
    publicKeys: dbInstance.publicKeys,
    version: 1, // version is hardcoded as 1 per aztec stdlib/src/contract/contract_instance.ts
  };

  const artifact: ContractArtifact = dbArtifact.artifact;

  return { instance, artifact };
}

const TOKEN_METADATA_SELECTORS = {
  decimals: FunctionSelector.fromString('0x6bff8f59'),
  name: FunctionSelector.fromString('0x5c5c9c42'),
  symbol: FunctionSelector.fromString('0x62cc9647'),
} as const;

type MetadataFieldName = keyof typeof TOKEN_METADATA_SELECTORS;

export interface TokenMetadata {
  name: string | null;
  symbol: string | null;
  decimals: number | null;
}

/**
 * Fetch a single metadata field from the blockchain
 */
export async function fetchMetadataField(
  aztecNode: AztecNode,
  instance: ContractInstanceWithAddress,
  artifact: ContractArtifact,
  fieldName: MetadataFieldName,
  nodeInfo: { info: NodeInfo; blockHeader: BlockHeader },
  logger: Logger,
): Promise<string | number | null> {
  try {
    logger.debug({ fieldName, to: instance.address.toString() }, `Preparing to fetch ${fieldName}`);

    const functionAbi = getFunctionAbi(artifact, fieldName);
    const computedSelector = await FunctionSelector.fromNameAndParameters({
      name: functionAbi.name,
      parameters: functionAbi.parameters,
    });

    const expectedSelector = TOKEN_METADATA_SELECTORS[fieldName];
    if (!computedSelector.equals(expectedSelector)) {
      throw new Error(
        `Computed selector ${computedSelector.toString()} does not match expected ${expectedSelector.toString()}`,
      );
    }

    const call: FunctionCall = {
      name: fieldName,
      to: instance.address,
      selector: expectedSelector,
      args: [],
      type: functionAbi.functionType,
      isStatic: functionAbi.isStatic,
      returnTypes: functionAbi.returnTypes,
    };

    // Execute the simulation for this single field
    logger.debug({ fieldName, to: instance.address.toString() }, `Fetching ${fieldName} from blockchain`);
    const tx = await createTxFromPublicCalls(aztecNode, [call], nodeInfo);
    const result = await aztecNode.simulatePublicCalls(tx, true);

    if (
      result.publicReturnValues.length === 0 ||
      !result.publicReturnValues[0] ||
      result.publicReturnValues[0].values === undefined
    ) {
      throw new Error('No return values from simulation');
    }
    const values = result.publicReturnValues[0].values;

    if (values.length === 0 || !values[0]) {
      throw new Error('Empty return value from simulation');
    }

    // Parse based on field type
    if (fieldName === 'decimals') {
      return values[0].toNumber();
    }
    return readFieldCompressedString(values[0]);
  } catch (error) {
    logger.warn({ fieldName, error }, `Failed to fetch ${fieldName}`);
    return null;
  }
}

/**
 * Fetch token metadata from the blockchain
 */
export async function fetchTokenMetadataFromBlockchain(
  address: string,
  aztecNode: AztecNode,
  db: DbClient,
  logger: Logger,
): Promise<TokenMetadata> {
  logger.debug({ address }, 'Fetching token metadata from blockchain');

  const { instance, artifact } = await fetchInstanceAndArtifact(address, db, logger);

  // Fetch node info once for all metadata calls
  const nodeInfo = await getNodeInfo(aztecNode);

  // Fetch all metadata fields in parallel
  const [decimals, name, symbol] = await Promise.all([
    fetchMetadataField(aztecNode, instance, artifact, 'decimals', nodeInfo, logger),
    fetchMetadataField(aztecNode, instance, artifact, 'name', nodeInfo, logger),
    fetchMetadataField(aztecNode, instance, artifact, 'symbol', nodeInfo, logger),
  ]);

  return {
    name: typeof name === 'string' ? name : null,
    symbol: typeof symbol === 'string' ? symbol : null,
    decimals: typeof decimals === 'number' ? decimals : null,
  };
}
