import type { ContractArtifact, ContractInstanceWithAddress } from '@aztec/aztec.js';
import type { Hex, SerializedInitializationData } from '@aztec-artifacts/common';
import {
  contractArtifactCodec,
  deserializeContractArtifactPayload,
  deserializeContractInstance,
  type InitializationData,
  isHex,
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
  // Validate all hex fields in the response
  const hexFields = [
    'address',
    'salt',
    'deployer',
    'currentContractClassId',
    'originalContractClassId',
    'initializationHash',
    'publicKeys',
  ] as const;
  for (const field of hexFields) {
    if (!isHex(response[field])) {
      throw new Error(`Invalid ${field}: ${response[field]} is not a valid hex string`);
    }
  }

  // Validate artifact if present
  if (response.artifact && !isHex(response.artifact)) {
    throw new Error('Invalid artifact: artifact is not a valid hex string');
  }

  // Validate and transform initialization data if present
  let initializationData: SerializedInitializationData | undefined;
  if (response.initializationData) {
    const encodedArgs = response.initializationData.encodedArgs;
    if (encodedArgs) {
      // Validate all args are hex strings
      if (!encodedArgs.every(isHex)) {
        throw new Error('Invalid initialization data: encodedArgs must be hex strings');
      }
    }
    initializationData = {
      ...response.initializationData,
      encodedArgs: encodedArgs as Hex[] | undefined,
    };
  }

  // Create validated response with proper types
  const validatedResponse = {
    ...response,
    address: response.address as Hex,
    salt: response.salt as Hex,
    deployer: response.deployer as Hex,
    currentContractClassId: response.currentContractClassId as Hex,
    originalContractClassId: response.originalContractClassId as Hex,
    initializationHash: response.initializationHash as Hex,
    publicKeys: response.publicKeys as Hex,
    artifact: response.artifact ? (response.artifact as Hex) : undefined,
    initializationData,
  };

  // Deserialize the core contract instance data
  const deserialized = deserializeContractInstance(validatedResponse);

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
    artifactHash: Hex;
    contractClassId: Hex;
    isToken?: boolean;
  };
} {
  // Validate hex fields
  if (!isHex(response.artifactHash)) {
    throw new Error(`Invalid artifactHash: ${response.artifactHash} is not a valid hex string`);
  }
  if (!isHex(response.contractClassId)) {
    throw new Error(`Invalid contractClassId: ${response.contractClassId} is not a valid hex string`);
  }
  if (!isHex(response.artifact)) {
    throw new Error('Invalid artifact: artifact is not a valid hex string');
  }

  const validatedResponse = {
    ...response,
    artifactHash: response.artifactHash as Hex,
    contractClassId: response.contractClassId as Hex,
    artifact: response.artifact as Hex,
  };

  const { artifact } = deserializeContractArtifactPayload(validatedResponse);

  return {
    artifact,
    metadata: {
      id: response.id,
      artifactHash: response.artifactHash as Hex,
      contractClassId: response.contractClassId as Hex,
      isToken: response.isToken,
    },
  };
}

/**
 * Serializes a contract instance with optional initialization data and artifact into the API request format.
 *
 * @param instance - Contract instance encoded with Aztec types.
 * @param initializationData - Optional initialization data for the contract.
 * @param artifact - Optional artifact to send alongside the instance.
 * @returns The payload expected by the contracts upload endpoint.
 */
export function contractToApiRequest(
  instance: ContractInstanceWithAddress,
  initializationData?: InitializationData,
  artifact?: ContractArtifact,
): {
  instance: ReturnType<typeof serializeContractInstance>;
  artifact?: string;
} {
  const serializedInstance = serializeContractInstance(instance, initializationData);

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
