[**@aztec-artifacts/client v0.1.12**](../README.md)

***

[@aztec-artifacts/client](../globals.md) / AztecArtifactsApiClient

# Class: AztecArtifactsApiClient

Defined in: [packages/client/src/client.ts:33](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/72c76eb715c9da93e4d433a37c7fb832d47d5145/packages/client/src/client.ts#L33)

High-level client that wraps the raw API and returns strongly typed Aztec primitives.

## Constructors

### Constructor

> **new AztecArtifactsApiClient**(`config`): `AztecArtifactsApiClient`

Defined in: [packages/client/src/client.ts:42](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/72c76eb715c9da93e4d433a37c7fb832d47d5145/packages/client/src/client.ts#L42)

Creates a new API client instance.

#### Parameters

##### config

[`ClientConfig`](../interfaces/ClientConfig.md)

Connection details such as the base URL and default headers.

#### Returns

`AztecArtifactsApiClient`

## Properties

### getAllPages()

> **getAllPages**: \<`T`\>(`fetcher`, `options?`) => `AsyncGenerator`\<`T`\[`"data"`\]\[`number`\], `void`, `unknown`\>

Defined in: [packages/client/src/client.ts:364](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/72c76eb715c9da93e4d433a37c7fb832d47d5145/packages/client/src/client.ts#L364)

Exposes the underlying pagination helper for advanced scenarios.

Helper generator that yields every item from a paginated endpoint.

#### Type Parameters

##### T

`T` *extends* `object`

Shape of the paginated response envelope.

#### Parameters

##### fetcher

(`params`, `options?`) => `Promise`\<`T`\>

Function that performs a single page fetch.

##### options?

[`ApiClientOptions`](../interfaces/ApiClientOptions.md)

Options controlling pagination behaviour and caching.

#### Returns

`AsyncGenerator`\<`T`\[`"data"`\]\[`number`\], `void`, `unknown`\>

An async generator producing each item from all pages in order.

## Methods

### getAllContractAddresses()

> **getAllContractAddresses**(`options?`): `Promise`\<`string`[]\>

Defined in: [packages/client/src/client.ts:221](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/72c76eb715c9da93e4d433a37c7fb832d47d5145/packages/client/src/client.ts#L221)

Fetches all contract addresses using automatic pagination.

#### Parameters

##### options?

[`ApiClientOptions`](../interfaces/ApiClientOptions.md)

Options including limit, cursor, and cache settings.

#### Returns

`Promise`\<`string`[]\>

Every contract address known to the API at the time of the request.

***

### getAllContractAddressesByClassId()

> **getAllContractAddressesByClassId**(`contractClassId`, `query?`, `options?`): `Promise`\<`string`[]\>

Defined in: [packages/client/src/client.ts:233](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/72c76eb715c9da93e4d433a37c7fb832d47d5145/packages/client/src/client.ts#L233)

Fetches all contract addresses that match a specific contract class ID using automatic pagination.

#### Parameters

##### contractClassId

`string`

Contract class ID to match.

##### query?

Optional query parameters including match scope.

###### match?

`"current"` \| `"original"` \| `"any"`

##### options?

[`ApiClientOptions`](../interfaces/ApiClientOptions.md)

Options including limit, cursor, and cache settings.

#### Returns

`Promise`\<`string`[]\>

Contract addresses whose class matches the provided ID.

***

### getAllSelectors()

> **getAllSelectors**(`options?`): `Promise`\<`object`[]\>

Defined in: [packages/client/src/client.ts:274](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/72c76eb715c9da93e4d433a37c7fb832d47d5145/packages/client/src/client.ts#L274)

Fetches all selectors using automatic pagination.

#### Parameters

##### options?

[`ApiClientOptions`](../interfaces/ApiClientOptions.md)

Options including limit, cursor, and cache settings.

#### Returns

`Promise`\<`object`[]\>

Every selector known to the API at the time of the request.

***

### getAllTokens()

> **getAllTokens**(`options?`): `Promise`\<`object`[]\>

Defined in: [packages/client/src/client.ts:79](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/72c76eb715c9da93e4d433a37c7fb832d47d5145/packages/client/src/client.ts#L79)

Fetches all tokens using automatic pagination.

#### Parameters

##### options?

[`ApiClientOptions`](../interfaces/ApiClientOptions.md)

Options including limit, cursor, and cache settings.

#### Returns

`Promise`\<`object`[]\>

Every token known to the API at the time of the request.

***

### getArtifact()

> **getArtifact**(`identifier`, `options?`): `Promise`\<`ContractArtifact`\>

Defined in: [packages/client/src/client.ts:115](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/72c76eb715c9da93e4d433a37c7fb832d47d5145/packages/client/src/client.ts#L115)

Retrieves a contract artifact and deserializes it into an Aztec `ContractArtifact`.

#### Parameters

##### identifier

`string`

Contract class ID or artifact hash.

##### options?

Request options such as fetch cache behaviour.

###### cache?

`RequestCache`

#### Returns

`Promise`\<`ContractArtifact`\>

The decoded contract artifact.

***

### getArtifactsForSelector()

> **getArtifactsForSelector**(`selector`, `options?`): `Promise`\<\{ `contractClassIds`: `string`[]; `selector`: `string`; \}\>

Defined in: [packages/client/src/client.ts:343](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/72c76eb715c9da93e4d433a37c7fb832d47d5145/packages/client/src/client.ts#L343)

Retrieves all contract artifacts (contractClassIds) that implement a function selector.

#### Parameters

##### selector

`string`

Function selector as a hex string (e.g., "0x12345678").

##### options?

Request options such as fetch cache behaviour.

###### cache?

`RequestCache`

#### Returns

`Promise`\<\{ `contractClassIds`: `string`[]; `selector`: `string`; \}\>

The selector and all contract class IDs that implement it.

***

### getContract()

> **getContract**(`address`, `includeArtifact?`, `options?`): `Promise`\<\{ `artifact?`: `ContractArtifact`; `instance`: `ContractInstanceWithAddress`; \}\>

Defined in: [packages/client/src/client.ts:91](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/72c76eb715c9da93e4d433a37c7fb832d47d5145/packages/client/src/client.ts#L91)

Retrieves a contract instance by address and deserializes it into Aztec types.

#### Parameters

##### address

`string`

Contract address to fetch.

##### includeArtifact?

`boolean`

Whether to include the compiled artifact in the response.

##### options?

Request options such as fetch cache behaviour.

###### cache?

`RequestCache`

#### Returns

`Promise`\<\{ `artifact?`: `ContractArtifact`; `instance`: `ContractInstanceWithAddress`; \}\>

A deserialized contract instance with optional artifact.

***

### getContractAddresses()

> **getContractAddresses**(`params?`, `options?`): `Promise`\<\{ `data`: `string`[]; `pagination`: \{ `cursor?`: `number`; `hasMore`: `boolean`; `limit`: `number`; `nextCursor?`: `number`; \}; \}\>

Defined in: [packages/client/src/client.ts:192](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/72c76eb715c9da93e4d433a37c7fb832d47d5145/packages/client/src/client.ts#L192)

Retrieves a paginated list of contract addresses.

#### Parameters

##### params?

[`PaginationParams`](../interfaces/PaginationParams.md)

Pagination parameters controlling limit and cursor.

##### options?

Request options such as fetch cache behaviour.

###### cache?

`RequestCache`

#### Returns

`Promise`\<\{ `data`: `string`[]; `pagination`: \{ `cursor?`: `number`; `hasMore`: `boolean`; `limit`: `number`; `nextCursor?`: `number`; \}; \}\>

A page of contract addresses together with pagination metadata.

***

### getContractAddressesByClassId()

> **getContractAddressesByClassId**(`contractClassId`, `query?`, `options?`): `Promise`\<\{ `data`: `string`[]; `pagination`: \{ `cursor?`: `number`; `hasMore`: `boolean`; `limit`: `number`; `nextCursor?`: `number`; \}; \}\>

Defined in: [packages/client/src/client.ts:207](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/72c76eb715c9da93e4d433a37c7fb832d47d5145/packages/client/src/client.ts#L207)

Retrieves contract addresses matching a specific contract class ID.

#### Parameters

##### contractClassId

`string`

Contract class ID to match.

##### query?

`object` & [`PaginationParams`](../interfaces/PaginationParams.md)

Additional filters (match scope) plus pagination parameters.

##### options?

Request options such as fetch cache behaviour.

###### cache?

`RequestCache`

#### Returns

`Promise`\<\{ `data`: `string`[]; `pagination`: \{ `cursor?`: `number`; `hasMore`: `boolean`; `limit`: `number`; `nextCursor?`: `number`; \}; \}\>

A page of contract addresses filtered by class ID.

***

### getSelectors()

> **getSelectors**(`params?`, `options?`): `Promise`\<\{ `data`: `object`[]; `pagination`: \{ `cursor?`: `number`; `hasMore`: `boolean`; `limit`: `number`; `nextCursor?`: `number`; \}; \}\>

Defined in: [packages/client/src/client.ts:253](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/72c76eb715c9da93e4d433a37c7fb832d47d5145/packages/client/src/client.ts#L253)

Retrieves a paginated list of selectors.

#### Parameters

##### params?

[`PaginationParams`](../interfaces/PaginationParams.md)

Pagination parameters controlling limit and cursor.

##### options?

Request options such as fetch cache behaviour.

###### cache?

`RequestCache`

#### Returns

`Promise`\<\{ `data`: `object`[]; `pagination`: \{ `cursor?`: `number`; `hasMore`: `boolean`; `limit`: `number`; `nextCursor?`: `number`; \}; \}\>

A page of selectors together with pagination metadata.

***

### getSelectorsForArtifact()

> **getSelectorsForArtifact**(`identifier`, `options?`): `Promise`\<\{ `contractClassId`: `string`; `selectors`: `object`[]; \}\>

Defined in: [packages/client/src/client.ts:318](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/72c76eb715c9da93e4d433a37c7fb832d47d5145/packages/client/src/client.ts#L318)

Retrieves all function selectors and their signatures for a contract artifact.

#### Parameters

##### identifier

`string`

Contract class ID or artifact hash.

##### options?

Request options such as fetch cache behaviour.

###### cache?

`RequestCache`

#### Returns

`Promise`\<\{ `contractClassId`: `string`; `selectors`: `object`[]; \}\>

All selectors and signatures associated with the artifact.

***

### getSignaturesBySelector()

> **getSignaturesBySelector**(`selector`, `options?`): `Promise`\<\{ `selector`: `string`; `signatures`: `string`[]; \}\>

Defined in: [packages/client/src/client.ts:297](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/72c76eb715c9da93e4d433a37c7fb832d47d5145/packages/client/src/client.ts#L297)

Retrieves all function signatures that have been observed for a given selector.

#### Parameters

##### selector

`string`

Function selector as a hex string (e.g., "0x12345678").

##### options?

Request options such as fetch cache behaviour.

###### cache?

`RequestCache`

#### Returns

`Promise`\<\{ `selector`: `string`; `signatures`: `string`[]; \}\>

The selector and all observed function signatures for that selector.

***

### getTokenByAddress()

> **getTokenByAddress**(`address`, `options?`): `Promise`\<\{ `address`: `string`; `decimals`: `number`; `id?`: `number`; `name`: `string`; `symbol`: `string`; \}\>

Defined in: [packages/client/src/client.ts:69](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/72c76eb715c9da93e4d433a37c7fb832d47d5145/packages/client/src/client.ts#L69)

Retrieves metadata for a token by its address.

#### Parameters

##### address

`string`

Contract address of the token.

##### options?

Request options such as fetch cache behaviour.

###### cache?

`RequestCache`

#### Returns

`Promise`\<\{ `address`: `string`; `decimals`: `number`; `id?`: `number`; `name`: `string`; `symbol`: `string`; \}\>

Token metadata as returned by the API.

***

### getTokens()

> **getTokens**(`params?`, `options?`): `Promise`\<\{ `data`: `object`[]; `pagination`: \{ `cursor?`: `number`; `hasMore`: `boolean`; `limit`: `number`; `nextCursor?`: `number`; \}; \}\>

Defined in: [packages/client/src/client.ts:58](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/72c76eb715c9da93e4d433a37c7fb832d47d5145/packages/client/src/client.ts#L58)

Retrieves a paginated list of tokens.

#### Parameters

##### params?

[`PaginationParams`](../interfaces/PaginationParams.md)

Pagination parameters controlling limit and cursor.

##### options?

Request options such as fetch cache behaviour.

###### cache?

`RequestCache`

#### Returns

`Promise`\<\{ `data`: `object`[]; `pagination`: \{ `cursor?`: `number`; `hasMore`: `boolean`; `limit`: `number`; `nextCursor?`: `number`; \}; \}\>

A page of tokens together with pagination metadata.

***

### uploadContractArtifact()

> **uploadContractArtifact**(`artifact`, `options?`): `Promise`\<\{ `contractClassId`: `string`; \}\>

Defined in: [packages/client/src/client.ts:133](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/72c76eb715c9da93e4d433a37c7fb832d47d5145/packages/client/src/client.ts#L133)

Uploads a contract artifact.

#### Parameters

##### artifact

`ContractArtifact`

Contract artifact to upload.

##### options?

Request options such as fetch cache behaviour.

###### cache?

`RequestCache`

#### Returns

`Promise`\<\{ `contractClassId`: `string`; \}\>

The contract class ID associated with the uploaded artifact.

***

### uploadContractInstance()

> **uploadContractInstance**(`params`, `options?`): `Promise`\<\{ `address`: `string`; `currentContractClassId`: `string`; \}\>

Defined in: [packages/client/src/client.ts:154](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/72c76eb715c9da93e4d433a37c7fb832d47d5145/packages/client/src/client.ts#L154)

Uploads a contract instance along with optional initialization data and artifact.

#### Parameters

##### params

Object containing:
  - instance: Contract instance to upload.
  - initializationData: Optional initialization data for the contract.
  - artifact: Optional artifact to store alongside the instance.

###### artifact?

`ContractArtifact`

###### initializationData?

[`InitializationData`](../type-aliases/InitializationData.md)

###### instance

`ContractInstanceWithAddress`

##### options?

Request options such as fetch cache behaviour.

###### cache?

`RequestCache`

#### Returns

`Promise`\<\{ `address`: `string`; `currentContractClassId`: `string`; \}\>

The deployed address plus current contract class ID.
