[**@aztec-artifacts/client v0.1.5**](../README.md)

***

[@aztec-artifacts/client](../globals.md) / createDefaultClient

# Function: createDefaultClient()

> **createDefaultClient**(`config?`): [`AztecArtifactsApiClient`](../classes/AztecArtifactsApiClient.md)

Defined in: [packages/client/src/client.ts:22](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/417432ce1b59173b0e3bda5a305c620082db2477/packages/client/src/client.ts#L22)

Creates an `AztecArtifactsApiClient` preconfigured with the default service URL.

## Parameters

### config?

`Omit`\<[`ClientConfig`](../interfaces/ClientConfig.md), `"baseUrl"`\>

Optional overrides for headers or the fetch implementation.

## Returns

[`AztecArtifactsApiClient`](../classes/AztecArtifactsApiClient.md)

A high-level API client targeting the production service.
