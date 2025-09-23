import type { ContractArtifact } from '@aztec/aztec.js';
import { AztecAddress, contractArtifactFromBuffer, contractArtifactToBuffer, Fr, PublicKeys } from '@aztec/aztec.js';
import { jsonParseWithSchema, jsonStringify } from '@aztec/foundation/json-rpc';

/**
 * Convert AztecAddress to hex string representation
 * @param address - The AztecAddress to convert
 * @returns Hex string representation of the address
 */
export function aztecAddressToHexString(address: AztecAddress): string {
  return address.toString();
}

/**
 * Convert hex string to AztecAddress
 * @param hex - The hex string to convert
 * @returns AztecAddress instance
 */
export function hexStringToAztecAddress(hex: string): AztecAddress {
  return AztecAddress.fromString(hex);
}

/**
 * Convert Fr to hex string representation
 * @param fr - The Fr to convert
 * @returns Hex string representation of the Fr
 */
export function frToHexString(fr: Fr): string {
  return fr.toString();
}

/**
 * Convert hex string to Fr
 * @param hex - The hex string to convert
 * @returns Fr instance
 */
export function hexStringToFr(hex: string): Fr {
  return Fr.fromString(hex);
}

export function publicKeysToHexString(publicKeys: PublicKeys): string {
  return publicKeys.toString();
}

export function hexStringToPublicKeys(hex: string): PublicKeys {
  return PublicKeys.fromString(hex);
}

/**
 * Convert PublicKeys to JSON string representation
 * @param publicKeys - The PublicKeys to convert
 * @returns JSON string representation of the public keys
 */
export function publicKeysToJsonString(publicKeys: PublicKeys): string {
  return jsonStringify(publicKeys);
}

/**
 * Convert JSON string to PublicKeys
 * @param json - The JSON string to convert
 * @returns PublicKeys instance
 */
export function jsonStringToPublicKeys(json: string): PublicKeys {
  return jsonParseWithSchema(json, PublicKeys.schema);
}

/**
 * Serialize a ContractArtifact to hex string
 * Uses Aztec's built-in contractArtifactToBuffer function for reliable serialization
 * @param artifact - The ContractArtifact to serialize
 * @returns Hex string representation
 */
export function contractArtifactToHexString(artifact: ContractArtifact): `0x${string}` {
  return `0x${contractArtifactToBuffer(artifact).toString('hex')}`;
}

/**
 * Deserialize hex string to ContractArtifact
 * Uses Aztec's built-in contractArtifactFromBuffer function for reliable deserialization
 * @param hex - The hex string to deserialize
 * @returns ContractArtifact
 */
export function hexStringToContractArtifact(hex: `0x${string}`): ContractArtifact {
  const buffer = Buffer.from(hex.replace(/^0x/, ''), 'hex');
  return contractArtifactFromBuffer(buffer);
}
