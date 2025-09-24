import { Fr } from '@aztec/aztec.js';
import { randomContractInstanceWithAddress } from '@aztec/stdlib/testing';
import { describe, expect, it } from 'vitest';
import { aztecAddressCodec, frCodec, publicKeysCodec } from '../codec.js';
import { deserializeContractInstance, serializeContractInstance } from '../contract-instance.js';
import type { InitializationData } from '../types.js';

describe('contract instance codec', () => {
  it('round-trips serialized contract instance', async () => {
    const initData: InitializationData = {
      constructorName: 'constructor',
      encodedArgs: [Fr.fromHexString('0x00000000000000000000000000000000000000000000000000000000deadbeef')],
    };
    const instance = await randomContractInstanceWithAddress();

    const serialized = serializeContractInstance(instance, initData);
    expect(serialized).toMatchObject({
      address: aztecAddressCodec.encode(instance.address),
      salt: frCodec.encode(instance.salt),
      publicKeys: publicKeysCodec.encode(instance.publicKeys),
      initializationData: {
        constructorName: 'constructor',
        encodedArgs: ['0x00000000000000000000000000000000000000000000000000000000deadbeef'],
      },
    });

    const deserialized = deserializeContractInstance(serialized);

    expect(deserialized.address.equals(instance.address)).toBe(true);
    expect(deserialized.salt.equals(instance.salt)).toBe(true);
    expect(deserialized.deployer.equals(instance.deployer)).toBe(true);
    expect(deserialized.currentContractClassId.equals(instance.currentContractClassId)).toBe(true);
    expect(deserialized.originalContractClassId.equals(instance.originalContractClassId)).toBe(true);
    expect(deserialized.initializationHash.equals(instance.initializationHash)).toBe(true);
    expect(deserialized.publicKeys.toString()).toBe(instance.publicKeys.toString());
    expect(deserialized.initializationData?.constructorName).toEqual(initData.constructorName);
    // biome-ignore lint/style/noNonNullAssertion: we defined it above
    expect(deserialized.initializationData?.encodedArgs?.[0]?.equals(initData.encodedArgs?.[0]!) ?? false).toBe(true);
  });
});
