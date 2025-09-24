import { contractArtifactCodec, frCodec } from './codec.js';
import type { DeserializedContractArtifact, SerializedContractArtifact } from './types.js';

export function serializeContractArtifactPayload(artifact: DeserializedContractArtifact): SerializedContractArtifact {
  return {
    id: artifact.id,
    artifactHash: frCodec.encode(artifact.artifactHash),
    contractClassId: frCodec.encode(artifact.contractClassId),
    artifact: contractArtifactCodec.encode(artifact.artifact),
    isToken: artifact.isToken,
  };
}

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
