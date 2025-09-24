import type { AztecAddress, ContractInstanceWithAddress, Fr, PublicKeys } from '@aztec/aztec.js';
import { aztecAddressCodec, contractArtifactCodec, frCodec, publicKeysCodec } from './codec.js';
import { SerializationError } from './errors.js';
import type { DeserializedContractInstance, InitializationData } from './types.js';

/**
 * Serialize a contract instance into the API representation.
 */
export function serializeContractInstance(
  instance: ContractInstanceWithAddress,
  initializationData?: InitializationData,
) {
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
      initializationData: initializationData,
    };
  } catch (error) {
    throw new SerializationError(
      `Failed to serialize ContractInstance: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined,
    );
  }
}

/**
 * Deserialize API payload into contract instance components.
 */
export function deserializeContractInstance(payload: {
  address: string;
  version: number;
  salt: string;
  deployer: string;
  currentContractClassId: string;
  originalContractClassId: string;
  initializationHash: string;
  publicKeys: string;
  initializationData?: InitializationData;
  artifact?: string;
}): DeserializedContractInstance {
  return {
    address: aztecAddressCodec.decode(payload.address),
    version: payload.version,
    salt: frCodec.decode(payload.salt),
    deployer: aztecAddressCodec.decode(payload.deployer),
    currentContractClassId: frCodec.decode(payload.currentContractClassId),
    originalContractClassId: frCodec.decode(payload.originalContractClassId),
    initializationHash: frCodec.decode(payload.initializationHash),
    publicKeys: publicKeysCodec.decode(payload.publicKeys),
    initializationData: payload.initializationData,
    artifact: payload.artifact ? contractArtifactCodec.decode(payload.artifact) : undefined,
  };
}

/**
 * Create a new deserialized contract instance.
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
