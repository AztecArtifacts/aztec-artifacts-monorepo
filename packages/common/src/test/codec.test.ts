import { AztecAddress, type ContractArtifact, Fr, PublicKeys } from '@aztec/aztec.js';
import { describe, it } from 'vitest';
import { aztecAddressCodec, contractArtifactCodec, frCodec, publicKeysCodec } from '../codec.js';
import { testRoundTrip } from './test-utils.js';

describe('Codecs', () => {
  it('should round-trip an AztecAddress', async () => {
    const address = await AztecAddress.random();
    testRoundTrip(
      'AztecAddress',
      address,
      (v) => aztecAddressCodec.encode(v),
      (v) => aztecAddressCodec.decode(v),
    );
  });

  it('should round-trip an Fr', () => {
    const field = Fr.random();
    testRoundTrip(
      'Fr',
      field,
      (v) => frCodec.encode(v),
      (v) => frCodec.decode(v),
    );
  });

  it('should round-trip PublicKeys', async () => {
    const keys = await PublicKeys.random();
    testRoundTrip(
      'PublicKeys',
      keys,
      (v) => publicKeysCodec.encode(v),
      (v) => publicKeysCodec.decode(v),
    );
  });

  it('should round-trip a ContractArtifact', () => {
    const artifact: ContractArtifact = {
      name: 'MyContract',
      functions: [],
      fileMap: {},
      storageLayout: {},
      nonDispatchPublicFunctions: [],
      outputs: {
        structs: {},
        globals: {},
      },
    };
    testRoundTrip(
      'ContractArtifact',
      artifact,
      (v) => contractArtifactCodec.encode(v),
      (v) => contractArtifactCodec.decode(v),
    );
  });
});
