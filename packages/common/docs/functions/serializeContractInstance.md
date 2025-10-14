[**@aztec-artifacts/common v0.1.12**](../README.md)

***

[@aztec-artifacts/common](../globals.md) / serializeContractInstance

# Function: serializeContractInstance()

> **serializeContractInstance**(`instance`, `initializationData?`): [`SerializedContractInstance`](../interfaces/SerializedContractInstance.md)

Defined in: [packages/common/src/contract-instance.ts:16](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/72c76eb715c9da93e4d433a37c7fb832d47d5145/packages/common/src/contract-instance.ts#L16)

Serializes a contract instance into the API representation.
Converts Aztec types into string representations suitable for API transport.

## Parameters

### instance

`ContractInstanceWithAddress`

The contract instance with address containing native Aztec types

### initializationData?

[`InitializationData`](../type-aliases/InitializationData.md)

Optional initialization data for the contract containing the constructor name and
arguments encoded with `encodeArguments()` from `@aztec/aztec.js`

## Returns

[`SerializedContractInstance`](../interfaces/SerializedContractInstance.md)

The serialized contract instance with string representations of Aztec types

## Throws

When serialization of the contract instance fails
