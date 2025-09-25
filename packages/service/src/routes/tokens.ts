import type { FastifyInstance } from 'fastify';
import {
  errorResponseSchema,
  paginatedTokenResponseSchema,
  paginationParamsJsonSchema,
  paginationParamsSchema,
  tokenAddressParamsSchema,
  tokenSchema,
  zodToJsonSchema,
} from '../schemas/index.js';
import { convertDbTokenToApi, type TokenService } from '../services/token-service.js';
import { logApiRequest, logApiResponse } from '../utils/logging.js';
import { recordRouteMetrics } from '../utils/metrics.js';
import { createPaginatedResponse } from '../utils/pagination.js';
import { CacheControl, normalizeAddress, sendError, sendJsonResponse } from '../utils/response.js';
import { addSpanAttributes, createHttpSpanAttributes } from '../utils/tracing.js';

export async function registerTokenRoutes(fastify: FastifyInstance, tokenService: TokenService) {
  fastify.get<{
    Querystring: { limit?: string; cursor?: string };
  }>(
    '/tokens',
    {
      schema: {
        tags: ['Tokens'],
        summary: 'List all tokens',
        description: 'Get a paginated list of all tokens',
        querystring: zodToJsonSchema(paginationParamsJsonSchema),
        response: {
          200: zodToJsonSchema(paginatedTokenResponseSchema),
          500: zodToJsonSchema(errorResponseSchema),
        },
      },
    },
    async (request, reply) => {
      const startTime = performance.now();
      logApiRequest(fastify.log, request.method, request.url, undefined, request.query);

      try {
        const { limit, cursor } = paginationParamsSchema.parse(request.query);
        fastify.log.debug({ limit, cursor }, 'Parsed pagination parameters');

        // Add HTTP span attributes
        addSpanAttributes(createHttpSpanAttributes('GET', '/tokens'));
        addSpanAttributes({
          'http.query.limit': limit.toString(),
          'http.query.cursor': cursor.toString(),
        });

        const dbTokens = await tokenService.getTokens(cursor, limit);
        fastify.log.debug({ tokenCount: dbTokens.length }, 'Retrieved tokens from database');

        const apiTokens = dbTokens.map((token) => convertDbTokenToApi(token, true));
        const response = createPaginatedResponse(apiTokens, limit, cursor, (token) => token.id || 0);

        const responseTime = performance.now() - startTime;

        const statusCode = reply.statusCode;
        recordRouteMetrics({
          method: 'GET',
          route: '/tokens',
          statusCode,
          duration: responseTime,
        });

        logApiResponse(fastify.log, request.method, request.url, statusCode, responseTime);

        sendJsonResponse(reply, response);
      } catch (error) {
        const responseTime = performance.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        const statusCode = 500;
        recordRouteMetrics({
          method: 'GET',
          route: '/tokens',
          statusCode,
          duration: responseTime,
          errorMetric: 'route_handler_error',
        });

        fastify.log.error({ error: errorMessage }, 'Failed to query tokens');
        logApiResponse(fastify.log, request.method, request.url, statusCode, responseTime, errorMessage);
        sendError(reply, 500, 'Database error');
      }
    },
  );

  fastify.get<{
    Params: { address: string };
  }>(
    '/tokens/:address',
    {
      schema: {
        tags: ['Tokens'],
        summary: 'Get token by address',
        description: 'Get a token by its address',
        params: zodToJsonSchema(tokenAddressParamsSchema),
        response: {
          200: zodToJsonSchema(tokenSchema),
          400: zodToJsonSchema(errorResponseSchema),
          404: zodToJsonSchema(errorResponseSchema),
          500: zodToJsonSchema(errorResponseSchema),
        },
      },
    },
    async (request, reply) => {
      const startTime = performance.now();
      const { address } = tokenAddressParamsSchema.parse(request.params);

      try {
        // Add HTTP span attributes
        addSpanAttributes(createHttpSpanAttributes('GET', '/tokens/:address'));
        addSpanAttributes({
          'token.address': address,
        });

        const normalized = normalizeAddress(address);
        const dbToken = await tokenService.getTokenByAddress(normalized);

        const responseTime = performance.now() - startTime;

        if (!dbToken) {
          const statusCode = 404;
          recordRouteMetrics({
            method: 'GET',
            route: '/tokens/:address',
            statusCode,
            duration: responseTime,
          });
          return sendError(reply, 404, 'Token not found');
        }

        // Record success metrics
        const statusCode = 200;
        recordRouteMetrics({
          method: 'GET',
          route: '/tokens/:address',
          statusCode,
          duration: responseTime,
        });

        const token = convertDbTokenToApi(dbToken);
        sendJsonResponse(reply, token, CacheControl.PUBLIC_5MIN);
      } catch (error) {
        const responseTime = performance.now() - startTime;

        if (error instanceof Error && error.message.includes('Invalid address format')) {
          const statusCode = 400;
          recordRouteMetrics({
            method: 'GET',
            route: '/tokens/:address',
            statusCode,
            duration: responseTime,
          });
          return sendError(reply, 400, 'Invalid address format');
        }

        const statusCode = 500;
        recordRouteMetrics({
          method: 'GET',
          route: '/tokens/:address',
          statusCode,
          duration: responseTime,
          errorMetric: 'route_handler_error',
        });

        fastify.log.error({ error }, 'Failed to query token');
        sendError(reply, 500, 'Database error');
      }
    },
  );
}
