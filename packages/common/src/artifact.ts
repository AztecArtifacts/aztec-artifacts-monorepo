import { contractArtifactCodec, frCodec } from './codec.js';
import type { DeserializedContractArtifact, SerializedContractArtifact } from './types.js';

/**
 * Serializes a deserialized contract artifact into its API representation.
 * Converts Aztec types (Fr, ContractArtifact) into string representations suitable for API transport.
 *
 * @param artifact - The deserialized contract artifact containing Aztec types
 * @returns The serialized contract artifact with string representations of Aztec types
 */
export function serializeContractArtifactPayload(artifact: DeserializedContractArtifact): SerializedContractArtifact {
  return {
    id: artifact.id,
    artifactHash: frCodec.encode(artifact.artifactHash),
    contractClassId: frCodec.encode(artifact.contractClassId),
    artifact: contractArtifactCodec.encode(artifact.artifact),
    isToken: artifact.isToken,
  };
}

/**
 * Deserializes a serialized contract artifact from its API representation into Aztec types.
 * Converts string representations back into native Aztec types (Fr, ContractArtifact).
 *
 * @param serialized - The serialized contract artifact from the API containing string representations
 * @returns The deserialized contract artifact with native Aztec types
 */
export function deserializeContractArtifactPayload(
  serialized: SerializedContractArtifact,
): DeserializedContractArtifact {
  return {
    id: serialized.id,
    artifactHash: frCodec.decode(serialized.artifactHash),
    contractClassId: frCodec.decode(serialized.contractClassId),
    artifact: contractArtifactCodec.decode(serialized.artifact),
    isToken: serialized.isToken,
  };
}
