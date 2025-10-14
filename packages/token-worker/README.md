# Token Metadata Worker

Background worker service for asynchronously processing token metadata.

## Overview

The token metadata worker is a standalone service that polls the `token_metadata_queue` table and fetches metadata (name, symbol, decimals) for token contracts. It runs independently from the main API service to avoid blocking contract instance uploads.

## Features

- **Asynchronous Processing**: Processes token metadata in the background without blocking the API
- **Retry Logic**: Automatically retries failed jobs with configurable attempt limits
- **Queue-based**: Uses a PostgreSQL queue table for reliable job processing
- **Graceful Shutdown**: Handles SIGTERM and SIGINT signals for clean shutdowns
- **Configurable Polling**: Adjustable poll interval and batch size

## Architecture

When a token contract instance is created via the API:
1. An entry is created in the `tokens` table
2. A job is queued in the `token_metadata_queue` table
3. The worker polls for pending jobs
4. Metadata is fetched (currently returns static values)
5. The `tokens` table is updated with the metadata
6. The job is marked as completed

## Configuration

Environment variables:

```bash
# Database connection
DATABASE_URL=postgresql://user:password@localhost:5432/aztec_artifacts

# Worker settings
WORKER_POLL_INTERVAL_MS=5000  # How often to poll for jobs (milliseconds)
WORKER_BATCH_SIZE=10          # Number of jobs to process per batch
WORKER_JOB_LEASE_MS=60000     # How long a worker owns a job before it can be reclaimed

# Logging
LOG_LEVEL=info               # fatal, error, warn, info, debug, trace
LOG_PRETTY=false             # Enable pretty printing for development
```

## Running the Worker

### Development

```bash
pnpm dev
```

### Production

```bash
pnpm build
pnpm start
```

### Docker

The worker can be deployed using the existing Dockerfile with a build argument:

```bash
docker build --build-arg SERVICE=token-worker -t token-worker .
docker run --env-file .env token-worker
```

## Database Schema

The worker uses two tables:

### `token_metadata_queue`

Queue table for tracking metadata jobs:
- `id` - Job ID
- `address` - Token contract address
- `status` - pending, processing, completed, failed, unsupported
- `attempts` - Number of processing attempts
- `max_attempts` - Maximum retry limit (default: 3)
- `last_error` - Error message from last failure
- `created_at`, `updated_at`, `processed_at` - Timestamps

### `tokens`

Token metadata storage:
- `id` - Token ID
- `address` - Token contract address (unique)
- `name` - Token name
- `symbol` - Token symbol
- `decimals` - Token decimals
- `created_at`, `updated_at` - Timestamps

## Static Metadata

Currently, the worker returns static placeholder values:

```typescript
{
  name: "name",
  symbol: "symbol",
  decimals: 18
}
```

These will be replaced with actual blockchain queries in a future update.

## Development

### Running Tests

```bash
pnpm test
```

### Type Checking

```bash
pnpm typecheck
```

### Linting

```bash
pnpm lint
```

## Future Enhancements

- [ ] Replace static values with actual blockchain queries
- [ ] Add metrics and monitoring
- [ ] Implement exponential backoff for retries
- [ ] Add support for custom token standards
- [ ] Handle tokens that don't implement optional methods gracefully
