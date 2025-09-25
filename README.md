# Aztec Artifacts

A TypeScript monorepo for interacting with the Aztec network, providing API services and type-safe client libraries for privacy-focused blockchain operations.

## Architecture

- **`service`** - Fastify REST API with PostgreSQL, OpenTelemetry observability
- **`client`** - Type-safe client library with OpenAPI-generated types
- **`common`** - Shared types and utilities between client and server
- **`schema`** - Shared database schemas and utilities (Drizzle ORM)

## Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## Development

- **Package manager**: pnpm
- **Code quality**: Biome (lint/format)
- **Database**: PostgreSQL with Drizzle ORM
- **API docs**: Swagger UI available when running service
- **Docker**: Local development setup available

## Scripts

- `pnpm build` - Build all packages
- `pnpm test` - Run all tests
- `pnpm check` - Lint & format code with Biome
- `pnpm clean` - Clean build artifacts & node_modules
