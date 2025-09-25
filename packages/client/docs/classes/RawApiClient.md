[**@aztec-artifacts/client v0.1.2**](../README.md)

***

[@aztec-artifacts/client](../globals.md) / RawApiClient

# Class: RawApiClient

Defined in: [packages/client/src/raw-client.ts:85](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/319f9c2bfc464cded897116c492df05792d1db75/packages/client/src/raw-client.ts#L85)

Raw API client that returns unprocessed API responses (hex strings, raw JSON).
Use this when you need the raw data without Aztec type deserialization.

## Constructors

### Constructor

> **new RawApiClient**(`config`): `RawApiClient`

Defined in: [packages/client/src/raw-client.ts:95](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/319f9c2bfc464cded897116c492df05792d1db75/packages/client/src/raw-client.ts#L95)

Creates a new raw API client instance.

#### Parameters

##### config

[`ClientConfig`](../interfaces/ClientConfig.md)

Connection details such as base URL, headers, and fetch implementation.

#### Returns

`RawApiClient`

## Methods

### getAllContractAddresses()

> **getAllContractAddresses**(`options?`): `Promise`\<`string`[]\>

Defined in: [packages/client/src/raw-client.ts:295](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/319f9c2bfc464cded897116c492df05792d1db75/packages/client/src/raw-client.ts#L295)

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

Defined in: [packages/client/src/raw-client.ts:311](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/319f9c2bfc464cded897116c492df05792d1db75/packages/client/src/raw-client.ts#L311)

Fetches all contract addresses for a given class using automatic pagination.

#### Parameters

##### contractClassId

`string`

The contract class ID to filter by.

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

### getAllPages()

> **getAllPages**\<`T`\>(`fetcher`, `options?`): `AsyncGenerator`\<`T`\[`"data"`\]\[`number`\], `void`, `unknown`\>

Defined in: [packages/client/src/raw-client.ts:251](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/319f9c2bfc464cded897116c492df05792d1db75/packages/client/src/raw-client.ts#L251)

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

***

### getAllTokens()

> **getAllTokens**(`options?`): `Promise`\<`object`[]\>

Defined in: [packages/client/src/raw-client.ts:281](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/319f9c2bfc464cded897116c492df05792d1db75/packages/client/src/raw-client.ts#L281)

Fetches all tokens using automatic pagination.

#### Parameters

##### options?

[`ApiClientOptions`](../interfaces/ApiClientOptions.md)

Options including limit, cursor, and cache settings.

#### Returns

`Promise`\<`object`[]\>

Every token known to the API at the time of the request.

***

### getArtifactRaw()

> **getArtifactRaw**(`identifier`, `options?`): `Promise`\<\{ `artifact`: `string`; `artifactHash`: `string`; `contractClassId`: `string`; `id?`: `number`; `isToken?`: `boolean`; \}\>

Defined in: [packages/client/src/raw-client.ts:204](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/319f9c2bfc464cded897116c492df05792d1db75/packages/client/src/raw-client.ts#L204)

Retrieves a contract artifact by contract class ID or artifact hash without deserialization.

#### Parameters

##### identifier

`string`

Contract class ID or artifact hash.

##### options?

Request options such as fetch cache behaviour.

###### cache?

`RequestCache`

#### Returns

`Promise`\<\{ `artifact`: `string`; `artifactHash`: `string`; `contractClassId`: `string`; `id?`: `number`; `isToken?`: `boolean`; \}\>

The raw contract artifact as stored by the API.

***

### getContractAddresses()

> **getContractAddresses**(`params?`, `options?`): `Promise`\<\{ `data`: `string`[]; `pagination`: \{ `cursor?`: `number`; `hasMore`: `boolean`; `limit`: `number`; `nextCursor?`: `number`; \}; \}\>

Defined in: [packages/client/src/raw-client.ts:215](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/319f9c2bfc464cded897116c492df05792d1db75/packages/client/src/raw-client.ts#L215)

Retrieves a paginated list of all contract addresses.

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

Defined in: [packages/client/src/raw-client.ts:231](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/319f9c2bfc464cded897116c492df05792d1db75/packages/client/src/raw-client.ts#L231)

Retrieves contract addresses that match a specific contract class ID.

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

### getContractRaw()

> **getContractRaw**(`address`, `includeArtifact?`, `options?`): `Promise`\<\{ `address`: `string`; `artifact?`: `string`; `currentContractClassId`: `string`; `deployer`: `string`; `id?`: `number`; `initializationData?`: `null` \| \{ `constructorName`: `string`; `encodedArgs?`: `string`[]; \}; `initializationHash`: `string`; `isToken?`: `boolean`; `originalContractClassId`: `string`; `publicKeys`: `string`; `salt`: `string`; `version`: `number`; \}\>

Defined in: [packages/client/src/raw-client.ts:188](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/319f9c2bfc464cded897116c492df05792d1db75/packages/client/src/raw-client.ts#L188)

Retrieves a contract instance by address without performing deserialization.

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

`Promise`\<\{ `address`: `string`; `artifact?`: `string`; `currentContractClassId`: `string`; `deployer`: `string`; `id?`: `number`; `initializationData?`: `null` \| \{ `constructorName`: `string`; `encodedArgs?`: `string`[]; \}; `initializationHash`: `string`; `isToken?`: `boolean`; `originalContractClassId`: `string`; `publicKeys`: `string`; `salt`: `string`; `version`: `number`; \}\>

The raw contract instance payload provided by the API.

***

### getTokenByAddress()

> **getTokenByAddress**(`address`, `options?`): `Promise`\<\{ `address`: `string`; `decimals`: `number`; `id?`: `number`; `name`: `string`; `symbol`: `string`; \}\>

Defined in: [packages/client/src/raw-client.ts:176](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/319f9c2bfc464cded897116c492df05792d1db75/packages/client/src/raw-client.ts#L176)

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

Defined in: [packages/client/src/raw-client.ts:164](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/319f9c2bfc464cded897116c492df05792d1db75/packages/client/src/raw-client.ts#L164)

Retrieves a paginated list of all tokens.

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

### uploadContractArtifactRaw()

> **uploadContractArtifactRaw**(`artifact`, `options?`): `Promise`\<\{ `contractClassId`: `string`; \}\>

Defined in: [packages/client/src/raw-client.ts:334](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/319f9c2bfc464cded897116c492df05792d1db75/packages/client/src/raw-client.ts#L334)

Uploads a contract artifact to the API without deserialization.

#### Parameters

##### artifact

`` `0x${string}` ``

The `ContractArtifact` to upload.

##### options?

Options including cache settings.

###### cache?

`RequestCache`

#### Returns

`Promise`\<\{ `contractClassId`: `string`; \}\>

Contract class ID of the uploaded artifact.

#### Throws

Error if upload fails or the artifact payload is invalid.

***

### uploadContractInstanceRaw()

> **uploadContractInstanceRaw**(`params`, `options?`): `Promise`\<\{ `address`: `string`; `currentContractClassId`: `string`; \}\>

Defined in: [packages/client/src/raw-client.ts:356](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/319f9c2bfc464cded897116c492df05792d1db75/packages/client/src/raw-client.ts#L356)

Uploads a contract instance with optional initialization data and artifact without deserialization.

#### Parameters

##### params

Object containing:
  - instance: The `ContractInstanceWithAddress` to upload.
  - initializationData: Optional initialization data for the contract.
  - artifact: Optional `ContractArtifact` to upload with the instance.

###### artifact?

`` `0x${string}` ``

###### initializationData?

`SerializedInitializationData`

###### instance

`SerializedContractInstance`

##### options?

Options including cache settings.

###### cache?

`RequestCache`

#### Returns

`Promise`\<\{ `address`: `string`; `currentContractClassId`: `string`; \}\>

Address and current contract class ID of the uploaded instance.

#### Throws

Error if upload fails or the instance/artifact payload is invalid.
