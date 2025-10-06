[**@aztec-artifacts/common v0.1.8**](../README.md)

***

[@aztec-artifacts/common](../globals.md) / hexStringToPublicKeys

# Function: hexStringToPublicKeys()

> **hexStringToPublicKeys**(`hex`): `PublicKeys`

Defined in: [packages/common/src/convert.ts:79](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/0d66bcf5b51495a3bdde57d8e87a237933148a62/packages/common/src/convert.ts#L79)

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
