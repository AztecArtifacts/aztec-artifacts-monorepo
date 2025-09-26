import { createDbClient } from '@aztec-artifacts/schema';
import cors from '@fastify/cors';
import env from '@fastify/env';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';
import Fastify from 'fastify';
import { createLoggerConfig } from './config/logger.js';
import { initializeTelemetry, shutdownTelemetry } from './config/telemetry.js';
import { registerContractRoutes } from './routes/contracts.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerTokenRoutes } from './routes/tokens.js';
import { ContractService } from './services/contract-service.js';
import { TokenService } from './services/token-service.js';
import { createMetrics } from './utils/metrics.js';

const DEFAULT_BODY_LIMIT_MB = 32;
const BYTES_PER_MEGABYTE = 1024 * 1024;

function resolveBodyLimitBytes(rawValue: string | undefined): number {
  if (!rawValue) {
    return DEFAULT_BODY_LIMIT_MB * BYTES_PER_MEGABYTE;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    console.warn(`Invalid BODY_LIMIT_MB value "${rawValue}". Falling back to default ${DEFAULT_BODY_LIMIT_MB}MB.`);
    return DEFAULT_BODY_LIMIT_MB * BYTES_PER_MEGABYTE;
  }

  return parsed * BYTES_PER_MEGABYTE;
}

function normalizePrefix(input?: string): string {
  if (!input) return '';
  const withLeading = input.startsWith('/') ? input : `/${input}`;
  return withLeading.endsWith('/') ? withLeading.slice(0, -1) : withLeading;
}

async function createServer() {
  // Initialize telemetry first
  initializeTelemetry();

  // Configure logger based on environment
  const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
  const logPretty = process.env.LOG_PRETTY === 'true' || process.env.NODE_ENV !== 'production';

  const bodyLimit = resolveBodyLimitBytes(process.env.BODY_LIMIT_MB);

  const fastify = Fastify({
    logger: createLoggerConfig(logLevel, logPretty),
    disableRequestLogging: false, // Enable automatic request/response logging
    requestIdLogLabel: 'reqId',
    bodyLimit,
  });

  // Register plugins
  await fastify.register(env, {
    schema: {
      type: 'object',
      required: ['DATABASE_URL'],
      properties: {
        DATABASE_URL: { type: 'string' },
        PORT: { type: 'string', default: '8080' },
        API_ROUTE_PREFIX: { type: 'string', default: '' },
        LOG_LEVEL: { type: 'string', default: 'info' },
        LOG_PRETTY: { type: 'string', default: 'false' },
        BODY_LIMIT_MB: { type: 'string', default: String(DEFAULT_BODY_LIMIT_MB) },
      },
    },
  });

  await fastify.register(cors, {
    origin: true,
  });

  // Initialize metrics collection
  createMetrics();

  // Add graceful shutdown handlers
  process.on('SIGTERM', async () => {
    fastify.log.info('SIGTERM received, shutting down gracefully...');
    await shutdownTelemetry();
    await fastify.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    fastify.log.info('SIGINT received, shutting down gracefully...');
    await shutdownTelemetry();
    await fastify.close();
    process.exit(0);
  });

  // Create database client
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  const db = createDbClient(databaseUrl);
  const tokenService = new TokenService(db, fastify.log);
  const contractService = new ContractService(db, fastify.log);

  const apiPrefix = normalizePrefix(process.env.API_ROUTE_PREFIX);
  let getSwagger: (() => unknown) | undefined;

  // Register prefixed routes and Swagger under a child instance
  await fastify.register(
    async (app: FastifyInstance) => {
      await app.register(swagger, {
        openapi: {
          openapi: '3.0.0',
          info: {
            title: 'Aztec Artifacts API',
            description: 'ContractArtifact and ContractInstance data service for Aztec',
            version: '1.0.0',
          },
          servers: [
            {
              url: apiPrefix || '/',
              description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
            },
          ],
          tags: [
            { name: 'Tokens', description: 'Token operations' },
            { name: 'Contracts', description: 'Contract operations' },
          ],
          components: {
            securitySchemes: {},
          },
        },
      });

      await app.register(swaggerUi, {
        routePrefix: '/documentation',
        indexPrefix: apiPrefix || '',
        uiConfig: {
          docExpansion: 'list',
          deepLinking: false,
        },
        staticCSP: true,
        transformSpecificationClone: true,
      });

      await registerTokenRoutes(app, tokenService);
      await registerContractRoutes(app, contractService);

      getSwagger = () => app.swagger();
    },
    { prefix: apiPrefix },
  );

  // Register unprefixed routes
  await registerHealthRoutes(fastify, db);

  // Generate OpenAPI spec file if requested
  if (process.env.GENERATE_OPENAPI === 'true') {
    await fastify.ready();
    const spec = typeof getSwagger === 'function' ? getSwagger() : fastify.swagger();
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const specPath = path.join(process.cwd(), 'openapi.generated.json');
    await fs.writeFile(specPath, JSON.stringify(spec, null, 2));
    fastify.log.info(`OpenAPI spec generated at: ${specPath}`);
    process.exit(0);
  }

  return fastify;
}

async function start() {
  const fastify = await createServer();

  try {
    const port = Number.parseInt(process.env.PORT || '8080', 10);
    const host = '0.0.0.0';

    await fastify.listen({ port, host });
    fastify.log.info(`Server running on http://${host}:${port}`);
  } catch (error) {
    fastify.log.error({ error }, 'Error starting server');
    process.exit(1);
  }
}

// Start the server
start();
