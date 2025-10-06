[**@aztec-artifacts/common v0.1.9**](../README.md)

***

[@aztec-artifacts/common](../globals.md) / deserializeContractInstance

# Function: deserializeContractInstance()

> **deserializeContractInstance**(`payload`): [`DeserializedContractInstance`](../interfaces/DeserializedContractInstance.md)

Defined in: [packages/common/src/contract-instance.ts:52](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/ef31ffd2afa41161bfdd3fd3f3544970461d5d1f/packages/common/src/contract-instance.ts#L52)

Deserializes API payload into contract instance components.
Converts string representations back into native Aztec types.

## Parameters

### payload

[`SerializedContractInstance`](../interfaces/SerializedContractInstance.md)

The serialized contract instance payload from the API

## Returns

[`DeserializedContractInstance`](../interfaces/DeserializedContractInstance.md)

The deserialized contract instance with native Aztec types
