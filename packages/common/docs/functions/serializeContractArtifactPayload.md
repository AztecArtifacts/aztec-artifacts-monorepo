[**@aztec-artifacts/common v0.1.4**](../README.md)

***

[@aztec-artifacts/common](../globals.md) / serializeContractArtifactPayload

# Function: serializeContractArtifactPayload()

> **serializeContractArtifactPayload**(`artifact`): [`SerializedContractArtifact`](../interfaces/SerializedContractArtifact.md)

Defined in: [packages/common/src/artifact.ts:11](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/09243ac3d2ea1e7f4337eb88bcbd33142b8243d2/packages/common/src/artifact.ts#L11)

Serializes a deserialized contract artifact into its API representation.
Converts Aztec types (Fr, ContractArtifact) into string representations suitable for API transport.

## Parameters

### artifact

[`DeserializedContractArtifact`](../interfaces/DeserializedContractArtifact.md)

The deserialized contract artifact containing Aztec types

## Returns

[`SerializedContractArtifact`](../interfaces/SerializedContractArtifact.md)

The serialized contract artifact with string representations of Aztec types
