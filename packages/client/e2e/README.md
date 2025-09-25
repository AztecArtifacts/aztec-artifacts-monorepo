# E2E Tests for Aztec Artifacts API Client

This directory contains end-to-end tests for the `@aztec-artifacts/client` package. These tests verify the client's ability to upload and fetch Contract Artifacts and Contract Instances from a running API service.

## Prerequisites

1. **Start the API Service** (in another terminal):
   ```bash
   cd packages/service
   pnpm dev
   ```

2. **Set up the database** (if not already done):
   ```bash
   cd packages/schema
   pnpm migrate
   ```

## Running Tests

### Quick Start (using the test runner script)

```bash
# Run against localhost (default)
./e2e/run-e2e-tests.sh

# Run against a custom API URL
./e2e/run-e2e-tests.sh http://localhost:4000

# Run against production
./e2e/run-e2e-tests.sh https://api.aztec-artifacts.org/v1
```

### Running Individual Tests

You can run tests individually with tsx:

```bash
# Set the API URL (optional, defaults to http://localhost:3000)
export API_URL=http://localhost:3000

# Run artifact tests only
tsx e2e/artifact-tests.ts

# Run instance tests only
tsx e2e/instance-tests.ts

# Run full workflow tests
tsx e2e/full-workflow.ts
```

## Test Suites

### 1. Artifact Tests (`artifact-tests.ts`)
Tests for Contract Artifact operations:
- Upload a new artifact
- Fetch artifact by contract class ID
- Fetch artifact by artifact hash
- Handle duplicate uploads (idempotency)
- Error handling for non-existent artifacts
- Bulk artifact uploads and verification

### 2. Instance Tests (`instance-tests.ts`)
Tests for Contract Instance operations:
- Upload instance with artifact
- Upload instance without artifact (when artifact exists)
- Fetch instance with and without artifact
- Multiple instances sharing the same artifact
- Bulk queries and pagination
- Query instances by contract class ID

### 3. Full Workflow Tests (`full-workflow.ts`)
Real-world usage scenarios:
- Complete deployment workflow simulation
- Multiple developers interacting with contracts
- Error handling scenarios
- Caching behavior testing
- Default vs custom client configuration

## Environment Variables

- `API_URL`: The URL of the API service (default: `http://localhost:3000`)

## Test Output

Tests provide detailed output showing:
- 🔧 Test setup and configuration
- 📤 Upload operations
- 📥 Fetch operations
- ✅ Successful operations
- ❌ Failed operations with error details
- 📊 Summary statistics

## Troubleshooting

If tests fail to connect to the API:
1. Ensure the API service is running (`cd packages/service && pnpm dev`)
2. Check the DATABASE_URL is configured correctly
3. Verify the API URL is correct (default: http://localhost:3000)
4. Check API health endpoint: `curl http://localhost:3000/health`

## Adding New Tests

To add new E2E tests:
1. Create a new TypeScript file in the `e2e` directory
2. Import the client from `../src/index.js`
3. Use the `API_URL` environment variable for configuration
4. Follow the existing test structure for consistency
5. Add the test to `run-e2e-tests.sh` if it should run in the suite