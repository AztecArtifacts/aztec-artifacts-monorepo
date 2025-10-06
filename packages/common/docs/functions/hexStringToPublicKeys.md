[**@aztec-artifacts/common v0.1.9**](../README.md)

***

[@aztec-artifacts/common](../globals.md) / hexStringToPublicKeys

# Function: hexStringToPublicKeys()

> **hexStringToPublicKeys**(`hex`): `PublicKeys`

Defined in: [packages/common/src/convert.ts:79](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/ef31ffd2afa41161bfdd3fd3f3544970461d5d1f/packages/common/src/convert.ts#L79)

Converts a hex string to PublicKeys.
Accepts either JSON stringified representation or raw hex string format.

## Parameters

### hex

`` `0x${string}` ``

The hex string to convert to PublicKeys (JSON or raw hex format)

## Returns

`PublicKeys`

The PublicKeys created from the hex string

## Throws

When the input cannot be converted to PublicKeys
