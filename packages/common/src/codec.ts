import type { AztecAddress, ContractArtifact, Fr, PublicKeys } from '@aztec/aztec.js';
import { contractArtifactFromBuffer, contractArtifactToBuffer } from '@aztec/aztec.js';
import {
  aztecAddressToHexString,
  frToHexString,
  hexStringToAztecAddress,
  hexStringToFr,
  hexStringToPublicKeys,
  publicKeysToHexString,
} from './convert.js';
import type { Hex } from './types.js';

/**
 * A generic interface for encoding and decoding data types between their in-memory representation
 * and a serialized format.
 * @template T - The in-memory type (e.g., AztecAddress).
 * @template S - The serialized type (e.g., Hex).
 */
export interface Codec<T, S> {
  /**
   * Encodes a value from its in-memory representation to its serialized format.
   * @param value - The value to encode.
   * @returns The encoded value.
   */
  encode(value: T): S;

  /**
   * Decodes a value from its serialized format to its in-memory representation.
   * @param value - The value to decode.
   * @returns The decoded value.
   */
  decode(value: S): T;
}

/**
 * A codec for encoding and decoding AztecAddress objects.
 * Encodes to and from a hex string representation.
 */
export const aztecAddressCodec: Codec<AztecAddress, Hex> = {
  encode: aztecAddressToHexString,
  decode: hexStringToAztecAddress,
};

/**
 * A codec for encoding and decoding Fr objects.
 * Encodes to and from a hex string representation.
 */
export const frCodec: Codec<Fr, Hex> = {
  encode: frToHexString,
  decode: hexStringToFr,
};

/**
 * A codec for encoding and decoding PublicKeys objects.
 * Encodes to and from a hex string representation.
 */
export const publicKeysCodec: Codec<PublicKeys, Hex> = {
  encode: publicKeysToHexString,
  decode: hexStringToPublicKeys,
};

/**
 * A codec for encoding and decoding ContractArtifact objects.
 * Encodes to and from a JSON string, which is then hex-encoded.
 */
export const contractArtifactCodec: Codec<ContractArtifact, Hex> = {
  encode: (artifact: ContractArtifact) => `0x${contractArtifactToBuffer(artifact).toString('hex')}`,
  decode: (hex: Hex) => contractArtifactFromBuffer(Buffer.from(hex.replace(/^0x/, ''), 'hex')),
};
