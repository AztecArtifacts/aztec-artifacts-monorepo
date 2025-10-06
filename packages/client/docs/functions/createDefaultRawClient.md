[**@aztec-artifacts/client v0.1.9**](../README.md)

***

[@aztec-artifacts/client](../globals.md) / createDefaultRawClient

# Function: createDefaultRawClient()

> **createDefaultRawClient**(`config?`): [`RawApiClient`](../classes/RawApiClient.md)

Defined in: [packages/client/src/raw-client.ts:101](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/ef31ffd2afa41161bfdd3fd3f3544970461d5d1f/packages/client/src/raw-client.ts#L101)

Creates a `RawApiClient` preconfigured with the default service URL.

## Parameters

### config?

`Omit`\<[`ClientConfig`](../interfaces/ClientConfig.md), `"baseUrl"`\>

Optional overrides for headers or the fetch implementation.

## Returns

[`RawApiClient`](../classes/RawApiClient.md)

A raw client instance targeting the production API.
