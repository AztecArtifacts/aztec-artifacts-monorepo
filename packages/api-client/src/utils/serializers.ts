import type { ContractArtifact } from '@aztec/aztec.js';
import { contractArtifactToBuffer } from '@aztec/aztec.js';
import type { paths } from '../types.js';

// Import the Aztec ContractInstance from the deserialized types
import type { DeserializedContractInstance } from './deserializers.js';

/**
 * Error thrown when serialization of Aztec objects fails
 */
export class SerializationError extends Error {
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'SerializationError';
    this.cause = cause;
  }
}

/**
 * Serialize a ContractArtifact to hex string format for API upload
 * @param artifact - The ContractArtifact to serialize
 * @returns Hex string representation suitable for API upload
 * @throws SerializationError if serialization fails
 */
export function serializeContractArtifact(artifact: ContractArtifact): string {
  try {
    const buffer = contractArtifactToBuffer(artifact);
    return `0x${buffer.toString('hex')}`;
  } catch (error) {
    throw new SerializationError(
      `Failed to serialize ContractArtifact: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined,
    );
  }
}

/**
 * Serialize a DeserializedContractInstance to API-compatible format for upload
 * @param instance - The DeserializedContractInstance to serialize
 * @returns Serialized instance data suitable for API upload
 * @throws SerializationError if serialization fails
 */
export function serializeContractInstance(
  instance: DeserializedContractInstance,
): paths['/contracts']['post']['requestBody']['content']['application/json']['instance'] {
  try {
    return {
      address: instance.address.toString(),
      version: instance.version,
      salt: instance.salt.toString(),
      deployer: instance.deployer.toString(),
      current_contract_class_id: instance.current_contract_class_id?.toString() || instance.address.toString(),
      original_contract_class_id: instance.original_contract_class_id?.toString() || instance.address.toString(),
      initialization_hash: instance.initialization_hash.toString(),
      public_keys: instance.public_keys.toString(),
      initialization_data: instance.initialization_data || null,
    };
  } catch (error) {
    throw new SerializationError(
      `Failed to serialize ContractInstance: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined,
    );
  }
}
