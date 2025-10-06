[**@aztec-artifacts/common v0.1.9**](../README.md)

***

[@aztec-artifacts/common](../globals.md) / Codec

# Interface: Codec\<T, S\>

Defined in: [packages/common/src/codec.ts:19](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/ef31ffd2afa41161bfdd3fd3f3544970461d5d1f/packages/common/src/codec.ts#L19)

A generic interface for encoding and decoding data types between their in-memory representation
and a serialized format.

## Type Parameters

### T

`T`

The in-memory type (e.g., AztecAddress).

### S

`S`

The serialized type (e.g., Hex).

## Methods

### decode()

> **decode**(`value`): `T`

Defined in: [packages/common/src/codec.ts:32](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/ef31ffd2afa41161bfdd3fd3f3544970461d5d1f/packages/common/src/codec.ts#L32)

Decodes a value from its serialized format to its in-memory representation.

#### Parameters

##### value

`S`

The value to decode.

#### Returns

`T`

The decoded value.

***

### encode()

> **encode**(`value`): `S`

Defined in: [packages/common/src/codec.ts:25](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/ef31ffd2afa41161bfdd3fd3f3544970461d5d1f/packages/common/src/codec.ts#L25)

Encodes a value from its in-memory representation to its serialized format.

#### Parameters

##### value

`T`

The value to encode.

#### Returns

`S`

The encoded value.
