import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import {
  errorResponseSchema,
  functionSelectorParamsSchema,
  functionSelectorResponseSchema,
  paginatedSelectorResponseSchema,
  paginationParamsJsonSchema,
  paginationParamsSchema,
  selectorArtifactsResponseSchema,
  zodToJsonSchema,
} from '../schemas/index.js';
import type { SelectorService } from '../services/selector-service.js';
import { logApiRequest, logApiResponse } from '../utils/logging.js';
import { recordRouteMetrics } from '../utils/metrics.js';
import { createPaginatedResponse } from '../utils/pagination.js';
import { CacheControl, sendError, sendJsonResponse } from '../utils/response.js';
import { addSpanAttributes, createHttpSpanAttributes } from '../utils/tracing.js';

export async function registerSelectorRoutes(fastify: FastifyInstance, selectorService: SelectorService) {
  // GET /selectors - List all selectors with pagination
  fastify.get<{
    Querystring: { limit?: string; cursor?: string };
  }>(
    '/selectors',
    {
      schema: {
        tags: ['Selectors'],
        summary: 'List all selectors',
        description: 'Get a paginated list of all function selectors',
        querystring: zodToJsonSchema(paginationParamsJsonSchema),
        response: {
          200: zodToJsonSchema(paginatedSelectorResponseSchema),
          400: zodToJsonSchema(errorResponseSchema),
          500: zodToJsonSchema(errorResponseSchema),
        },
      },
    },
    async (request, reply) => {
      const startTime = performance.now();
      const route = '/selectors';

      logApiRequest(fastify.log, request.method, request.url, undefined, request.query);

      try {
        const { limit, cursor } = paginationParamsSchema.parse(request.query);

        addSpanAttributes(createHttpSpanAttributes('GET', route));
        addSpanAttributes({
          'http.query.limit': limit.toString(),
          'http.query.cursor': cursor.toString(),
        });

        const dbSelectors = await selectorService.getAllSelectors(cursor, limit + 1);

        // Convert to API format, including the 0x prefix for selectors
        const apiSelectors = dbSelectors.slice(0, limit).map((selector) => ({
          id: selector.id,
          selector: selector.selector.startsWith('0x') ? selector.selector : `0x${selector.selector}`,
          signature: selector.signature,
        }));

        const response = createPaginatedResponse(apiSelectors, limit, cursor, (selector) => selector.id || 0);

        const duration = performance.now() - startTime;
        const statusCode = 200;
        recordRouteMetrics({ method: 'GET', route, statusCode, duration });
        logApiResponse(fastify.log, request.method, request.url, statusCode, duration);

        return sendJsonResponse(reply.code(statusCode), response, CacheControl.PUBLIC_5MIN);
      } catch (error) {
        const duration = performance.now() - startTime;
        const isValidationError = error instanceof ZodError;
        const statusCode = isValidationError ? 400 : 500;
        const message = isValidationError ? 'Invalid query parameters' : 'Failed to fetch selectors';

        recordRouteMetrics({
          method: 'GET',
          route,
          statusCode,
          duration,
          errorMetric: isValidationError ? undefined : 'route_handler_error',
        });

        fastify.log.error(
          {
            error,
            route,
            query: request.query,
            statusCode,
          },
          'Selector list failed',
        );

        logApiResponse(
          fastify.log,
          request.method,
          request.url,
          statusCode,
          duration,
          error instanceof Error ? error.message : String(error),
        );

        return sendError(reply, statusCode, message);
      }
    },
  );

  // GET /selectors/:selector - Get signatures for a specific selector
  fastify.get<{ Params: { selector: string } }>(
    '/selectors/:selector',
    {
      schema: {
        tags: ['Selectors'],
        summary: 'Get signatures for a selector',
        description: 'Return every function signature that has been observed for a selector',
        params: zodToJsonSchema(functionSelectorParamsSchema),
        response: {
          200: zodToJsonSchema(functionSelectorResponseSchema),
          400: zodToJsonSchema(errorResponseSchema),
          500: zodToJsonSchema(errorResponseSchema),
        },
      },
    },
    async (request, reply) => {
      const startTime = performance.now();
      const route = '/selectors/:selector';

      logApiRequest(fastify.log, request.method, request.url, request.params);

      try {
        const { selector } = functionSelectorParamsSchema.parse(request.params);
        const normalizedSelector = selector.toLowerCase();

        addSpanAttributes(createHttpSpanAttributes('GET', route));
        addSpanAttributes({ 'http.params.selector': normalizedSelector });

        const signatures = await selectorService.getSignaturesForSelector(normalizedSelector);
        const responsePayload = {
          selector: normalizedSelector,
          signatures,
        };

        const duration = performance.now() - startTime;
        const statusCode = 200;
        recordRouteMetrics({ method: 'GET', route, statusCode, duration });
        logApiResponse(fastify.log, request.method, request.url, statusCode, duration);

        return sendJsonResponse(reply.code(statusCode), responsePayload, CacheControl.PUBLIC_5MIN);
      } catch (error) {
        const duration = performance.now() - startTime;
        const isValidationError = error instanceof ZodError;
        const statusCode = isValidationError ? 400 : 500;
        const message = isValidationError ? 'Invalid selector parameter' : 'Failed to lookup selector';

        recordRouteMetrics({
          method: 'GET',
          route,
          statusCode,
          duration,
          errorMetric: isValidationError ? undefined : 'route_handler_error',
        });

        fastify.log.error(
          {
            error,
            route,
            selector: request.params?.selector,
            statusCode,
          },
          'Selector lookup failed',
        );

        logApiResponse(
          fastify.log,
          request.method,
          request.url,
          statusCode,
          duration,
          error instanceof Error ? error.message : String(error),
        );

        return sendError(reply, statusCode, message);
      }
    },
  );

  fastify.get<{ Params: { selector: string } }>(
    '/selectors/:selector/artifacts',
    {
      schema: {
        tags: ['Selectors'],
        summary: 'Get artifacts for a selector',
        description: 'Return every contract artifact (contractClassId) that implements this function selector',
        params: zodToJsonSchema(functionSelectorParamsSchema),
        response: {
          200: zodToJsonSchema(selectorArtifactsResponseSchema),
          400: zodToJsonSchema(errorResponseSchema),
          500: zodToJsonSchema(errorResponseSchema),
        },
      },
    },
    async (request, reply) => {
      const startTime = performance.now();
      const route = '/selectors/:selector/artifacts';

      logApiRequest(fastify.log, request.method, request.url, request.params);

      try {
        const { selector } = functionSelectorParamsSchema.parse(request.params);
        const normalizedSelector = selector.toLowerCase();

        addSpanAttributes(createHttpSpanAttributes('GET', route));
        addSpanAttributes({ 'http.params.selector': normalizedSelector });

        const contractClassIds = await selectorService.getArtifactsForSelector(normalizedSelector);
        const responsePayload = {
          selector: normalizedSelector,
          contractClassIds,
        };

        const duration = performance.now() - startTime;
        const statusCode = 200;
        recordRouteMetrics({ method: 'GET', route, statusCode, duration });
        logApiResponse(fastify.log, request.method, request.url, statusCode, duration);

        return sendJsonResponse(reply.code(statusCode), responsePayload, CacheControl.PUBLIC_5MIN);
      } catch (error) {
        const duration = performance.now() - startTime;
        const isValidationError = error instanceof ZodError;
        const statusCode = isValidationError ? 400 : 500;
        const message = isValidationError ? 'Invalid selector parameter' : 'Failed to lookup selector artifacts';

        recordRouteMetrics({
          method: 'GET',
          route,
          statusCode,
          duration,
          errorMetric: isValidationError ? undefined : 'route_handler_error',
        });

        fastify.log.error(
          {
            error,
            route,
            selector: request.params?.selector,
            statusCode,
          },
          'Selector artifacts lookup failed',
        );

        logApiResponse(
          fastify.log,
          request.method,
          request.url,
          statusCode,
          duration,
          error instanceof Error ? error.message : String(error),
        );

        return sendError(reply, statusCode, message);
      }
    },
  );
}
