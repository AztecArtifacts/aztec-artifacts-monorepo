[**@aztec-artifacts/client v0.1.4**](../README.md)

***

[@aztec-artifacts/client](../globals.md) / createDefaultRawClient

# Function: createDefaultRawClient()

> **createDefaultRawClient**(`config?`): [`RawApiClient`](../classes/RawApiClient.md)

Defined in: [packages/client/src/raw-client.ts:77](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/09243ac3d2ea1e7f4337eb88bcbd33142b8243d2/packages/client/src/raw-client.ts#L77)

Creates a `RawApiClient` preconfigured with the default service URL.

## Parameters

### config?

`Omit`\<[`ClientConfig`](../interfaces/ClientConfig.md), `"baseUrl"`\>

Optional overrides for headers or the fetch implementation.

## Returns

[`RawApiClient`](../classes/RawApiClient.md)

A raw client instance targeting the production API.
