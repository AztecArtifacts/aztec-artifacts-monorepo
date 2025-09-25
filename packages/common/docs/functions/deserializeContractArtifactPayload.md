[**@aztec-artifacts/common v0.1.1**](../README.md)

***

[@aztec-artifacts/common](../globals.md) / deserializeContractArtifactPayload

# Function: deserializeContractArtifactPayload()

> **deserializeContractArtifactPayload**(`serialized`): [`DeserializedContractArtifact`](../interfaces/DeserializedContractArtifact.md)

Defined in: [packages/common/src/artifact.ts:28](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/7f2d798c102e3fe349e073a7a19d4750cd73ea6c/packages/common/src/artifact.ts#L28)

Deserializes a serialized contract artifact from its API representation into Aztec types.
Converts string representations back into native Aztec types (Fr, ContractArtifact).

## Parameters

### serialized

[`SerializedContractArtifact`](../interfaces/SerializedContractArtifact.md)

The serialized contract artifact from the API containing string representations

## Returns

[`DeserializedContractArtifact`](../interfaces/DeserializedContractArtifact.md)

The deserialized contract artifact with native Aztec types
