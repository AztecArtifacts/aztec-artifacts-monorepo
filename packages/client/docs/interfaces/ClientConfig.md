[**@aztec-artifacts/client v0.1.4**](../README.md)

***

[@aztec-artifacts/client](../globals.md) / ClientConfig

# Interface: ClientConfig

Defined in: [packages/client/src/raw-client.ts:48](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/09243ac3d2ea1e7f4337eb88bcbd33142b8243d2/packages/client/src/raw-client.ts#L48)

Configuration for constructing a raw API client.

## Properties

### baseUrl

> **baseUrl**: `string`

Defined in: [packages/client/src/raw-client.ts:49](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/09243ac3d2ea1e7f4337eb88bcbd33142b8243d2/packages/client/src/raw-client.ts#L49)

***

### fetch()?

> `optional` **fetch**: \{(`input`, `init?`): `Promise`\<`Response`\>; (`input`, `init?`): `Promise`\<`Response`\>; \}

Defined in: [packages/client/src/raw-client.ts:51](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/09243ac3d2ea1e7f4337eb88bcbd33142b8243d2/packages/client/src/raw-client.ts#L51)

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

Defined in: [packages/client/src/raw-client.ts:50](https://github.com/AztecArtifacts/aztec-artifacts-monorepo/blob/09243ac3d2ea1e7f4337eb88bcbd33142b8243d2/packages/client/src/raw-client.ts#L50)
