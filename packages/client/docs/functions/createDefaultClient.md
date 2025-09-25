[**@aztec-artifacts/client v0.1.2**](../README.md)

***

[@aztec-artifacts/client](../globals.md) / createDefaultClient

# Function: createDefaultClient()

> **createDefaultClient**(`config?`): [`AztecArtifactsApiClient`](../classes/AztecArtifactsApiClient.md)

Defined in: [packages/client/src/client.ts:21](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/319f9c2bfc464cded897116c492df05792d1db75/packages/client/src/client.ts#L21)

Creates an `AztecArtifactsApiClient` preconfigured with the default service URL.

## Parameters

### config?

`Omit`\<[`ClientConfig`](../interfaces/ClientConfig.md), `"baseUrl"`\>

Optional overrides for headers or the fetch implementation.

## Returns

[`AztecArtifactsApiClient`](../classes/AztecArtifactsApiClient.md)

A high-level API client targeting the production service.
