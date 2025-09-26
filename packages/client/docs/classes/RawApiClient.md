[**@aztec-artifacts/client v0.1.5**](../README.md)

***

[@aztec-artifacts/client](../globals.md) / RawApiClient

# Class: RawApiClient

Defined in: [packages/client/src/raw-client.ts:87](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/417432ce1b59173b0e3bda5a305c620082db2477/packages/client/src/raw-client.ts#L87)

Raw API client that returns unprocessed API responses (hex strings, raw JSON).
Use this when you need the raw data without Aztec type deserialization.

## Constructors

### Constructor

> **new RawApiClient**(`config`): `RawApiClient`

Defined in: [packages/client/src/raw-client.ts:98](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/417432ce1b59173b0e3bda5a305c620082db2477/packages/client/src/raw-client.ts#L98)

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

Defined in: [packages/client/src/raw-client.ts:335](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/417432ce1b59173b0e3bda5a305c620082db2477/packages/client/src/raw-client.ts#L335)

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

Defined in: [packages/client/src/raw-client.ts:351](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/417432ce1b59173b0e3bda5a305c620082db2477/packages/client/src/raw-client.ts#L351)

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

Defined in: [packages/client/src/raw-client.ts:283](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/417432ce1b59173b0e3bda5a305c620082db2477/packages/client/src/raw-client.ts#L283)

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

Defined in: [packages/client/src/raw-client.ts:321](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/417432ce1b59173b0e3bda5a305c620082db2477/packages/client/src/raw-client.ts#L321)

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

Defined in: [packages/client/src/raw-client.ts:236](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/417432ce1b59173b0e3bda5a305c620082db2477/packages/client/src/raw-client.ts#L236)

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

Defined in: [packages/client/src/raw-client.ts:247](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/417432ce1b59173b0e3bda5a305c620082db2477/packages/client/src/raw-client.ts#L247)

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

Defined in: [packages/client/src/raw-client.ts:263](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/417432ce1b59173b0e3bda5a305c620082db2477/packages/client/src/raw-client.ts#L263)

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

Defined in: [packages/client/src/raw-client.ts:220](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/417432ce1b59173b0e3bda5a305c620082db2477/packages/client/src/raw-client.ts#L220)

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

Defined in: [packages/client/src/raw-client.ts:208](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/417432ce1b59173b0e3bda5a305c620082db2477/packages/client/src/raw-client.ts#L208)

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

Defined in: [packages/client/src/raw-client.ts:196](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/417432ce1b59173b0e3bda5a305c620082db2477/packages/client/src/raw-client.ts#L196)

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

Defined in: [packages/client/src/raw-client.ts:374](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/417432ce1b59173b0e3bda5a305c620082db2477/packages/client/src/raw-client.ts#L374)

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

Defined in: [packages/client/src/raw-client.ts:396](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/417432ce1b59173b0e3bda5a305c620082db2477/packages/client/src/raw-client.ts#L396)

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
