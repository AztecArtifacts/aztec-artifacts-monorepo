import { Fr } from '@aztec/aztec.js';
import { randomContractArtifact } from '@aztec/stdlib/testing';
import { describe, expect, it } from 'vitest';
import { deserializeContractArtifactPayload, serializeContractArtifactPayload } from '../artifact.js';
import { contractArtifactCodec } from '../codec.js';

describe('contract artifact codec', () => {
  it('round-trips contract artifact serialization to hex', async () => {
    const artifact = randomContractArtifact();

    const serialized = contractArtifactCodec.encode(artifact);
    expect(serialized).toMatch(/^0x[0-9a-f]+$/i);

    const deserialized = contractArtifactCodec.decode(serialized);
    expect(deserialized).toEqual(artifact);
  });

  it('serializes and deserializes artifact payloads', async () => {
    const artifact = randomContractArtifact();
    const artifactHash = Fr.random();
    const contractClassId = Fr.random();

    const payload = serializeContractArtifactPayload({
      id: 42,
      artifactHash: artifactHash,
      contractClassId: contractClassId,
      artifact,
      isToken: true,
    });

    expect(payload).toMatchObject({
      id: 42,
      artifactHash: expect.stringMatching(/^0x/),
      contractClassId: expect.stringMatching(/^0x/),
      artifact: expect.stringMatching(/^[0-9a-f]+/),
      isToken: true,
    });

    const roundTripped = deserializeContractArtifactPayload(payload);
    expect(roundTripped.id).toBe(42);
    expect(roundTripped.isToken).toBe(true);
    expect(roundTripped.artifact).toEqual(artifact);
    expect(roundTripped.artifactHash.equals(artifactHash)).toBe(true);
    expect(roundTripped.contractClassId.equals(contractClassId)).toBe(true);
  });

  it('throws SerializationError on invalid hex input', () => {
    expect(() => contractArtifactCodec.decode('0xZZ')).toThrow();
  });
});
