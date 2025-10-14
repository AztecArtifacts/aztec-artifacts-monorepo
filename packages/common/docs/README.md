**@aztec-artifacts/common v0.1.12**

***

# @aztec-artifacts/common

Lightweight Aztec codec and serialization helpers shared across API clients and services.

## Installation

```bash
pnpm install @aztec-artifacts/common
```

## Features

- **Codec** - Encoding/decoding utilities for Aztec data structures
- **Type Conversions** - Convert between Aztec.js types and simplified representations
- **Contract Instance** - Contract instance management utilities
- **Artifact Handling** - Contract artifact parsing and validation
- **Error Types** - Common error definitions for Aztec operations
- **Type Definitions** - Shared TypeScript types and schemas

## Usage

```typescript
import { codec, convert, types } from '@aztec-artifacts/common';

// Or import specific modules
import { encodeContractInstance } from '@aztec-artifacts/common/contract-instance';
import { parseArtifact } from '@aztec-artifacts/common/artifact';
```

## Development

```bash
# Build
pnpm run build

# Run tests
pnpm run test

# Watch mode
pnpm run dev
```
