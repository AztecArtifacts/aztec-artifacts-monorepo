[**@aztec-artifacts/client v0.1.12**](../README.md)

***

[@aztec-artifacts/client](../globals.md) / ClientConfig

# Interface: ClientConfig

Defined in: [packages/client/src/raw-client.ts:71](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/72c76eb715c9da93e4d433a37c7fb832d47d5145/packages/client/src/raw-client.ts#L71)

Configuration for constructing a raw API client.

## Properties

### baseUrl

> **baseUrl**: `string`

Defined in: [packages/client/src/raw-client.ts:72](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/72c76eb715c9da93e4d433a37c7fb832d47d5145/packages/client/src/raw-client.ts#L72)

***

### fetch()?

> `optional` **fetch**: \{(`input`, `init?`): `Promise`\<`Response`\>; (`input`, `init?`): `Promise`\<`Response`\>; \}

Defined in: [packages/client/src/raw-client.ts:74](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/72c76eb715c9da93e4d433a37c7fb832d47d5145/packages/client/src/raw-client.ts#L74)

#### Call Signature

> (`input`, `init?`): `Promise`\<`Response`\>

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Window/fetch)

##### Parameters

###### input

`URL` | `RequestInfo`

###### init?

`RequestInit`

##### Returns

`Promise`\<`Response`\>

#### Call Signature

> (`input`, `init?`): `Promise`\<`Response`\>

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Window/fetch)

##### Parameters

###### input

`string` | `URL` | `Request`

###### init?

`RequestInit`

##### Returns

`Promise`\<`Response`\>

***

### headers?

> `optional` **headers**: `Record`\<`string`, `string`\>

Defined in: [packages/client/src/raw-client.ts:73](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/72c76eb715c9da93e4d433a37c7fb832d47d5145/packages/client/src/raw-client.ts#L73)

***

### logger?

> `optional` **logger**: [`Logger`](Logger.md)

Defined in: [packages/client/src/raw-client.ts:75](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/72c76eb715c9da93e4d433a37c7fb832d47d5145/packages/client/src/raw-client.ts#L75)
