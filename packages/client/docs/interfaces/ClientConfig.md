[**@aztec-artifacts/client v0.1.7**](../README.md)

***

[@aztec-artifacts/client](../globals.md) / ClientConfig

# Interface: ClientConfig

Defined in: [packages/client/src/raw-client.ts:66](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/fff1e3f6d611b44fcd9c24810241183c22d606c4/packages/client/src/raw-client.ts#L66)

Configuration for constructing a raw API client.

## Properties

### baseUrl

> **baseUrl**: `string`

Defined in: [packages/client/src/raw-client.ts:67](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/fff1e3f6d611b44fcd9c24810241183c22d606c4/packages/client/src/raw-client.ts#L67)

***

### fetch()?

> `optional` **fetch**: \{(`input`, `init?`): `Promise`\<`Response`\>; (`input`, `init?`): `Promise`\<`Response`\>; \}

Defined in: [packages/client/src/raw-client.ts:69](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/fff1e3f6d611b44fcd9c24810241183c22d606c4/packages/client/src/raw-client.ts#L69)

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

Defined in: [packages/client/src/raw-client.ts:68](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/fff1e3f6d611b44fcd9c24810241183c22d606c4/packages/client/src/raw-client.ts#L68)

***

### logger?

> `optional` **logger**: [`Logger`](Logger.md)

Defined in: [packages/client/src/raw-client.ts:70](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/fff1e3f6d611b44fcd9c24810241183c22d606c4/packages/client/src/raw-client.ts#L70)
