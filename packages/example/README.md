# Aztec Artifacts API Client Examples

Comprehensive examples demonstrating all features of the `@aztec-artifacts/client` package.

## Overview

This package contains organized examples showing how to use the Aztec Artifacts API client to:

- Upload and fetch contract artifacts
- Query token information
- List and filter contract addresses
- Work with function selectors

## Structure

The examples are split into separate modules for clarity:

- **[upload-artifacts.ts](./src/upload-artifacts.ts)** - Upload contract artifacts
- **[fetch-artifacts.ts](./src/fetch-artifacts.ts)** - Retrieve contract artifacts by ID
- **[fetch-tokens.ts](./src/fetch-tokens.ts)** - Query tokens with pagination
- **[fetch-contract-addresses.ts](./src/fetch-contract-addresses.ts)** - List and filter contract addresses
- **[fetch-selectors.ts](./src/fetch-selectors.ts)** - Work with function selectors
- **[index.ts](./src/index.ts)** - Main orchestrator that runs all examples in sequence

## Running the Examples

### Prerequisites

1. Start the API server (see main repository README)
2. Ensure PostgreSQL is running

### Run All Examples

```bash
# From repository root
pnpm --filter @aztec-artifacts/example dev

# Or from this package directory
cd packages/example
pnpm dev
```

### Run Built Examples

```bash
# Build first
pnpm build

# Then run
pnpm start
```

### Configuration

Set the API base URL via environment variable (defaults to `http://localhost:8080`):

```bash
API_BASE_URL=http://localhost:8080 pnpm dev
```

## Example Coverage

### 1. Upload Artifacts
- Upload multiple contract artifacts
- Handle conflicts (artifact already exists)

### 2. Fetch Artifacts
- Retrieve artifacts by contract class ID
- Fetch artifact metadata and functions

### 3. Token Operations
- Paginated token listing
- Fetch all tokens (automatic pagination)
- Get specific token by address

### 4. Contract Addresses
- Paginated address listing
- Get all addresses (automatic pagination)
- Filter addresses by contract class ID
- Use different match types (current, original, any)

### 5. Function Selectors
- Get all selectors for a contract artifact
- Look up function signatures by selector
- Find all artifacts implementing a specific selector
- Compare selector overlap between contracts

## Example Output

When you run the examples, you'll see detailed output for each operation:

```
═══════════════════════════════════════════════════════════
   Aztec Artifacts API Client - Comprehensive Examples
═══════════════════════════════════════════════════════════

API URL: http://localhost:8080

=== UPLOADING CONTRACT ARTIFACTS ===

Uploading 3 contract artifacts...

📦 Uploading ShieldGateway contract artifact...
✅ ShieldGateway uploaded successfully!
   Contract Class ID: 0x1234...

...

✨ All examples completed successfully!
```

## Using Individual Examples

Each example module exports a function that accepts an `AztecArtifactsApiClient` instance:

```typescript
import { AztecArtifactsApiClient } from '@aztec-artifacts/client';
import { fetchTokens } from './fetch-tokens.js';

const client = new AztecArtifactsApiClient({
  baseUrl: 'http://localhost:8080',
});

await fetchTokens(client);
```

This modular structure makes it easy to:
- Run specific examples independently
- Use examples as templates for your own code
- Test individual features

## Notes

- Contract instance upload/fetch examples are not included as they require additional setup
- All examples include comprehensive error handling
- The examples demonstrate both paginated and automatic "get all" patterns
