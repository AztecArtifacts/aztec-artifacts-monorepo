[**@aztec-artifacts/client v0.1.8**](../README.md)

***

[@aztec-artifacts/client](../globals.md) / contractToApiRequest

# Function: contractToApiRequest()

> **contractToApiRequest**(`instance`, `initializationData?`, `artifact?`): `object`

Defined in: [packages/client/src/converters.ts:157](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/0d66bcf5b51495a3bdde57d8e87a237933148a62/packages/client/src/converters.ts#L157)

Serializes a contract instance with optional initialization data and artifact into the API request format.

## Parameters

### instance

`ContractInstanceWithAddress`

Contract instance encoded with Aztec types.

### initializationData?

[`InitializationData`](../type-aliases/InitializationData.md)

Optional initialization data for the contract.

### artifact?

`ContractArtifact`

Optional artifact to send alongside the instance.

## Returns

`object`

The payload expected by the contracts upload endpoint.

### artifact?

> `optional` **artifact**: `string`

### instance

> **instance**: `SerializedContractInstance`
