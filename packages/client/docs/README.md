**@aztec-artifacts/client v0.1.7**

***

# @aztec-artifacts/client

A type-safe TypeScript client for the Aztec Artifacts API. This client provides convenient methods to upload and fetch contract artifacts, contract instances, and token information from the Aztec Artifacts repository.

## Installation

```bash
pnpm add @aztec-artifacts/client
# or
npm install @aztec-artifacts/client
# or
yarn add @aztec-artifacts/client
```

## Quick Start

```typescript
import { AztecArtifactsApiClient, createDefaultClient } from '@aztec-artifacts/client';

// Use the default client (connects to production API)
const client = createDefaultClient();

// Or create a custom client
const customClient = new AztecArtifactsApiClient({
  baseUrl: 'https://api.aztec-artifacts.org/v1',
  headers: {
    'User-Agent': 'MyApp/1.0.0'
  }
});
```

## Logging

The client includes lightweight logging hooks so you can see what it is doing without committing to a specific logging framework.

- By default, the library uses a console-backed logger at `info` level, emitting one line per HTTP request and upload.
- Override the default by setting `LOG_LEVEL=debug|info|warn|error|silent` before instantiating the client.
- Call `createConsoleLogger('debug')` for verbose diagnostics or `'silent'` to turn logging off entirely.
- Pass any object that implements `debug`, `info`, `warn`, and `error` (e.g. Pino, Winston, console) via the `logger` option to integrate with an existing logging pipeline.

```typescript
import { AztecArtifactsApiClient, createConsoleLogger } from '@aztec-artifacts/client';

const client = new AztecArtifactsApiClient({
  baseUrl: 'https://api.aztec-artifacts.org/v1',
  logger: createConsoleLogger('debug'),
});
```

### Using a structured logger (e.g. Pino)

```typescript
import pino from 'pino';
import { AztecArtifactsApiClient } from '@aztec-artifacts/client';

const logger = pino({ level: 'info' });

const client = new AztecArtifactsApiClient({
  baseUrl: 'https://api.aztec-artifacts.org/v1',
  logger,
});
```

Each log call sends a structured object with a `msg` field followed by a plain string, which works for console, Pino, Winston, and other popular libraries. Logging errors are swallowed so they never interfere with client calls.

## Fetching Contracts and Artifacts

### Fetch a Contract Instance

```typescript
import { createDefaultClient, ApiError } from '@aztec-artifacts/client';

const client = createDefaultClient();
try {
  // returns { instance: ContractInstanceWithAddress, artifact?: ContractArtifact }
  const contract = await client.getContract(address, true /* includeArtifact = true */);
  await myPxe.registerContract(contract);
} catch (error) {
  if (error instanceof ApiError) {
    // Handle any API error (404, 400, 500, etc.)
    console.error('API error:', error.message, `(HTTP ${error.status})`);
  } else {
    // Handle PXE or other local errors
    console.error('PXE registration error:', error);
  }
  throw error;
}
```

### Fetch Contract Artifact

```typescript
import { createDefaultClient, ApiError } from '@aztec-artifacts/client';
const client = createDefaultClient();

try {
  const identifier = '0xabc123...'; // identifier can be contractClassId or artifactHash
  const artifact = await client.getArtifact(identifier);
  await myPxe.registerContractClass(artifact);

} catch (error) {
  if (error instanceof ApiError) {
    // Handle any API error (404, 400, 500, etc.)
    console.error('API error:', error.message, `(HTTP ${error.status})`);
  } else {
    // Handle PXE or other local errors
    console.error('PXE registration error:', error);
  }
  throw error;
}
```

## Upload Contracts & Artifacts

### Upload a Contract Artifact

```typescript
import { createDefaultClient } from '@aztec-artifacts/client';
import type { ContractArtifact } from '@aztec/aztec.js';
import { randomContractArtifact } from '@aztec/stdlib/testing';

const artifact: ContractArtifact = randomContractArtifact();

const client = createDefaultClient();
try {
  const result = await client.uploadContractArtifact(artifact);
  console.log('Artifact uploaded:', result);
} catch (error) {
  console.error('Upload failed:', error);
}
```

## Uploading a Contract Instance

```typescript
import { createDefaultClient, type InitializationData } from '@aztec-artifacts/client';
import { randomContractInstanceWithAddress, randomContractArtifact } from '@aztec/stdlib/testing';
import { encodeArguments, type ContractArtifact, type ContractInstanceWithAddress } from '@aztec/aztec.js';

const myArtifact: ContractArtifact = randomContractArtifact();
const myInstance: ContractInstanceWithAddress = await randomContractInstanceWithAddress({ contractClassId: myArtifact.contractClassId });

const client = createDefaultClient();
try {

  // Upload just the contract instance (associated artifact must already exist)
  await client.uploadContractInstance({ instance: myInstance });

  // Upload the instance & artifact together
  // The artifact is required if it doesn't already exist in the repository
  await client.uploadContractInstance({
    instance: myInstance,
    artifact: myArtifact
  });

   // Upload the instance with optional initialization data so that users can see the constructor args
  const initializationData: InitializationData = {
    constructorName: 'my_constructor', // Constructor function name
    encodedArgs: encodeArguments(myFunctionAbi, [arg1, arg2]), // Constructor arguments abi-encoded as Fr[] using encodeArguments() from @aztec/aztec.js
  }
  await client.uploadContractInstance({
    instance: myInstance,
    artifact: myArtifact,
  });

} catch (error) {
  console.error('Upload failed:', error);
}
```

## Bulk Queries

The API supports bulk queries for contract addresses and tokens, with both manual and auto-pagination options.

### Fetch Contract Addresses

```typescript
import { createDefaultClient } from '@aztec-artifacts/client';

const client = createDefaultClient();

// Get paginated contract addresses
const { data, pagination } = await client.getContractAddresses({ limit: 10, cursor: 0 });
console.log('Contract addresses:', data);
console.log('Has more:', pagination.hasMore);

// Get all contract addresses (auto-paginated)
const allAddresses = await client.getAllContractAddresses();
console.log(`Total contract addresses: ${allAddresses.length}`);
console.log('Addresses:', allAddresses);

// Get paginated contract addresses by class ID
const classId = '0x1234...';
const { data, pagination } = await client.getContractAddressesByClassId(classId, {
  match: 'current', // 'current', 'original', or 'any'
  limit: 10,
  cursor: 0,
});
console.log(`Contract addresses matching class ID ${classId}:`, data);
console.log('Has more:', pagination.hasMore);

// Get all contract addresses for a class ID (auto-paginated)
const allClassAddresses = await client.getAllContractAddressesByClassId(classId, { match: 'current' });
console.log(`Total addresses for class ID ${classId}: ${allClassAddresses.length}`);
console.log('Addresses:', allClassAddresses);
```

### Fetch Token Addresses

```typescript
import { createDefaultClient } from '@aztec-artifacts/client';
const client = createDefaultClient();

// Get paginated token list
const tokensPage = await client.getTokens({ limit: 10, cursor: 0 });
console.log('Tokens:', tokensPage.data);
console.log('Has more:', tokensPage.pagination.hasMore);

// Get all tokens (auto-paginated)
const allTokens = await client.getAllTokens();
console.log(`Total tokens: ${allTokens.length}`);

// Get specific token by address
const token = await client.getTokenByAddress('0x1234...');
console.log('Token name:', token.name);
console.log('Token symbol:', token.symbol);
```

### Pagination Examples

### Manual Pagination

```typescript
async function paginateExample() {
  const client = createDefaultClient();
  let cursor = 0;
  const limit = 50;

  // Example: Paginate through contract addresses
  while (true) {
    const response = await client.getContractAddresses({ limit, cursor });

    // Process addresses
    response.data.forEach(address => {
      console.log(`Contract: ${address}`);
    });

    if (!response.pagination.hasMore) break;
    cursor = response.pagination.nextCursor!;
  }
}
```

### Auto-Pagination with Generator

```typescript
async function iterateAllTokens() {
  const client = createDefaultClient();
  
  // Use async generator for memory-efficient iteration
  for await (const token of client.getAllPages(
    (params, options) => client.getTokens(params, options),
    { limit: 100 }
  )) {
    console.log(`Processing token: ${token.symbol}`);
    
    // Process each token individually without loading all into memory
  }
}
```

## Error Handling

The API client provides typed error classes to help identify different error scenarios:

```typescript
import {
  createDefaultClient,
  NotFoundError,
  BadRequestError,
  ConflictError,
  ServerError,
  ApiError
} from '@aztec-artifacts/client';

async function handleErrors() {
  const client = createDefaultClient();

  try {
    const contract = await client.getContract('0x1234...');
    await myPxe.registerContract(contract);
  } catch (error) {
    if (error instanceof NotFoundError) {
      // Handle 404 - contract doesn't exist
      console.error('Contract not found:', error.message);
    } else if (error instanceof BadRequestError) {
      // Handle 400 - invalid address format or parameters
      console.error('Invalid request:', error.message);
    } else if (error instanceof ConflictError) {
      // Handle 409 - contract already exists (for uploads)
      console.error('Resource conflict:', error.message);
    } else if (error instanceof ServerError) {
      // Handle 500+ - server errors
      console.error(`Server error (${error.status}):`, error.message);
    } else if (error instanceof ApiError) {
      // Handle any other API errors
      console.error(`API error (${error.status}):`, error.message);
    } else {
      // Handle unexpected errors
      console.error('Unexpected error:', error);
    }
  }
}

// Example: Uploading with error handling
async function uploadWithErrorHandling() {
  const client = createDefaultClient();

  try {
    await client.uploadContractInstance({
      instance: instance,
      artifact: artifact
    });
    console.log('Upload successful');
  } catch (error) {
    if (error instanceof ConflictError) {
      console.log('Contract already exists in the repository');
      // Optionally continue without error
    } else if (error instanceof BadRequestError) {
      console.error('Invalid contract data:', error.message);
      throw error;
    } else {
      console.error('Upload failed:', error);
      throw error;
    }
  }
}
```

## Advanced Configuration

### Custom Fetch Implementation

```typescript
const client = new AztecArtifactsApiClient({
  baseUrl: 'https://my-custom-api.com/v1',
  headers: {
    'Authorization': 'Bearer your-token',
    'User-Agent': 'MyApp/1.0.0'
  },
  fetch: async (url, options) => {
    // Custom fetch implementation with retry logic, etc.
    return fetch(url, options);
  }
});
```

### Caching

Standard `fetch` options can be passed to control client-side caching behavior.

```typescript
// Use browser cache
const contract = await client.getContract(address, true, {
  cache: 'force-cache'
});

// Disable cache
const freshContract = await client.getContract(address, true, {
  cache: 'no-cache'
});
```
