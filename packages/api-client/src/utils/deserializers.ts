import type { ContractArtifact } from '@aztec/aztec.js';
import { AztecAddress, contractArtifactFromBuffer, Fr, PublicKeys } from '@aztec/aztec.js';
import type { paths } from '../types.js';

// Type aliases from the generated OpenAPI types
type RawContractInstance = paths['/contracts/{address}']['get']['responses']['200']['content']['application/json'];
type RawContractArtifact = paths['/artifacts/{identifier}']['get']['responses']['200']['content']['application/json'];

// Deserialized types that will be returned by the client
export interface DeserializedContractInstance {
  id?: number;
  address: AztecAddress;
  version: number;
  salt: Fr;
  deployer: AztecAddress;
  current_contract_class_id: Fr | null;
  original_contract_class_id: Fr | null;
  initialization_hash: Fr;
  public_keys: PublicKeys;
  initialization_data?: {
    constructorArtifact?: string | null;
    constructorArgs?: unknown[] | null;
  } | null;
  artifact?: ContractArtifact;
}

export interface DeserializedContractArtifact {
  id?: number;
  artifact_hash: Fr;
  contract_class_id: Fr;
  artifact: ContractArtifact;
}

/**
 * Convert hex string to AztecAddress
 * @param hex - Hex string representing an Aztec address
 * @returns AztecAddress instance
 * @throws Error if hex string is invalid
 */
export function hexToAztecAddress(hex: string): AztecAddress {
  try {
    return AztecAddress.fromString(hex);
  } catch (error) {
    throw new Error(`Failed to convert hex string to AztecAddress: ${hex}. ${error}`);
  }
}

/**
 * Convert hex string to Fr (Field element)
 * @param hex - Hex string representing a field element
 * @returns Fr instance
 * @throws Error if hex string is invalid
 */
export function hexToFr(hex: string): Fr {
  try {
    return Fr.fromHexString(hex); // Use fromHexString for Fr, not fromString
  } catch (error) {
    throw new Error(`Failed to convert hex string to Fr: ${hex}. ${error}`);
  }
}

/**
 * Convert public keys object to PublicKeys
 * @param publicKeysObj - Public keys object from API
 * @returns PublicKeys instance
 * @throws Error if object is invalid
 */
export function objectToPublicKeys(publicKeysObj: {
  masterNullifierPublicKey: { x: string; y: string };
  masterIncomingViewingPublicKey: { x: string; y: string };
  masterOutgoingViewingPublicKey: { x: string; y: string };
  masterTaggingPublicKey: { x: string; y: string };
}): PublicKeys {
  try {
    // Convert the structured object format to PublicKeys using the schema
    return PublicKeys.schema.parse(publicKeysObj);
  } catch (error) {
    throw new Error(`Failed to convert object to PublicKeys: ${JSON.stringify(publicKeysObj)}. ${error}`);
  }
}

/**
 * Convert hex string to PublicKeys (for backward compatibility)
 * @param hex - Hex string representing public keys
 * @returns PublicKeys instance
 * @throws Error if hex string is invalid
 */
export function hexToPublicKeys(hex: string): PublicKeys {
  try {
    // For PublicKeys, if stored as hex, we need to parse as JSON first
    const parsed = JSON.parse(hex);
    return PublicKeys.schema.parse(parsed);
  } catch (error) {
    throw new Error(`Failed to convert hex string to PublicKeys: ${hex}. ${error}`);
  }
}

/**
 * Deserialize hex string to ContractArtifact using Aztec's built-in deserialization
 * @param hex - Hex string representation of serialized ContractArtifact
 * @returns ContractArtifact instance
 * @throws Error if hex string is invalid or deserialization fails
 */
export function hexStringToContractArtifact(hex: string): ContractArtifact {
  try {
    const buffer = Buffer.from(hex.replace(/^0x/, ''), 'hex');
    return contractArtifactFromBuffer(buffer);
  } catch (error) {
    throw new Error(`Failed to deserialize contract artifact from hex: ${error}`, { cause: error });
  }
}

/**
 * Deserialize raw contract instance from API to typed Aztec objects
 * @param raw - Raw contract instance from API response
 * @returns Deserialized contract instance with proper Aztec types
 * @throws Error if deserialization fails
 */
export function deserializeContractInstance(raw: RawContractInstance): DeserializedContractInstance {
  try {
    const instance: DeserializedContractInstance = {
      id: raw.id,
      address: hexToAztecAddress(raw.address),
      version: raw.version,
      salt: hexToFr(raw.salt),
      deployer: hexToAztecAddress(raw.deployer),
      current_contract_class_id: raw.current_contract_class_id ? hexToFr(raw.current_contract_class_id) : null,
      original_contract_class_id: raw.original_contract_class_id ? hexToFr(raw.original_contract_class_id) : null,
      initialization_hash: hexToFr(raw.initialization_hash),
      public_keys: hexToPublicKeys(raw.public_keys),
      initialization_data: raw.initialization_data,
    };

    // Parse artifact if present
    if (raw.artifact !== undefined) {
      instance.artifact = hexStringToContractArtifact(raw.artifact);
    }

    return instance;
  } catch (error) {
    throw new Error(`Failed to deserialize contract instance: ${error}`);
  }
}

/**
 * Deserialize raw contract artifact from API to typed Aztec objects
 * @param raw - Raw contract artifact from API response
 * @returns Deserialized contract artifact with proper Aztec types
 * @throws Error if deserialization fails
 */
export function deserializeContractArtifact(raw: RawContractArtifact): DeserializedContractArtifact {
  try {
    return {
      id: raw.id,
      artifact_hash: hexToFr(raw.artifact_hash),
      contract_class_id: hexToFr(raw.contract_class_id),
      artifact: hexStringToContractArtifact(raw.artifact),
    };
  } catch (error) {
    throw new Error(`Failed to deserialize contract artifact: ${error}`);
  }
}
