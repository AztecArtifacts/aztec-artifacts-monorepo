[**@aztec-artifacts/common v0.1.12**](../README.md)

***

[@aztec-artifacts/common](../globals.md) / hexStringToPublicKeys

# Function: hexStringToPublicKeys()

> **hexStringToPublicKeys**(`hex`): `PublicKeys`

Defined in: [packages/common/src/convert.ts:79](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/72c76eb715c9da93e4d433a37c7fb832d47d5145/packages/common/src/convert.ts#L79)

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
