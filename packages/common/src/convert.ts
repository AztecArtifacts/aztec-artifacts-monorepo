import { AztecAddress, Fr, PublicKeys } from '@aztec/aztec.js';
import { DeserializationError } from './errors.js';
import type { Hex } from './types.js';

/**
 * Converts an AztecAddress to its hex string representation.
 *
 * @param address - The AztecAddress to convert
 * @returns The hex string representation of the address
 */
export function aztecAddressToHexString(address: AztecAddress): Hex {
  return address.toString();
}

/**
 * Converts a hex string to an AztecAddress.
 *
 * @param hex - The hex string to convert to an AztecAddress
 * @returns The AztecAddress created from the hex string
 * @throws {DeserializationError} When the hex string is invalid or cannot be converted
 */
export function hexStringToAztecAddress(hex: Hex): AztecAddress {
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
 * Converts an Fr field element to its hex string representation.
 *
 * @param fr - The Fr field element to convert
 * @returns The hex string representation of the field element
 */
export function frToHexString(fr: Fr): Hex {
  return fr.toString();
}

/**
 * Converts a hex string to an Fr field element.
 *
 * @param hex - The hex string to convert to an Fr field element
 * @returns The Fr field element created from the hex string
 * @throws {DeserializationError} When the hex string is invalid or cannot be converted
 */
export function hexStringToFr(hex: Hex): Fr {
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
 * Converts PublicKeys to their hex string representation.
 *
 * @param publicKeys - The PublicKeys to convert
 * @returns The hex string representation of the public keys
 */
export function publicKeysToHexString(publicKeys: PublicKeys): Hex {
  return publicKeys.toString();
}

/**
 * Converts a hex string to PublicKeys.
 * Accepts either JSON stringified representation or raw hex string format.
 *
 * @param hex - The hex string to convert to PublicKeys (JSON or raw hex format)
 * @returns The PublicKeys created from the hex string
 * @throws {DeserializationError} When the input cannot be converted to PublicKeys
 */
export function hexStringToPublicKeys(hex: Hex): PublicKeys {
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
