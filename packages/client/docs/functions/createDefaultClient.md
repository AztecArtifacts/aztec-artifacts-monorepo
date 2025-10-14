[**@aztec-artifacts/client v0.1.11**](../README.md)

***

[@aztec-artifacts/client](../globals.md) / createDefaultClient

# Function: createDefaultClient()

> **createDefaultClient**(`config?`): [`AztecArtifactsApiClient`](../classes/AztecArtifactsApiClient.md)

Defined in: [packages/client/src/client.ts:26](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/1612ee4ea1eca1f97a145ced0de2cf5baf73011e/packages/client/src/client.ts#L26)

Creates an `AztecArtifactsApiClient` preconfigured with the default service URL.

## Parameters

### config?

`Omit`\<[`ClientConfig`](../interfaces/ClientConfig.md), `"baseUrl"`\>

Optional overrides for headers or the fetch implementation.

## Returns

[`AztecArtifactsApiClient`](../classes/AztecArtifactsApiClient.md)

A high-level API client targeting the production service.
