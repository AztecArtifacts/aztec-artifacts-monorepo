import { AztecAddress, Fr, PublicKeys } from '@aztec/aztec.js';
import { describe, it } from 'vitest';
import {
  aztecAddressToHexString,
  frToHexString,
  hexStringToAztecAddress,
  hexStringToFr,
  hexStringToPublicKeys,
  publicKeysToHexString,
} from '../convert.js';
import { expectError, testHexRoundTrip } from './test-utils.js';

describe('convert helpers', () => {
  it('round-trips AztecAddress to hex and back', async () => {
    const address = await AztecAddress.random();
    testHexRoundTrip('AztecAddress', address, aztecAddressToHexString, hexStringToAztecAddress);
  });

  it('round-trips Fr to hex and back', () => {
    const field = Fr.random();
    testHexRoundTrip('Fr', field, frToHexString, hexStringToFr);
  });

  it('round-trips PublicKeys between hex and object representations', async () => {
    const keys = await PublicKeys.random();
    testHexRoundTrip('PublicKeys', keys, publicKeysToHexString, hexStringToPublicKeys);
  });

  it('throws descriptive error for invalid PublicKeys input', () => {
    expectError(() => hexStringToPublicKeys('not-a-valid-key'), /Failed to convert input to PublicKeys/);
  });

  it('throws descriptive error for invalid AztecAddress hex', () => {
    expectError(() => hexStringToAztecAddress('0x123'), /Failed to convert hex string to AztecAddress/);
  });

  it('throws descriptive error for invalid Fr hex', () => {
    expectError(() => hexStringToFr('0xzz'), /Failed to convert hex string to Fr/);
  });
});
