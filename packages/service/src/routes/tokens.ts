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
      const route = '/tokens';

      // Debug: Log incoming request details
      fastify.log.debug(
        {
          method: 'GET',
          route,
          query: request.query,
          url: request.url,
          raw: {
            query: JSON.stringify(request.query),
          },
        },
        'Incoming request to /tokens',
      );

      logApiRequest(fastify.log, request.method, request.url, undefined, request.query);

      try {
        // Debug: Log before parsing query params
        fastify.log.debug(
          {
            rawQuery: request.query,
            queryType: typeof request.query,
            queryKeys: Object.keys(request.query || {}),
          },
          'About to parse pagination params',
        );

        const { limit, cursor } = paginationParamsSchema.parse(request.query);

        // Debug: Log parsed pagination params
        fastify.log.debug(
          {
            parsedLimit: limit,
            parsedCursor: cursor,
            limitType: typeof limit,
            cursorType: typeof cursor,
          },
          'Successfully parsed pagination parameters',
        );

        // Add HTTP span attributes
        addSpanAttributes(createHttpSpanAttributes('GET', '/tokens'));
        addSpanAttributes({
          'http.query.limit': limit.toString(),
          'http.query.cursor': cursor.toString(),
        });

        // Debug: Log before database call
        fastify.log.debug(
          {
            cursor,
            limit,
            operation: 'getTokens',
          },
          'Calling tokenService.getTokens',
        );

        const dbTokens = await tokenService.getTokens(cursor, limit);

        // Debug: Log database response
        fastify.log.debug(
          {
            tokenCount: dbTokens.length,
            firstTokenId: dbTokens[0]?.id,
            lastTokenId: dbTokens[dbTokens.length - 1]?.id,
          },
          'Database query completed - retrieved tokens',
        );

        // Debug: Log before conversion
        fastify.log.debug(
          {
            tokenCount: dbTokens.length,
            operation: 'convertDbTokenToApi',
          },
          'Converting DB tokens to API format',
        );

        const apiTokens = dbTokens.map((token) => convertDbTokenToApi(token, true));
        const response = createPaginatedResponse(apiTokens, limit, cursor, (token) => token.id || 0);

        // Debug: Log successful response
        const responseTime = performance.now() - startTime;
        fastify.log.debug(
          {
            tokenCount: apiTokens.length,
            paginationLimit: response.pagination.limit,
            paginationCursor: response.pagination.cursor,
            paginationNextCursor: response.pagination.nextCursor,
            paginationHasMore: response.pagination.hasMore,
            duration: responseTime,
          },
          'Successfully processed tokens request',
        );

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

        // Enhanced error logging
        const errorDetails = {
          errorType: error?.constructor?.name,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          errorString: String(error),
          requestQuery: request.query,
          requestUrl: request.url,
        };

        const statusCode = 500;
        recordRouteMetrics({
          method: 'GET',
          route: '/tokens',
          statusCode,
          duration: responseTime,
          errorMetric: 'route_handler_error',
        });

        fastify.log.error(errorDetails, 'Failed to query tokens - full error details');
        logApiResponse(fastify.log, request.method, request.url, statusCode, responseTime, errorDetails.errorMessage);
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
      const route = '/tokens/:address';

      // Debug: Log incoming request details
      fastify.log.debug(
        {
          method: 'GET',
          route,
          params: request.params,
          url: request.url,
          raw: {
            params: JSON.stringify(request.params),
          },
        },
        'Incoming request to /tokens/:address',
      );

      // Debug: Log before parsing params
      fastify.log.debug(
        {
          rawParams: request.params,
          paramType: typeof request.params,
          paramKeys: Object.keys(request.params || {}),
        },
        'About to parse token address params',
      );

      const { address } = tokenAddressParamsSchema.parse(request.params);

      // Debug: Log parsed address
      fastify.log.debug(
        {
          parsedAddress: address,
          addressLength: address?.length,
          addressType: typeof address,
        },
        'Successfully parsed token address param',
      );

      try {
        // Add HTTP span attributes
        addSpanAttributes(createHttpSpanAttributes('GET', '/tokens/:address'));
        addSpanAttributes({
          'token.address': address,
        });

        // Debug: Log before normalization
        fastify.log.debug(
          {
            originalAddress: address,
            operation: 'normalizeAddress',
          },
          'Normalizing token address',
        );

        const normalized = normalizeAddress(address);

        // Debug: Log normalized address
        fastify.log.debug(
          {
            originalAddress: address,
            normalizedAddress: normalized,
            addressChanged: address !== normalized,
          },
          'Address normalization completed',
        );

        // Debug: Log before database call
        fastify.log.debug(
          {
            normalizedAddress: normalized,
            operation: 'getTokenByAddress',
          },
          'Calling tokenService.getTokenByAddress',
        );

        const dbToken = await tokenService.getTokenByAddress(normalized);

        // Debug: Log database response
        fastify.log.debug(
          {
            dbTokenFound: !!dbToken,
            dbTokenKeys: dbToken ? Object.keys(dbToken) : null,
            dbTokenId: dbToken?.id,
            dbTokenAddress: dbToken?.address,
          },
          'Database query completed',
        );

        const responseTime = performance.now() - startTime;

        if (!dbToken) {
          fastify.log.debug(
            {
              address: normalized,
              duration: responseTime,
              statusCode: 404,
            },
            'Token not found in database',
          );

          const statusCode = 404;
          recordRouteMetrics({
            method: 'GET',
            route: '/tokens/:address',
            statusCode,
            duration: responseTime,
          });
          return sendError(reply, 404, 'Token not found');
        }

        // Debug: Log before conversion
        fastify.log.debug(
          {
            dbTokenId: dbToken.id,
            operation: 'convertDbTokenToApi',
          },
          'Converting DB token to API format',
        );

        const token = convertDbTokenToApi(dbToken);

        // Debug: Log successful response
        fastify.log.debug(
          {
            responseKeys: Object.keys(token),
            responseAddress: token.address,
            duration: responseTime,
          },
          'Successfully processed token request',
        );

        // Record success metrics
        const statusCode = 200;
        recordRouteMetrics({
          method: 'GET',
          route: '/tokens/:address',
          statusCode,
          duration: responseTime,
        });

        sendJsonResponse(reply, token, CacheControl.PUBLIC_5MIN);
      } catch (error) {
        const responseTime = performance.now() - startTime;

        // Enhanced error logging
        const errorDetails = {
          errorType: error?.constructor?.name,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          errorString: String(error),
          requestParams: request.params,
          requestUrl: request.url,
        };

        if (error instanceof Error && error.message.includes('Invalid address format')) {
          fastify.log.debug(errorDetails, 'Invalid address format error');

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

        fastify.log.error(errorDetails, 'Failed to query token - full error details');
        sendError(reply, 500, 'Database error');
      }
    },
  );
}
