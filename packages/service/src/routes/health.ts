import type { DbClient } from '@aztec-artifacts/schema';
import type { FastifyInstance } from 'fastify';
import {
  healthResponseSchema,
  readyResponseSchema,
  unavailableResponseSchema,
  zodToJsonSchema,
} from '../schemas/index.js';
import { CacheControl, sendJsonResponse } from '../utils/response.js';

export async function registerHealthRoutes(fastify: FastifyInstance, db: DbClient) {
  fastify.get(
    '/health',
    {
      logLevel: 'silent', // Disable logging for health check
      schema: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Check if the service is healthy',
        response: {
          200: zodToJsonSchema(healthResponseSchema),
        },
      },
    },
    async (_request, reply) => {
      sendJsonResponse(reply, { status: 'healthy' }, CacheControl.NO_CACHE);
    },
  );

  fastify.get(
    '/ready',
    {
      logLevel: 'silent', // Disable logging for readiness check
      schema: {
        tags: ['Health'],
        summary: 'Readiness check',
        description: 'Check if the service is ready (including database connectivity)',
        response: {
          200: zodToJsonSchema(readyResponseSchema),
          503: zodToJsonSchema(unavailableResponseSchema),
        },
      },
    },
    async (_request, reply) => {
      try {
        await db.execute('SELECT 1');
        sendJsonResponse(reply, { status: 'ready' }, CacheControl.NO_CACHE);
      } catch (error) {
        fastify.log.error({ error }, 'Database connection failed');
        reply.code(503);
        sendJsonResponse(
          reply,
          {
            status: 'unavailable',
            error: 'Database connection failed',
          },
          CacheControl.NO_CACHE,
        );
      }
    },
  );
}
