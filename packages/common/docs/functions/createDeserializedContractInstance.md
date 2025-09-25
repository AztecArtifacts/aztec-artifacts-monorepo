[**@aztec-artifacts/common v0.1.1**](../README.md)

***

[@aztec-artifacts/common](../globals.md) / createDeserializedContractInstance

# Function: createDeserializedContractInstance()

> **createDeserializedContractInstance**(`input`): [`DeserializedContractInstance`](../interfaces/DeserializedContractInstance.md)

Defined in: [packages/common/src/contract-instance.ts:79](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/7f2d798c102e3fe349e073a7a19d4750cd73ea6c/packages/common/src/contract-instance.ts#L79)

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
