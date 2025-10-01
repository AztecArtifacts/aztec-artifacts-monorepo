[**@aztec-artifacts/client v0.1.7**](../README.md)

***

[@aztec-artifacts/client](../globals.md) / createDefaultRawClient

# Function: createDefaultRawClient()

> **createDefaultRawClient**(`config?`): [`RawApiClient`](../classes/RawApiClient.md)

Defined in: [packages/client/src/raw-client.ts:96](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/fff1e3f6d611b44fcd9c24810241183c22d606c4/packages/client/src/raw-client.ts#L96)

Creates a `RawApiClient` preconfigured with the default service URL.

## Parameters

### config?

`Omit`\<[`ClientConfig`](../interfaces/ClientConfig.md), `"baseUrl"`\>

Optional overrides for headers or the fetch implementation.

## Returns

[`RawApiClient`](../classes/RawApiClient.md)

A raw client instance targeting the production API.
