[**@aztec-artifacts/client v0.1.8**](../README.md)

***

[@aztec-artifacts/client](../globals.md) / createDefaultRawClient

# Function: createDefaultRawClient()

> **createDefaultRawClient**(`config?`): [`RawApiClient`](../classes/RawApiClient.md)

Defined in: [packages/client/src/raw-client.ts:101](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/0d66bcf5b51495a3bdde57d8e87a237933148a62/packages/client/src/raw-client.ts#L101)

Creates a `RawApiClient` preconfigured with the default service URL.

## Parameters

### config?

`Omit`\<[`ClientConfig`](../interfaces/ClientConfig.md), `"baseUrl"`\>

Optional overrides for headers or the fetch implementation.

## Returns

[`RawApiClient`](../classes/RawApiClient.md)

A raw client instance targeting the production API.
