# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Aztec Artifacts is a TypeScript monorepo providing API services and type-safe client libraries for interacting with the Aztec privacy-focused blockchain network. The system manages contract artifacts, contract instances, tokens, and function selectors.

## Package Manager & Workspace

- **Package manager**: pnpm (v10.17.1+)
- **Workspace**: All packages in `packages/*`
- **Monorepo commands**: Run from root using `pnpm -r` (recursive) or `pnpm --filter <package>`

## Common Commands

### Development Workflow
```bash
# Install dependencies
pnpm install

# Build all packages (builds in dependency order)
pnpm build

# Run all tests
pnpm test

# Typecheck all packages
pnpm typecheck

# Lint and format with Biome
pnpm check

# Clean everything
pnpm clean
```

### Running a Single Test
```bash
# From package directory
cd packages/service
pnpm test -- <test-file-name>

# Or from root with filter
pnpm --filter @aztec-artifacts/service test -- <test-file-name>
```

### Package-Specific Development

**Service (API server)**:
```bash
cd packages/service
pnpm dev                    # Start development server with tsx
pnpm generate               # Generate OpenAPI spec file
pnpm coverage              # Run tests with coverage
```

**Client**:
```bash
cd packages/client
pnpm generate              # Generate OpenAPI types from service spec
pnpm test:watch           # Run tests in watch mode
pnpm docs                 # Generate TypeDoc documentation
```

**Schema (Database)**:
```bash
cd packages/schema
pnpm generate             # Generate Drizzle migrations
pnpm migrate              # Run migrations
pnpm studio              # Open Drizzle Studio
```

**Inspector (Web UI)**:
```bash
cd packages/inspector
pnpm dev                 # Start Vite dev server
pnpm preview            # Preview production build
```

### Docker Compose
```bash
docker-compose up         # Start postgres, migrations, API, and inspector
```

Default services:
- PostgreSQL: `localhost:5432`
- API: `localhost:8080`
- Inspector UI: `localhost:4173`
- Swagger docs: `http://localhost:8080/documentation`

## Architecture

### Package Dependencies

```
common (lightweight Aztec codecs & serialization)
  ↓
schema (Drizzle ORM models, database client)
  ↓
service (Fastify API server)
  ↓
client (type-safe API client with OpenAPI types)
  ↓
inspector (web UI using client)
```

### Core Packages

**`@aztec-artifacts/common`**
- Lightweight serialization/deserialization for Aztec primitives
- Contract artifact codecs, contract instance helpers
- Shared types between client and server
- Zero database dependencies

**`@aztec-artifacts/schema`**
- PostgreSQL schemas via Drizzle ORM
- Database client factory (`createDbClient`)
- Migration scripts
- Exports: `./schema`, `./client`

**`@aztec-artifacts/service`**
- Fastify REST API with OpenTelemetry observability
- Routes: `/tokens`, `/contracts`, `/selectors`, `/health`
- Services pattern: `TokenService`, `ContractService`, `SelectorService`
- OpenAPI/Swagger documentation generation
- Environment-based configuration (see `@fastify/env` schema in `src/index.ts`)

**`@aztec-artifacts/client`**
- Type-safe client wrapping raw fetch-based API calls
- OpenAPI-generated types from service spec
- High-level methods returning Aztec.js primitives (`ContractArtifact`, `ContractInstanceWithAddress`)
- Automatic pagination helpers

**`@aztec-artifacts/inspector`**
- Minimal Vite-based web UI
- Uses `@aztec-artifacts/client` for API interactions
- Configured via `INSPECTOR_BASE_URL` environment variable

### Key Patterns

**OpenAPI Type Generation Flow**:
1. Service defines Zod schemas in `packages/service/src/schemas/`
2. Run `pnpm --filter @aztec-artifacts/service generate` to create `openapi.generated.json`
3. Client runs `openapi-typescript` to generate `src/types.ts` from the spec
4. Client provides type-safe wrapper around raw API responses

**Service Layer Architecture**:
- Routes (`routes/`) register endpoints with schemas
- Services (`services/`) contain business logic and database interactions
- Utils (`utils/`) provide shared helpers (pagination, response formatting, tracing)
- All services receive a Drizzle `db` client and Pino `logger` instance

**Database Migrations**:
- Schema changes go in `packages/schema/src/schema/`
- Run `pnpm --filter @aztec-artifacts/schema generate` to create migration SQL
- Docker Compose automatically runs migrations on startup
- Manual: `pnpm --filter @aztec-artifacts/schema migrate`

## Environment Variables

**Service** (`packages/service`):
- `DATABASE_URL` (required): PostgreSQL connection string
- `PORT` (default: 8080): HTTP server port
- `API_ROUTE_PREFIX` (default: ""): Prefix for all API routes
- `LOG_LEVEL` (default: "info"): Pino log level
- `LOG_PRETTY` (default: "false"): Enable pretty-printed logs
- `BODY_LIMIT_MB` (default: 32): Max request body size
- `GENERATE_OPENAPI` (default: "false"): Generate OpenAPI spec and exit

**Inspector** (`packages/inspector`):
- `INSPECTOR_BASE_URL`: API base URL (e.g., `http://api:8080`)
- `PORT` (default: 4173): Preview server port

## Testing

- Test framework: Vitest
- Test files: `*.test.ts` co-located with source
- Setup files: `packages/service/src/test/setup.ts`
- Coverage: `pnpm coverage` in any package

## Observability

The service package includes:
- **Logging**: Pino with structured JSON logging
- **Tracing**: OpenTelemetry with OTLP exporters
- **Metrics**: Custom Prometheus-style metrics via `@opentelemetry/sdk-metrics`
- Configuration in `src/config/telemetry.ts` and `src/config/logger.ts`

## Code Quality

- **Linter/Formatter**: Biome (configured in `biome.json`)
- Run `pnpm check` to fix issues automatically
- TypeScript strict mode enabled (`tsconfig.base.json`)

## Changesets

Versioning managed via `@changesets/cli`:
```bash
pnpm changeset          # Create a changeset
pnpm version           # Bump versions and update changelog
pnpm publish-packages  # Publish to npm
```
