[**@aztec-artifacts/common v0.1.5**](../README.md)

***

[@aztec-artifacts/common](../globals.md) / createDeserializedContractInstance

# Function: createDeserializedContractInstance()

> **createDeserializedContractInstance**(`input`): [`DeserializedContractInstance`](../interfaces/DeserializedContractInstance.md)

Defined in: [packages/common/src/contract-instance.ts:79](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/417432ce1b59173b0e3bda5a305c620082db2477/packages/common/src/contract-instance.ts#L79)

Creates a new deserialized contract instance with proper default values.
Provides default values for optional contract class IDs when not specified.

## Parameters

### input

The input parameters for creating the contract instance

#### address

`AztecAddress`

#### currentContractClassId?

`Fr`

#### deployer

`AztecAddress`

#### initializationData?

[`InitializationData`](../type-aliases/InitializationData.md)

#### initializationHash

`Fr`

#### originalContractClassId?

`Fr`

#### publicKeys

`PublicKeys`

#### salt

`Fr`

#### version

`number`

## Returns

[`DeserializedContractInstance`](../interfaces/DeserializedContractInstance.md)

A new deserialized contract instance with all required fields populated
