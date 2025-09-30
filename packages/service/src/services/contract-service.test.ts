import { AztecAddress, Fr, PublicKeys } from '@aztec/aztec.js';
import { FunctionSelector } from '@aztec/stdlib/abi';
import { getContractClassFromArtifact } from '@aztec/stdlib/contract';
import { randomContractArtifact, randomContractInstanceWithAddress } from '@aztec/stdlib/testing';
import { contractArtifactCodec } from '@aztec-artifacts/common';
import {
  contractArtifacts,
  contractInstances,
  type DbClient,
  type DbContractArtifact,
  type DbContractInstance,
  functionSelectors,
} from '@aztec-artifacts/schema';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UploadContractInstance } from '../schemas/contracts.js';
import type { BasicLogger } from '../utils/logging.js';
import { getSelectorsAndSignatureFromArtifact } from '../utils/selectors.js';
import { isToken } from '../utils/tokens.js';
import { ContractInstanceError, ContractService } from './contract-service.js';

vi.mock('@aztec/stdlib/contract', () => ({
  getContractClassFromArtifact: vi.fn(),
}));
vi.mock('../utils/tokens.js', () => ({
  isToken: vi.fn(),
}));
vi.mock('../utils/selectors.js', () => ({
  getSelectorsAndSignatureFromArtifact: vi.fn(),
}));

const mockLogger: BasicLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

describe('ContractService.createContractInstance', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a new contract instance when artifact data is provided', async () => {
    const address = await AztecAddress.random();
    const salt = Fr.random();
    const deployer = await AztecAddress.random();
    const classId = Fr.random();
    const initHash = Fr.random();
    const artifactHash = Fr.random();
    const publicKeys = await PublicKeys.random();

    const mockDbInstance: DbContractInstance = {
      id: 1,
      address,
      version: 1,
      salt,
      deployer,
      currentContractClassId: classId,
      originalContractClassId: classId,
      initializationHash: initHash,
      publicKeys,
      initializationData: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockArtifact: DbContractArtifact = {
      id: 99,
      isToken: false,
      contractClassId: classId,
      artifactHash,
      artifact: randomContractArtifact(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const returningMock = vi.fn().mockResolvedValue([mockDbInstance]);
    const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
    const insertMock = vi.fn().mockReturnValue({ values: valuesMock });

    const mockDb = { insert: insertMock } as unknown as DbClient;
    const service = new ContractService(mockDb, mockLogger);

    vi.spyOn(service, 'getContractInstance').mockResolvedValue(null);
    vi.spyOn(service, 'getContractArtifact').mockResolvedValue(null);
    vi.spyOn(service, 'createContractArtifact').mockResolvedValue(mockArtifact);

    const payload: UploadContractInstance = {
      instance: {
        address: address.toString(),
        version: 1,
        salt: salt.toString(),
        deployer: deployer.toString(),
        currentContractClassId: classId.toString(),
        originalContractClassId: classId.toString(),
        initializationHash: initHash.toString(),
        publicKeys: publicKeys.toString(),
        initializationData: null,
      },
      artifact: `0x${Buffer.from(JSON.stringify(randomContractArtifact())).toString('hex')}`,
    };

    const result = await service.createContractInstance(payload);

    expect(result.created).toBe(true);
    expect(result.instance).toBe(mockDbInstance);
    expect(result.artifact).toBe(mockArtifact);

    expect(insertMock).toHaveBeenCalledWith(contractInstances);
    expect(valuesMock).toHaveBeenCalledTimes(1);

    const insertedValues = valuesMock.mock.calls[0]?.[0];
    expect(insertedValues).toMatchObject({ version: 1, initializationData: null });
    expect(insertedValues.address.toString().toLowerCase()).toBe(address.toString().toLowerCase());
    expect(insertedValues.currentContractClassId.toString().toLowerCase()).toBe(classId.toString().toLowerCase());
    expect(insertedValues.publicKeys.toString().toLowerCase()).toBe(publicKeys.toString().toLowerCase());
  });

  it('throws when missing artifact data', async () => {
    const mockDb = { insert: vi.fn() } as unknown as DbClient;
    const service = new ContractService(mockDb, mockLogger);
    vi.spyOn(service, 'getContractInstance').mockResolvedValue(null);

    const contractClassId = Fr.random();
    const randomInstance = await randomContractInstanceWithAddress({ contractClassId });

    const payload: UploadContractInstance = {
      instance: {
        address: randomInstance.address.toString(),
        salt: randomInstance.salt.toString(),
        deployer: randomInstance.deployer.toString(),
        initializationHash: randomInstance.initializationHash.toString(),
        publicKeys: randomInstance.publicKeys.toString(),
        currentContractClassId: randomInstance.currentContractClassId.toString(),
        originalContractClassId: randomInstance.originalContractClassId.toString(),
        version: 1,
        initializationData: null,
      },
    };

    await expect(service.createContractInstance(payload)).rejects.toThrow(ContractInstanceError.MissingArtifactData);
  });
});

describe('ContractService.createContractArtifact', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stores artifacts, detects tokens, and persists unique function selectors', async () => {
    const artifact = randomContractArtifact();
    const serializedArtifact = contractArtifactCodec.encode(artifact);
    const classId = Fr.random();
    const artifactHash = Fr.random();
    const selectorEntry = {
      selector: FunctionSelector.fromString('0xaabbccdd'),
      signature: 'transfer(field,field)',
    };

    const mockDbArtifact: DbContractArtifact = {
      id: 1,
      isToken: true,
      contractClassId: classId,
      artifactHash,
      artifact,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const contractArtifactsReturningMock = vi.fn().mockResolvedValue([mockDbArtifact]);
    const contractArtifactsValuesMock = vi.fn().mockReturnValue({ returning: contractArtifactsReturningMock });
    const functionSelectorsOnConflictMock = vi.fn().mockResolvedValue(undefined);
    const functionSelectorsValuesMock = vi.fn().mockReturnValue({
      onConflictDoNothing: functionSelectorsOnConflictMock,
    });

    const insertMock = vi.fn((table) => {
      if (table === contractArtifacts) {
        return { values: contractArtifactsValuesMock };
      }
      if (table === functionSelectors) {
        return { values: functionSelectorsValuesMock };
      }
      throw new Error('Unexpected table');
    });

    const mockDb = { insert: insertMock } as unknown as DbClient;
    const service = new ContractService(mockDb, mockLogger);

    vi.spyOn(service, 'getContractArtifact').mockResolvedValue(null);
    vi.mocked(getContractClassFromArtifact).mockResolvedValue({
      id: classId,
      artifactHash,
    } as unknown as Awaited<ReturnType<typeof getContractClassFromArtifact>>);
    vi.mocked(isToken).mockResolvedValue(true);
    vi.mocked(getSelectorsAndSignatureFromArtifact).mockResolvedValue([selectorEntry]);

    const result = await service.createContractArtifact(serializedArtifact);

    expect(result).toEqual(mockDbArtifact);
    expect(contractArtifactsValuesMock).toHaveBeenCalledWith({
      contractClassId: classId,
      artifactHash,
      artifact,
      isToken: true,
    });
    expect(functionSelectorsValuesMock).toHaveBeenCalledWith([
      {
        selector: selectorEntry.selector.toString().toLowerCase(),
        signature: selectorEntry.signature,
      },
    ]);
    expect(functionSelectorsOnConflictMock).toHaveBeenCalledWith({
      target: [functionSelectors.selector, functionSelectors.signature],
    });
  });
});
