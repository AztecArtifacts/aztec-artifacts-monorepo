[**@aztec-artifacts/client v0.1.6**](../README.md)

***

[@aztec-artifacts/client](../globals.md) / createDefaultRawClient

# Function: createDefaultRawClient()

> **createDefaultRawClient**(`config?`): [`RawApiClient`](../classes/RawApiClient.md)

Defined in: [packages/client/src/raw-client.ts:79](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/dbbcdcdf35bfd80dbb179974382829fceef9533c/packages/client/src/raw-client.ts#L79)

Creates a `RawApiClient` preconfigured with the default service URL.

## Parameters

### config?

`Omit`\<[`ClientConfig`](../interfaces/ClientConfig.md), `"baseUrl"`\>

Optional overrides for headers or the fetch implementation.

## Returns

[`RawApiClient`](../classes/RawApiClient.md)

A raw client instance targeting the production API.
