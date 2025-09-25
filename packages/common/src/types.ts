import type { AztecAddress, ContractArtifact, Fr, PublicKeys } from '@aztec/aztec.js';

export type Hex = `0x${string}`;

/**
 * Data required for contract initialization during deployment.
 * Contains optional constructor artifact and encoded arguments for contract setup.
 */
export type InitializationData = {
  constructorName: string;
  encodedArgs?: Fr[];
};

export type SerializedInitializationData = {
  constructorName: string;
  encodedArgs?: Hex[];
};

/**
 * Serialized contract instance payload as consumed/produced by the API.
 */
export interface SerializedContractInstance {
  address: Hex;
  version: number;
  salt: Hex;
  deployer: Hex;
  currentContractClassId: Hex;
  originalContractClassId: Hex;
  initializationHash: Hex;
  publicKeys: Hex;
  initializationData?: SerializedInitializationData;
  artifact?: Hex;
  isToken?: boolean;
}

/**
 * Serialized contract artifact payload as consumed/produced by the API.
 */
export interface SerializedContractArtifact {
  id?: number;
  artifactHash: Hex;
  contractClassId: Hex;
  artifact: Hex;
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
