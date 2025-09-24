import { AztecAddress, Fr, PublicKeys } from '@aztec/aztec.js';
import { DeserializationError } from './errors.js';

/**
 * Convert AztecAddress to hex string representation.
 */
export function aztecAddressToHexString(address: AztecAddress): string {
  return address.toString();
}

/**
 * Convert hex string to AztecAddress.
 * @throws {DeserializationError} if hex string is invalid.
 */
export function hexStringToAztecAddress(hex: string): AztecAddress {
  try {
    return AztecAddress.fromString(hex);
  } catch (error) {
    throw new DeserializationError(
      `Failed to convert hex string to AztecAddress: ${hex}`,
      error instanceof Error ? error : undefined,
    );
  }
}

/**
 * Convert Fr to hex string representation.
 */
export function frToHexString(fr: Fr): string {
  return fr.toString();
}

/**
 * Convert hex string to Fr.
 * @throws {DeserializationError} if hex string is invalid.
 */
export function hexStringToFr(hex: string): Fr {
  try {
    return Fr.fromHexString(hex);
  } catch (error) {
    throw new DeserializationError(
      `Failed to convert hex string to Fr: ${hex}`,
      error instanceof Error ? error : undefined,
    );
  }
}

/**
 * Convert PublicKeys to hex string representation.
 */
export function publicKeysToHexString(publicKeys: PublicKeys): string {
  return publicKeys.toString();
}

/**
 * Convert hex string to PublicKeys.
 * Accepts either JSON stringified representation or raw hex string.
 * @throws {DeserializationError} if conversion fails.
 */
export function hexStringToPublicKeys(hex: string): PublicKeys {
  try {
    const parsed = JSON.parse(hex);
    return PublicKeys.schema.parse(parsed);
  } catch {
    try {
      return PublicKeys.fromString(hex);
    } catch (error) {
      throw new DeserializationError(
        'Failed to convert input to PublicKeys',
        error instanceof Error ? error : undefined,
      );
    }
  }
}
