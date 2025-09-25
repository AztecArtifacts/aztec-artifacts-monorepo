import type { AztecAddress, ContractInstanceWithAddress, Fr, PublicKeys } from '@aztec/aztec.js';
import { aztecAddressCodec, contractArtifactCodec, frCodec, publicKeysCodec } from './codec.js';
import { SerializationError } from './errors.js';
import type { DeserializedContractInstance, InitializationData, SerializedContractInstance } from './types.js';

/**
 * Serializes a contract instance into the API representation.
 * Converts Aztec types into string representations suitable for API transport.
 *
 * @param instance - The contract instance with address containing native Aztec types
 * @param serializedInitializationData - Optional serialized initialization data for the contract
 * @returns The serialized contract instance with string representations of Aztec types
 * @throws {SerializationError} When serialization of the contract instance fails
 */
export function serializeContractInstance(
  instance: ContractInstanceWithAddress,
  initializationData?: InitializationData,
): SerializedContractInstance {
  try {
    return {
      address: aztecAddressCodec.encode(instance.address),
      version: instance.version,
      salt: frCodec.encode(instance.salt),
      deployer: aztecAddressCodec.encode(instance.deployer),
      currentContractClassId: frCodec.encode(instance.currentContractClassId),
      originalContractClassId: frCodec.encode(instance.originalContractClassId),
      initializationHash: frCodec.encode(instance.initializationHash),
      publicKeys: publicKeysCodec.encode(instance.publicKeys),
      initializationData: initializationData
        ? {
            constructorName: initializationData.constructorName,
            encodedArgs: initializationData.encodedArgs?.map(frCodec.encode),
          }
        : undefined,
    };
  } catch (error) {
    throw new SerializationError(
      `Failed to serialize ContractInstance: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined,
    );
  }
}

/**
 * Deserializes API payload into contract instance components.
 * Converts string representations back into native Aztec types.
 *
 * @param payload - The serialized contract instance payload from the API
 * @returns The deserialized contract instance with native Aztec types
 */
export function deserializeContractInstance(payload: SerializedContractInstance): DeserializedContractInstance {
  return {
    address: aztecAddressCodec.decode(payload.address),
    version: payload.version,
    salt: frCodec.decode(payload.salt),
    deployer: aztecAddressCodec.decode(payload.deployer),
    currentContractClassId: frCodec.decode(payload.currentContractClassId),
    originalContractClassId: frCodec.decode(payload.originalContractClassId),
    initializationHash: frCodec.decode(payload.initializationHash),
    publicKeys: publicKeysCodec.decode(payload.publicKeys),
    initializationData: payload.initializationData
      ? {
          constructorName: payload.initializationData.constructorName,
          encodedArgs: payload.initializationData.encodedArgs?.map(frCodec.decode),
        }
      : undefined,
    artifact: payload.artifact ? contractArtifactCodec.decode(payload.artifact) : undefined,
  };
}

/**
 * Creates a new deserialized contract instance with proper default values.
 * Provides default values for optional contract class IDs when not specified.
 *
 * @param input - The input parameters for creating the contract instance
 * @returns A new deserialized contract instance with all required fields populated
 */
export function createDeserializedContractInstance(input: {
  address: AztecAddress;
  version: number;
  salt: Fr;
  deployer: AztecAddress;
  currentContractClassId?: Fr;
  originalContractClassId?: Fr;
  initializationHash: Fr;
  publicKeys: PublicKeys;
  initializationData?: DeserializedContractInstance['initializationData'];
}): DeserializedContractInstance {
  return {
    address: input.address,
    version: input.version,
    salt: input.salt,
    deployer: input.deployer,
    currentContractClassId: input.currentContractClassId ?? input.salt,
    originalContractClassId: input.originalContractClassId ?? input.salt,
    initializationHash: input.initializationHash,
    publicKeys: input.publicKeys,
    initializationData: input.initializationData,
  };
}
