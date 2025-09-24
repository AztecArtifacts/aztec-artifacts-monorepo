import type { AztecAddress, ContractArtifact, Fr, PublicKeys } from '@aztec/aztec.js';

export type InitializationData = {
  constructorArtifact?: string;
  constructorArgs?: unknown[];
};

/**
 * Serialized contract instance payload as consumed/produced by the API.
 */
export interface SerializedContractInstance {
  address: string;
  version: number;
  salt: string;
  deployer: string;
  currentContractClassId: string;
  originalContractClassId: string;
  initializationHash: string;
  publicKeys: string;
  initializationData?: InitializationData;
  artifact?: string;
  isToken?: boolean;
}

/**
 * Serialized contract artifact payload as consumed/produced by the API.
 */
export interface SerializedContractArtifact {
  id?: number;
  artifactHash: string;
  contractClassId: string;
  artifact: string;
  isToken?: boolean;
}

/**
 * Deserialized contract instance representation using Aztec types.
 */
export interface DeserializedContractInstance {
  id?: number;
  address: AztecAddress;
  version: number;
  salt: Fr;
  deployer: AztecAddress;
  currentContractClassId: Fr;
  originalContractClassId: Fr;
  initializationHash: Fr;
  publicKeys: PublicKeys;
  initializationData?: InitializationData;
  artifact?: ContractArtifact;
  isToken?: boolean;
}

/**
 * Deserialized contract artifact representation using Aztec types.
 */
export interface DeserializedContractArtifact {
  id?: number;
  artifactHash: Fr;
  contractClassId: Fr;
  artifact: ContractArtifact;
  isToken?: boolean;
}
