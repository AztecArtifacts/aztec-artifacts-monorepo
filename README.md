# Aztec Artifacts

A TypeScript monorepo for interacting with the Aztec network, providing API services and type-safe client libraries for privacy-focused blockchain operations.

## Architecture

- **`api-service`** - Fastify REST API with PostgreSQL, OpenTelemetry observability
- **`api-client`** - Type-safe client library with OpenAPI-generated types
- **`api-common`** - Shared database schemas and utilities (Drizzle ORM)

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test
```

## Development

- **Package manager**: pnpm
- **Code quality**: Biome (lint/format)
- **Database**: PostgreSQL with Drizzle ORM
- **API docs**: Swagger UI available when running api-service
- **Docker**: Local development setup available

## Scripts

- `pnpm dev` - Start all services in development mode
- `pnpm build` - Build all packages
- `pnpm test` - Run all tests
- `pnpm lint` / `pnpm format` - Code quality checks
- `pnpm clean` - Clean build artifacts

## License

Apache-2.0
