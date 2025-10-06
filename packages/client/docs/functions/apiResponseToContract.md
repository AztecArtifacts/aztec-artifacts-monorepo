[**@aztec-artifacts/client v0.1.8**](../README.md)

***

[@aztec-artifacts/client](../globals.md) / apiResponseToContract

# Function: apiResponseToContract()

> **apiResponseToContract**(`response`): `object`

Defined in: [packages/client/src/converters.ts:19](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/0d66bcf5b51495a3bdde57d8e87a237933148a62/packages/client/src/converters.ts#L19)

Converts an API contract instance response to Aztec types while preserving metadata.

## Parameters

### response

Raw API payload returned from the contracts endpoint.

#### address

`string`

**Description**

Aztec address as hex string

#### artifact?

`string`

**Description**

Serialized ContractArtifact as hex string

#### currentContractClassId

`string`

**Description**

Current contract class ID as hex string

#### deployer

`string`

**Description**

Deployer address as hex string

#### id?

`number`

#### initializationData?

`null` \| \{ `constructorName`: `string`; `encodedArgs?`: `string`[]; \}

#### initializationHash

`string`

**Description**

Initialization hash as hex string

#### isToken?

`boolean`

**Description**

Whether this contract instance is a token contract

#### originalContractClassId

`string`

**Description**

Original contract class ID as hex string

#### publicKeys

`string`

**Description**

Public keys as concatenated hex string (use PublicKeys.toString() / fromString() for conversion)

#### salt

`string`

**Description**

Salt as hex string

#### version

`number`

## Returns

`object`

A deserialized contract instance alongside optional artifact and metadata.

### artifact?

> `optional` **artifact**: `ContractArtifact`

### instance

> **instance**: `ContractInstanceWithAddress`

### metadata

> **metadata**: `object`

#### metadata.id?

> `optional` **id**: `number`

#### metadata.isToken?

> `optional` **isToken**: `boolean`
