import type { ContractArtifact, ContractInstanceWithAddress } from '@aztec/aztec.js';
import {
  contractArtifactCodec,
  deserializeContractArtifactPayload,
  deserializeContractInstance,
  serializeContractInstance,
} from '@aztec-artifacts/common';
import type { ApiContractArtifact, ApiContractInstance } from './raw-client.js';

/**
 * Converts an API contract instance response to Aztec types while preserving metadata.
 *
 * @param response - Raw API payload returned from the contracts endpoint.
 * @returns A deserialized contract instance alongside optional artifact and metadata.
 */
export function apiResponseToContract(response: ApiContractInstance): {
  instance: ContractInstanceWithAddress;
  artifact?: ContractArtifact;
  metadata: {
    id?: number;
    isToken?: boolean;
  };
} {
  // Deserialize the core contract instance data
  const deserialized = deserializeContractInstance({
    ...response,
    initializationData: response.initializationData
      ? {
          constructorArtifact: response.initializationData.constructorArtifact ?? undefined,
          constructorArgs: response.initializationData.constructorArgs ?? undefined,
        }
      : undefined,
  });

  // Build the ContractInstanceWithAddress
  const instance: ContractInstanceWithAddress = {
    address: deserialized.address,
    currentContractClassId: deserialized.currentContractClassId,
    originalContractClassId: deserialized.originalContractClassId,
    initializationHash: deserialized.initializationHash,
    publicKeys: deserialized.publicKeys,
    salt: deserialized.salt,
    deployer: deserialized.deployer,
    version: 1, // version is hardcoded as 1 per aztec stdlib/src/contract/contract_instance.ts
  };

  return {
    instance,
    artifact: deserialized.artifact,
    metadata: {
      id: response.id,
      isToken: response.isToken,
    },
  };
}

/**
 * Converts an API artifact response to an Aztec `ContractArtifact` while preserving metadata.
 *
 * @param response - Raw API payload returned from the artifacts endpoint.
 * @returns A deserialized contract artifact and its metadata.
 */
export function apiResponseToArtifact(response: ApiContractArtifact): {
  artifact: ContractArtifact;
  metadata: {
    id?: number;
    artifactHash: string;
    contractClassId: string;
    isToken?: boolean;
  };
} {
  const { artifact } = deserializeContractArtifactPayload(response);

  return {
    artifact,
    metadata: {
      id: response.id,
      artifactHash: response.artifactHash,
      contractClassId: response.contractClassId,
      isToken: response.isToken,
    },
  };
}

/**
 * Serializes a contract instance (and optional artifact) into the API request format.
 *
 * @param instance - Contract instance encoded with Aztec types.
 * @param artifact - Optional artifact to send alongside the instance.
 * @returns The payload expected by the contracts upload endpoint.
 */
export function contractToApiRequest(
  instance: ContractInstanceWithAddress,
  artifact?: ContractArtifact,
): {
  instance: ReturnType<typeof serializeContractInstance>;
  artifact?: string;
} {
  const serializedInstance = serializeContractInstance(instance);

  const requestBody: {
    instance: ReturnType<typeof serializeContractInstance>;
    artifact?: string;
  } = {
    instance: serializedInstance,
  };

  if (artifact) {
    requestBody.artifact = contractArtifactCodec.encode(artifact);
  }

  return requestBody;
}

/**
 * Serializes a contract artifact into the API request payload.
 *
 * @param artifact - Contract artifact to encode for transport.
 * @returns The payload expected by the artifacts upload endpoint.
 */
export function artifactToApiRequest(artifact: ContractArtifact): {
  artifact: string;
} {
  return {
    artifact: contractArtifactCodec.encode(artifact),
  };
}
