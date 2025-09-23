import { AztecAddress, Fr, type PublicKeys } from '@aztec/aztec.js';
import { randomContractArtifact } from '@aztec/stdlib/testing';
import type { DbContractArtifact, DbContractInstance } from '@aztec-artifacts/api-common';
import { describe, expect, it } from 'vitest';
import { convertDbArtifactToApi, convertDbContractInstanceToApi } from '../services/contract-service.js';
import { normalizeAddress } from '../utils/response.js';

const ADDRESS = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
const CLASS_ID = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
const HASH = '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321';

const makeDbInstance = (): DbContractInstance => ({
  id: 1,
  address: AztecAddress.fromString(ADDRESS),
  version: 1,
  salt: Fr.fromString(CLASS_ID),
  deployer: AztecAddress.fromString(CLASS_ID),
  currentContractClassId: Fr.fromString(CLASS_ID),
  originalContractClassId: Fr.fromString(CLASS_ID),
  initializationHash: Fr.fromString(HASH),
  publicKeys: {
    toString: () => CLASS_ID,
  } as unknown as PublicKeys,
  initializationData: { constructorArtifact: 'test', constructorArgs: ['param1', 'param2'] },
  createdAt: new Date(),
  updatedAt: new Date(),
});

const makeDbArtifact = (): DbContractArtifact => ({
  id: 99,
  artifactHash: Fr.fromString(HASH),
  artifact: randomContractArtifact(),
  contractClassId: Fr.fromString(CLASS_ID),
  isToken: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('response utils', () => {
  it('normalizes 0x-prefixed addresses to lowercase', () => {
    const input = `0x${ADDRESS.slice(2).toUpperCase()}`;
    expect(normalizeAddress(input)).toBe(ADDRESS);
  });

  it('throws on missing prefix', () => {
    expect(() => normalizeAddress(ADDRESS.slice(2))).toThrow('Invalid address format: must start with 0x');
  });
});

describe('contract conversions', () => {
  it('converts database contract instance to API shape', () => {
    const apiInstance = convertDbContractInstanceToApi(makeDbInstance());

    expect(apiInstance).toMatchObject({
      id: 1,
      address: ADDRESS,
      version: 1,
      initialization_hash: HASH,
      isToken: false,
    });
  });

  it('attaches artifact metadata when provided', () => {
    const artifact = makeDbArtifact();
    const apiInstance = convertDbContractInstanceToApi(makeDbInstance(), true, artifact);

    expect(apiInstance).toMatchObject({
      artifact: expect.stringMatching(/^0x/),
      isToken: true,
    });
  });

  it('converts database artifact to API payload', () => {
    const apiArtifact = convertDbArtifactToApi(makeDbArtifact());

    expect(apiArtifact).toMatchObject({
      id: 99,
      artifact_hash: HASH,
      contract_class_id: CLASS_ID,
      isToken: true,
    });
  });
});
