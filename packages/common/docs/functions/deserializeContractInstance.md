[**@aztec-artifacts/common v0.1.8**](../README.md)

***

[@aztec-artifacts/common](../globals.md) / deserializeContractInstance

# Function: deserializeContractInstance()

> **deserializeContractInstance**(`payload`): [`DeserializedContractInstance`](../interfaces/DeserializedContractInstance.md)

Defined in: [packages/common/src/contract-instance.ts:52](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/0d66bcf5b51495a3bdde57d8e87a237933148a62/packages/common/src/contract-instance.ts#L52)

Deserializes API payload into contract instance components.
Converts string representations back into native Aztec types.

## Parameters

### payload

[`SerializedContractInstance`](../interfaces/SerializedContractInstance.md)

The serialized contract instance payload from the API

## Returns

[`DeserializedContractInstance`](../interfaces/DeserializedContractInstance.md)

The deserialized contract instance with native Aztec types
