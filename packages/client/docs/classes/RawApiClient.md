[**@aztec-artifacts/client v0.1.11**](../README.md)

***

[@aztec-artifacts/client](../globals.md) / RawApiClient

# Class: RawApiClient

Defined in: [packages/client/src/raw-client.ts:109](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/1612ee4ea1eca1f97a145ced0de2cf5baf73011e/packages/client/src/raw-client.ts#L109)

Raw API client that returns unprocessed API responses (hex strings, raw JSON).
Use this when you need the raw data without Aztec type deserialization.

## Constructors

### Constructor

> **new RawApiClient**(`config`): `RawApiClient`

Defined in: [packages/client/src/raw-client.ts:120](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/1612ee4ea1eca1f97a145ced0de2cf5baf73011e/packages/client/src/raw-client.ts#L120)

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

Defined in: [packages/client/src/raw-client.ts:357](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/1612ee4ea1eca1f97a145ced0de2cf5baf73011e/packages/client/src/raw-client.ts#L357)

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

Defined in: [packages/client/src/raw-client.ts:373](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/1612ee4ea1eca1f97a145ced0de2cf5baf73011e/packages/client/src/raw-client.ts#L373)

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

Defined in: [packages/client/src/raw-client.ts:305](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/1612ee4ea1eca1f97a145ced0de2cf5baf73011e/packages/client/src/raw-client.ts#L305)

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

### getAllSelectors()

> **getAllSelectors**(`options?`): `Promise`\<`object`[]\>

Defined in: [packages/client/src/raw-client.ts:414](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/1612ee4ea1eca1f97a145ced0de2cf5baf73011e/packages/client/src/raw-client.ts#L414)

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

Defined in: [packages/client/src/raw-client.ts:343](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/1612ee4ea1eca1f97a145ced0de2cf5baf73011e/packages/client/src/raw-client.ts#L343)

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

Defined in: [packages/client/src/raw-client.ts:258](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/1612ee4ea1eca1f97a145ced0de2cf5baf73011e/packages/client/src/raw-client.ts#L258)

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

### getArtifactsForSelector()

> **getArtifactsForSelector**(`selector`, `options?`): `Promise`\<\{ `contractClassIds`: `string`[]; `selector`: `string`; \}\>

Defined in: [packages/client/src/raw-client.ts:456](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/1612ee4ea1eca1f97a145ced0de2cf5baf73011e/packages/client/src/raw-client.ts#L456)

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

### getContractAddresses()

> **getContractAddresses**(`params?`, `options?`): `Promise`\<\{ `data`: `string`[]; `pagination`: \{ `cursor?`: `number`; `hasMore`: `boolean`; `limit`: `number`; `nextCursor?`: `number`; \}; \}\>

Defined in: [packages/client/src/raw-client.ts:269](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/1612ee4ea1eca1f97a145ced0de2cf5baf73011e/packages/client/src/raw-client.ts#L269)

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

Defined in: [packages/client/src/raw-client.ts:285](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/1612ee4ea1eca1f97a145ced0de2cf5baf73011e/packages/client/src/raw-client.ts#L285)

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

Defined in: [packages/client/src/raw-client.ts:242](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/1612ee4ea1eca1f97a145ced0de2cf5baf73011e/packages/client/src/raw-client.ts#L242)

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

### getSelectors()

> **getSelectors**(`params?`, `options?`): `Promise`\<\{ `data`: `object`[]; `pagination`: \{ `cursor?`: `number`; `hasMore`: `boolean`; `limit`: `number`; `nextCursor?`: `number`; \}; \}\>

Defined in: [packages/client/src/raw-client.ts:395](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/1612ee4ea1eca1f97a145ced0de2cf5baf73011e/packages/client/src/raw-client.ts#L395)

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

Defined in: [packages/client/src/raw-client.ts:442](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/1612ee4ea1eca1f97a145ced0de2cf5baf73011e/packages/client/src/raw-client.ts#L442)

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

Defined in: [packages/client/src/raw-client.ts:431](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/1612ee4ea1eca1f97a145ced0de2cf5baf73011e/packages/client/src/raw-client.ts#L431)

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

Defined in: [packages/client/src/raw-client.ts:230](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/1612ee4ea1eca1f97a145ced0de2cf5baf73011e/packages/client/src/raw-client.ts#L230)

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

Defined in: [packages/client/src/raw-client.ts:218](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/1612ee4ea1eca1f97a145ced0de2cf5baf73011e/packages/client/src/raw-client.ts#L218)

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

Defined in: [packages/client/src/raw-client.ts:471](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/1612ee4ea1eca1f97a145ced0de2cf5baf73011e/packages/client/src/raw-client.ts#L471)

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

Defined in: [packages/client/src/raw-client.ts:493](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/1612ee4ea1eca1f97a145ced0de2cf5baf73011e/packages/client/src/raw-client.ts#L493)

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
