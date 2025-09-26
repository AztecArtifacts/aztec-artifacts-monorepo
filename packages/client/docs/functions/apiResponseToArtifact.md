[**@aztec-artifacts/client v0.1.5**](../README.md)

***

[@aztec-artifacts/client](../globals.md) / apiResponseToArtifact

# Function: apiResponseToArtifact()

> **apiResponseToArtifact**(`response`): `object`

Defined in: [packages/client/src/converters.ts:109](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/417432ce1b59173b0e3bda5a305c620082db2477/packages/client/src/converters.ts#L109)

Converts an API artifact response to an Aztec `ContractArtifact` while preserving metadata.

## Parameters

### response

Raw API payload returned from the artifacts endpoint.

#### artifact

`string`

**Description**

Serialized ContractArtifact as hex string

#### artifactHash

`string`

**Description**

Artifact hash as hex string

#### contractClassId

`string`

**Description**

Contract class ID as hex string

#### id?

`number`

#### isToken?

`boolean`

**Description**

Whether this contract artifact is a token contract

## Returns

`object`

A deserialized contract artifact and its metadata.

### artifact

> **artifact**: `ContractArtifact`

### metadata

> **metadata**: `object`

#### metadata.artifactHash

> **artifactHash**: `` `0x${string}` ``

#### metadata.contractClassId

> **contractClassId**: `` `0x${string}` ``

#### metadata.id?

> `optional` **id**: `number`

#### metadata.isToken?

> `optional` **isToken**: `boolean`
