import { AztecAddress, Fr, PublicKeys } from '@aztec/aztec.js';
import { describe, expect, it } from 'vitest';
import {
  type ContractArtifact,
  type ContractInstance,
  contractArtifacts,
  contractInstances,
  type NewContractArtifact,
  type NewContractInstance,
} from '../../schema/contracts.js';

const hex = (char: string) => `0x${char.repeat(64)}`;

describe('contract schema', () => {
  describe('contract_artifacts table', () => {
    it('defines required columns', () => {
      expect(contractArtifacts.id).toBeDefined();
      expect(contractArtifacts.artifactHash).toBeDefined();
      expect(contractArtifacts.artifact).toBeDefined();
      expect(contractArtifacts.contractClassId).toBeDefined();
      expect(contractArtifacts.createdAt).toBeDefined();
      expect(contractArtifacts.updatedAt).toBeDefined();
    });

    it('uses expected column names', () => {
      expect(contractArtifacts.artifactHash.name).toBe('artifactHash');
      expect(contractArtifacts.contractClassId.name).toBe('contractClassId');
    });

    it('provides ContractArtifact types', () => {
      const artifact: ContractArtifact = {
        id: 1,
        artifactHash: Fr.fromHexString(hex('a')),
        artifact: {
          name: 'TestContract',
          functions: [],
          outputs: { globals: {}, structs: {} },
          storageLayout: {},
          fileMap: {},
          nonDispatchPublicFunctions: [],
        },
        contractClassId: Fr.fromHexString(hex('b')),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(artifact.contractClassId.toString()).toMatch(/^0x/);
    });

    it('provides NewContractArtifact insert types', () => {
      const artifact: NewContractArtifact = {
        artifactHash: Fr.fromHexString(hex('c')),
        artifact: {
          name: 'TestContract',
          functions: [],
          outputs: { globals: {}, structs: {} },
          storageLayout: {},
          fileMap: {},
          nonDispatchPublicFunctions: [],
        },
        contractClassId: Fr.fromHexString(hex('d')),
      };

      expect(artifact.artifact).toMatchObject({ name: 'TestContract' });
    });
  });

  describe('contract_instances table', () => {
    it('defines required columns', () => {
      expect(contractInstances.id).toBeDefined();
      expect(contractInstances.address).toBeDefined();
      expect(contractInstances.version).toBeDefined();
      expect(contractInstances.salt).toBeDefined();
      expect(contractInstances.deployer).toBeDefined();
      expect(contractInstances.originalContractClassId).toBeDefined();
      expect(contractInstances.currentContractClassId).toBeDefined();
      expect(contractInstances.initializationHash).toBeDefined();
      expect(contractInstances.publicKeys).toBeDefined();
      expect(contractInstances.initializationData).toBeDefined();
      expect(contractInstances.createdAt).toBeDefined();
      expect(contractInstances.updatedAt).toBeDefined();
    });

    it('uses expected column names', () => {
      expect(contractInstances.address.name).toBe('address');
      expect(contractInstances.originalContractClassId.name).toBe('originalContractClassId');
      expect(contractInstances.currentContractClassId.name).toBe('currentContractClassId');
      expect(contractInstances.initializationHash.name).toBe('initializationHash');
    });

    it('provides ContractInstance types', async () => {
      const publicKeys = await PublicKeys.random();
      const instance: ContractInstance = {
        id: 1,
        address: AztecAddress.fromString(hex('1')),
        version: 1,
        salt: Fr.fromHexString(hex('2')),
        deployer: AztecAddress.fromString(hex('3')),
        originalContractClassId: Fr.fromHexString(hex('4')),
        currentContractClassId: Fr.fromHexString(hex('5')),
        initializationHash: Fr.fromHexString(hex('6')),
        publicKeys,
        initializationData: {
          constructorArtifact: 'constructor',
          constructorArgs: [],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(instance.initializationData?.constructorArtifact).toBe('constructor');
    });

    it('provides NewContractInstance insert types with optional fields', async () => {
      const publicKeys = await PublicKeys.random();
      const instance: NewContractInstance = {
        address: AztecAddress.fromString(hex('c')),
        version: 1,
        salt: Fr.fromHexString(hex('d')),
        deployer: AztecAddress.fromString(hex('e')),
        currentContractClassId: Fr.fromHexString(hex('f')),
        originalContractClassId: Fr.fromHexString(hex('a')),
        initializationHash: Fr.fromHexString(hex('b')),
        publicKeys,
      };

      expect(instance.address.toString()).toMatch(/^0x/);
      expect(instance.originalContractClassId).toBeDefined();
    });
  });
});
