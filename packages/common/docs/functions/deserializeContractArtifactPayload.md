[**@aztec-artifacts/common v0.1.10**](../README.md)

***

[@aztec-artifacts/common](../globals.md) / deserializeContractArtifactPayload

# Function: deserializeContractArtifactPayload()

> **deserializeContractArtifactPayload**(`serialized`): [`DeserializedContractArtifact`](../interfaces/DeserializedContractArtifact.md)

Defined in: [packages/common/src/artifact.ts:28](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/4aed2b8153191d3cffbb11f350271ba328c64602/packages/common/src/artifact.ts#L28)

Deserializes a serialized contract artifact from its API representation into Aztec types.
Converts string representations back into native Aztec types (Fr, ContractArtifact).

## Parameters

### serialized

[`SerializedContractArtifact`](../interfaces/SerializedContractArtifact.md)

The serialized contract artifact from the API containing string representations

## Returns

[`DeserializedContractArtifact`](../interfaces/DeserializedContractArtifact.md)

The deserialized contract artifact with native Aztec types
