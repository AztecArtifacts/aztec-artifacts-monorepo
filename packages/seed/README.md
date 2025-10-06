# @aztec-artifacts/seed

Utility for seeding Aztec contract artifacts to the Aztec Artifacts API.

## Usage

### Basic Usage

Seed all artifacts to the default API (http://localhost:8080):

```bash
pnpm seed
# or
pnpm start
```

### Custom API URL

To seed to a different API endpoint:

```bash
API_BASE_URL=https://api.example.com pnpm seed
```

## Architecture

The seeding script uses a modular approach for managing artifacts:

```
src/
├── seed-artifacts.ts       # Main seeding script
└── artifacts/
    ├── index.ts            # Combines all artifact sources
    ├── noir-contracts.ts   # Production contracts from @aztec/noir-contracts.js
    └── noir-test-contracts.ts  # Test contracts from @aztec/noir-test-contracts.js
```

### Adding New Artifact Sources

To add artifacts from a new package:

1. Create a new file in `src/artifacts/` (e.g., `my-contracts.ts`)
2. Export an `ARTIFACTS` array from that file:
   ```typescript
   export const ARTIFACTS = [
     MyContractArtifact,
     AnotherContractArtifact,
     // ...
   ];
   ```
3. Import and spread it in `src/artifacts/index.ts`:
   ```typescript
   import { ARTIFACTS as MY_CONTRACTS } from './my-contracts.js';

   export const ARTIFACTS = [
     ...NOIR_CONTRACTS,
     ...NOIR_TEST_CONTRACTS,
     ...MY_CONTRACTS,  // Add your new artifacts here
   ];
   ```

## Included Artifacts

Currently seeds artifacts from:
- `@aztec/noir-contracts.js` - 33 production contracts
- `@aztec/noir-test-contracts.js` - 28 test contracts

Total: 61 contract artifacts

## Development

### Build

```bash
pnpm build
```

### Type Check

```bash
pnpm typecheck
```

### Clean

```bash
pnpm clean
```