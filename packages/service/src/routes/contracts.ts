import type { Hex } from '@aztec-artifacts/common';
import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import {
  type ContractClassInstanceMatch,
  contractAddressParamsSchema,
  contractArtifactParamsSchema,
  contractArtifactSchema,
  contractClassIdParamsSchema,
  contractClassInstancesQueryParamsJsonSchema,
  contractClassInstancesQueryParamsSchema,
  contractInstanceSchema,
  contractQueryParamsJsonSchema,
  contractQueryParamsSchema,
  errorResponseSchema,
  paginatedContractAddressesResponseSchema,
  paginationParamsJsonSchema,
  paginationParamsSchema,
  type UploadContractArtifact,
  type UploadContractInstance,
  uploadContractArtifactResponseSchema,
  uploadContractArtifactSchema,
  uploadContractInstanceResponseSchema,
  uploadContractInstanceSchema,
  zodToJsonSchema,
} from '../schemas/index.js';
import {
  ContractInstanceError,
  type ContractService,
  convertDbArtifactToApi,
  convertDbContractInstanceToApi,
} from '../services/contract-service.js';
import { recordRouteMetrics } from '../utils/metrics.js';
import { CacheControl, sendError, sendJsonResponse } from '../utils/response.js';

interface ErrorResolution {
  statusCode: number;
  message: string;
}

const CONTRACT_INSTANCE_ERROR_STATUS = new Map<ContractInstanceError, ErrorResolution>([
  [ContractInstanceError.ArtifactMismatch, { statusCode: 409, message: ContractInstanceError.ArtifactMismatch }],
  [ContractInstanceError.MissingArtifactData, { statusCode: 400, message: ContractInstanceError.MissingArtifactData }],
  [
    ContractInstanceError.MissingCurrentArtifact,
    { statusCode: 400, message: ContractInstanceError.MissingCurrentArtifact },
  ],
  [
    ContractInstanceError.MissingOriginalArtifact,
    { statusCode: 400, message: ContractInstanceError.MissingOriginalArtifact },
  ],
]);

function resolveContractInstanceError(error: unknown): ErrorResolution | null {
  if (!(error instanceof Error)) {
    return null;
  }

  const mapped = CONTRACT_INSTANCE_ERROR_STATUS.get(error.message as ContractInstanceError);
  if (mapped) {
    return mapped;
  }

  if (error.message.startsWith('Invalid public keys')) {
    return { statusCode: 400, message: error.message };
  }

  const lowerMessage = error.message.toLowerCase();

  if (lowerMessage.includes('invalid address format')) {
    return { statusCode: 400, message: 'Invalid address format' };
  }

  if (lowerMessage.includes('json') || lowerMessage.includes('parse') || lowerMessage.includes('schema')) {
    return { statusCode: 400, message: `Invalid artifact format: ${error.message}` };
  }

  if (lowerMessage.includes('artifact') || lowerMessage.includes('contract')) {
    return { statusCode: 400, message: `Invalid contract artifact: ${error.message}` };
  }

  return null;
}

function resolveArtifactCreationError(error: unknown): ErrorResolution | null {
  if (!(error instanceof Error)) {
    return null;
  }

  const lowerMessage = error.message.toLowerCase();

  if (lowerMessage.includes('json') || lowerMessage.includes('parse') || lowerMessage.includes('schema')) {
    return { statusCode: 400, message: `Invalid artifact format: ${error.message}` };
  }

  if (lowerMessage.includes('artifact') || lowerMessage.includes('contract')) {
    return { statusCode: 400, message: `Invalid contract artifact: ${error.message}` };
  }

  return null;
}

export async function registerContractRoutes(fastify: FastifyInstance, contractService: ContractService) {
  fastify.get<{
    Params: { address: string };
    Querystring: { includeArtifact?: string };
  }>(
    '/contracts/:address',
    {
      schema: {
        tags: ['Contracts'],
        summary: 'Get contract instance by address',
        description: 'Get a contract instance by its address, optionally including artifact data',
        params: zodToJsonSchema(contractAddressParamsSchema),
        querystring: zodToJsonSchema(contractQueryParamsJsonSchema),
        response: {
          200: zodToJsonSchema(contractInstanceSchema),
          400: zodToJsonSchema(errorResponseSchema),
          404: zodToJsonSchema(errorResponseSchema),
          500: zodToJsonSchema(errorResponseSchema),
        },
      },
    },
    async (request, reply) => {
      const startTime = performance.now();
      const route = '/contracts/:address';

      // Debug: Log incoming request details
      fastify.log.debug(
        {
          method: 'GET',
          route,
          params: request.params,
          query: request.query,
          headers: request.headers,
          url: request.url,
          raw: {
            params: JSON.stringify(request.params),
            query: JSON.stringify(request.query),
          },
        },
        'Incoming request to /contracts/:address',
      );

      try {
        // Debug: Log before parsing params
        fastify.log.debug(
          {
            rawParams: request.params,
            paramType: typeof request.params,
            paramKeys: Object.keys(request.params || {}),
          },
          'About to parse address params',
        );

        const { address } = contractAddressParamsSchema.parse(request.params);

        // Debug: Log parsed address
        fastify.log.debug(
          {
            parsedAddress: address,
            addressLength: address?.length,
            addressType: typeof address,
          },
          'Successfully parsed address param',
        );

        // Debug: Log before parsing query params
        fastify.log.debug(
          {
            rawQuery: request.query,
            queryType: typeof request.query,
            queryKeys: Object.keys(request.query || {}),
          },
          'About to parse query params',
        );

        const { includeArtifact } = contractQueryParamsSchema.parse(request.query);

        // Debug: Log parsed query params
        fastify.log.debug(
          {
            includeArtifact,
            includeArtifactType: typeof includeArtifact,
          },
          'Successfully parsed query params',
        );

        // Debug: Log before database call
        fastify.log.debug(
          {
            address,
            operation: 'getContractInstance',
          },
          'Calling contractService.getContractInstance',
        );

        const dbInstance = await contractService.getContractInstance(address);

        // Debug: Log database response
        fastify.log.debug(
          {
            dbInstanceFound: !!dbInstance,
            dbInstanceKeys: dbInstance ? Object.keys(dbInstance) : null,
            dbInstanceAddress: dbInstance?.address,
            dbInstanceId: dbInstance?.id,
          },
          'Database query completed',
        );

        if (!dbInstance) {
          const duration = performance.now() - startTime;
          fastify.log.debug(
            {
              address,
              duration,
              statusCode: 404,
            },
            'Contract instance not found in database',
          );
          recordRouteMetrics({ method: 'GET', route, statusCode: 404, duration });
          return sendError(reply, 404, 'Contract instance not found');
        }

        let artifact = null;
        if (includeArtifact) {
          // Debug: Log before artifact fetch
          fastify.log.debug(
            {
              dbInstanceId: dbInstance.id,
              operation: 'getContractArtifactByInstance',
            },
            'Fetching artifact for instance',
          );

          artifact = await contractService.getContractArtifactByInstance(dbInstance);

          // Debug: Log artifact fetch result
          fastify.log.debug(
            {
              artifactFound: !!artifact,
              artifactKeys: artifact ? Object.keys(artifact) : null,
            },
            'Artifact fetch completed',
          );
        }

        // Debug: Log before conversion
        fastify.log.debug(
          {
            dbInstanceId: dbInstance.id,
            includeArtifact,
            hasArtifact: !!artifact,
          },
          'Converting DB instance to API format',
        );

        const instance = convertDbContractInstanceToApi(dbInstance, includeArtifact, artifact || undefined);

        // Debug: Log successful response
        fastify.log.debug(
          {
            responseKeys: Object.keys(instance),
            responseAddress: instance.address,
            duration: performance.now() - startTime,
          },
          'Successfully processed contract instance request',
        );

        // Contract instances are immutable once deployed
        const duration = performance.now() - startTime;
        recordRouteMetrics({ method: 'GET', route, statusCode: 200, duration });
        return sendJsonResponse(reply, instance, CacheControl.IMMUTABLE);
      } catch (error) {
        // Enhanced error logging with proper type handling
        const errorDetails = {
          errorType: error?.constructor?.name,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          errorString: String(error),
          isZodError: error instanceof ZodError,
          zodIssues: error instanceof ZodError ? error.issues : undefined,
          requestParams: request.params,
          requestQuery: request.query,
          requestUrl: request.url,
        };

        if (error instanceof ZodError) {
          fastify.log.debug(
            {
              ...errorDetails,
              zodIssues: error.issues,
              zodFlattened: error.flatten(),
            },
            'Zod validation error in /contracts/:address',
          );

          const duration = performance.now() - startTime;
          recordRouteMetrics({ method: 'GET', route, statusCode: 400, duration });
          return sendError(reply, 400, 'Invalid address format');
        }

        if (error instanceof Error && error.message.includes('Invalid address format')) {
          fastify.log.debug(errorDetails, 'Invalid address format error');

          const duration = performance.now() - startTime;
          recordRouteMetrics({ method: 'GET', route, statusCode: 400, duration });
          return sendError(reply, 400, 'Invalid address format');
        }

        // Log full error details for debugging
        fastify.log.error(errorDetails, 'Failed to query contract instance - full error details');

        const duration = performance.now() - startTime;
        recordRouteMetrics({ method: 'GET', route, statusCode: 500, duration, errorMetric: 'route_handler_error' });
        return sendError(reply, 500, 'Database error');
      }
    },
  );

  fastify.get<{
    Querystring: { limit?: string; cursor?: string };
  }>(
    '/contracts/addresses',
    {
      schema: {
        tags: ['Contracts'],
        summary: 'List all contract addresses',
        description: 'Get a paginated list of all contract addresses',
        querystring: zodToJsonSchema(paginationParamsJsonSchema),
        response: {
          200: zodToJsonSchema(paginatedContractAddressesResponseSchema),
          500: zodToJsonSchema(errorResponseSchema),
        },
      },
    },
    async (request, reply) => {
      const startTime = performance.now();
      const route = '/contracts/addresses';

      try {
        const { limit, cursor } = paginationParamsSchema.parse(request.query);

        const result = await contractService.getContractAddresses(cursor, limit);

        // Create items with IDs for pagination
        const itemsWithIds = result.items.map((item) => ({
          address: item.address,
          id: item.id,
        }));

        // Extract just addresses for response and use items for getting IDs
        const addresses = itemsWithIds.map((item) => item.address);
        const response = {
          data: addresses.slice(0, result.hasMore ? addresses.length : addresses.length),
          pagination: {
            limit,
            ...(cursor > 0 && { cursor }),
            ...(result.hasMore && itemsWithIds.length > 0 && { nextCursor: itemsWithIds[itemsWithIds.length - 1]?.id }),
            hasMore: result.hasMore,
          },
        };

        // Contract addresses are immutable, cache for a reasonable time
        const duration = performance.now() - startTime;
        recordRouteMetrics({ method: 'GET', route, statusCode: 200, duration });
        return sendJsonResponse(reply, response, CacheControl.PUBLIC_5MIN);
      } catch (error) {
        fastify.log.error({ error }, 'Failed to query contract addresses');
        const duration = performance.now() - startTime;
        recordRouteMetrics({ method: 'GET', route, statusCode: 500, duration, errorMetric: 'route_handler_error' });
        return sendError(reply, 500, 'Database error');
      }
    },
  );

  fastify.get<{
    Params: { identifier: string };
  }>(
    '/artifacts/:identifier',
    {
      schema: {
        tags: ['Contracts'],
        summary: 'Get contract artifact by identifier',
        description: 'Get a contract artifact by contract class ID or artifact hash',
        params: zodToJsonSchema(contractArtifactParamsSchema),
        response: {
          200: zodToJsonSchema(contractArtifactSchema),
          400: zodToJsonSchema(errorResponseSchema),
          404: zodToJsonSchema(errorResponseSchema),
          500: zodToJsonSchema(errorResponseSchema),
        },
      },
    },
    async (request, reply) => {
      const startTime = performance.now();
      const route = '/artifacts/:identifier';

      const identifierResult = contractArtifactParamsSchema.safeParse(request.params);
      if (!identifierResult.success) {
        const duration = performance.now() - startTime;
        recordRouteMetrics({ method: 'GET', route, statusCode: 400, duration });
        return sendError(reply, 400, 'Invalid identifier format - must be a 66 character hex string');
      }

      const { identifier } = identifierResult.data;

      try {
        const dbArtifact = await contractService.getContractArtifact(identifier);

        if (!dbArtifact) {
          const duration = performance.now() - startTime;
          recordRouteMetrics({ method: 'GET', route, statusCode: 404, duration });
          return sendError(reply, 404, 'Contract artifact not found');
        }

        const artifact = convertDbArtifactToApi(dbArtifact);

        // Contract artifacts are immutable
        const duration = performance.now() - startTime;
        recordRouteMetrics({ method: 'GET', route, statusCode: 200, duration });
        return sendJsonResponse(reply, artifact, CacheControl.IMMUTABLE);
      } catch (error) {
        fastify.log.error({ error }, 'Failed to query contract artifact');
        const duration = performance.now() - startTime;
        recordRouteMetrics({ method: 'GET', route, statusCode: 500, duration, errorMetric: 'route_handler_error' });
        return sendError(reply, 500, 'Database error');
      }
    },
  );

  fastify.get<{
    Params: { contractClassId: string };
    Querystring: { match?: 'current' | 'original' | 'any'; limit?: string; cursor?: string };
  }>(
    '/contracts/by-class/:contractClassId/addresses',
    {
      schema: {
        tags: ['Contracts'],
        summary: 'Get contract addresses for a class',
        description:
          'Get a paginated list of contract instance addresses that match the given contract class ID with configurable match scope',
        params: zodToJsonSchema(contractClassIdParamsSchema),
        querystring: {
          ...zodToJsonSchema(contractClassInstancesQueryParamsJsonSchema),
          ...zodToJsonSchema(paginationParamsJsonSchema),
        },
        response: {
          200: zodToJsonSchema(paginatedContractAddressesResponseSchema),
          400: zodToJsonSchema(errorResponseSchema),
          500: zodToJsonSchema(errorResponseSchema),
        },
      },
    },
    async (request, reply) => {
      const startTime = performance.now();
      const route = '/contracts/by-class/:contractClassId/addresses';

      const contractClassResult = contractClassIdParamsSchema.safeParse(request.params);
      if (!contractClassResult.success) {
        const duration = performance.now() - startTime;
        recordRouteMetrics({ method: 'GET', route, statusCode: 400, duration });
        return sendError(reply, 400, 'Invalid contract class ID format - must be a 66 character hex string');
      }

      const queryResult = contractClassInstancesQueryParamsSchema.safeParse(request.query);
      if (!queryResult.success) {
        const duration = performance.now() - startTime;
        recordRouteMetrics({ method: 'GET', route, statusCode: 400, duration });
        return sendError(reply, 400, 'Invalid match parameter');
      }

      const { contractClassId } = contractClassResult.data;
      const { match } = queryResult.data;
      const matchScope: ContractClassInstanceMatch = match ?? 'current';

      // Parse pagination params
      const { limit, cursor } = paginationParamsSchema.parse(request.query);

      try {
        const result = await contractService.getContractInstancesByClassId(contractClassId, matchScope, cursor, limit);

        // Create items with IDs for pagination
        const itemsWithIds = result.items.map((item) => ({
          address: item.address,
          id: item.id,
        }));

        // Extract just addresses for response and use items for getting IDs
        const addresses = itemsWithIds.map((item) => item.address);
        const response = {
          data: addresses,
          pagination: {
            limit,
            ...(cursor > 0 && { cursor }),
            ...(result.hasMore && itemsWithIds.length > 0 && { nextCursor: itemsWithIds[itemsWithIds.length - 1]?.id }),
            hasMore: result.hasMore,
          },
        };

        // Contract instances are immutable, cache for a reasonable time
        const duration = performance.now() - startTime;
        recordRouteMetrics({ method: 'GET', route, statusCode: 200, duration });
        return sendJsonResponse(reply, response, CacheControl.PUBLIC_5MIN);
      } catch (error) {
        fastify.log.error({ error }, 'Failed to query contract instances by class ID');
        const duration = performance.now() - startTime;
        recordRouteMetrics({ method: 'GET', route, statusCode: 500, duration, errorMetric: 'route_handler_error' });
        return sendError(reply, 500, 'Database error');
      }
    },
  );

  fastify.post<{
    Body: UploadContractInstance;
  }>(
    '/contracts',
    {
      schema: {
        tags: ['Contracts'],
        summary: 'Upload contract instance',
        description: 'Upload a contract instance and persist its metadata',
        body: zodToJsonSchema(uploadContractInstanceSchema),
        response: {
          200: zodToJsonSchema(uploadContractInstanceResponseSchema),
          201: zodToJsonSchema(uploadContractInstanceResponseSchema),
          400: zodToJsonSchema(errorResponseSchema),
          409: zodToJsonSchema(errorResponseSchema),
          500: zodToJsonSchema(errorResponseSchema),
        },
      },
    },
    async (request, reply) => {
      const startTime = performance.now();
      const route = '/contracts';

      try {
        const payload = uploadContractInstanceSchema.parse(request.body);
        const { instance: dbInstance, created } = await contractService.createContractInstance(payload);

        const response = {
          address: dbInstance.address,
          currentContractClassId: dbInstance.currentContractClassId,
        };

        const statusCode = created ? 201 : 200;
        const duration = performance.now() - startTime;
        recordRouteMetrics({ method: 'POST', route, statusCode, duration });

        return reply.status(statusCode).header('Cache-Control', CacheControl.NO_CACHE).send(response);
      } catch (error) {
        if (error instanceof ZodError) {
          const duration = performance.now() - startTime;
          recordRouteMetrics({ method: 'POST', route, statusCode: 400, duration });
          return sendError(reply, 400, 'Invalid contract instance payload');
        }

        const resolved = resolveContractInstanceError(error);
        if (resolved) {
          const duration = performance.now() - startTime;
          recordRouteMetrics({
            method: 'POST',
            route,
            statusCode: resolved.statusCode,
            duration,
            errorMetric: resolved.statusCode >= 500 ? 'route_handler_error' : undefined,
          });
          return sendError(reply, resolved.statusCode, resolved.message);
        }

        fastify.log.error({ error }, 'Failed to create contract instance');
        const duration = performance.now() - startTime;
        recordRouteMetrics({ method: 'POST', route, statusCode: 500, duration, errorMetric: 'route_handler_error' });
        return sendError(reply, 500, 'Database error');
      }
    },
  );

  fastify.post<{
    Body: UploadContractArtifact;
  }>(
    '/artifacts',
    {
      schema: {
        tags: ['Contracts'],
        summary: 'Upload contract artifact',
        description: 'Upload a new contract artifact to the database',
        body: zodToJsonSchema(uploadContractArtifactSchema),
        response: {
          201: zodToJsonSchema(uploadContractArtifactResponseSchema),
          400: zodToJsonSchema(errorResponseSchema),
          409: zodToJsonSchema(errorResponseSchema),
          500: zodToJsonSchema(errorResponseSchema),
        },
      },
    },
    async (request, reply) => {
      const startTime = performance.now();
      const route = '/artifacts';

      try {
        const { artifact } = uploadContractArtifactSchema.parse(request.body);

        // Validate and create the contract artifact
        const dbArtifact = await contractService.createContractArtifact(artifact as Hex);

        // Return only the contract class ID
        const response = {
          contractClassId: dbArtifact.contractClassId,
        };

        // Return 201 for created resource
        const duration = performance.now() - startTime;
        recordRouteMetrics({ method: 'POST', route, statusCode: 201, duration });
        return reply.status(201).send(response);
      } catch (error) {
        if (error instanceof ZodError) {
          const duration = performance.now() - startTime;
          recordRouteMetrics({ method: 'POST', route, statusCode: 400, duration });
          return sendError(reply, 400, 'Invalid contract artifact payload');
        }

        const resolved = resolveArtifactCreationError(error);
        if (resolved) {
          const duration = performance.now() - startTime;
          recordRouteMetrics({
            method: 'POST',
            route,
            statusCode: resolved.statusCode,
            duration,
            errorMetric: resolved.statusCode >= 500 ? 'route_handler_error' : undefined,
          });
          return sendError(reply, resolved.statusCode, resolved.message);
        }

        fastify.log.error({ error }, 'Failed to create contract artifact');
        const duration = performance.now() - startTime;
        recordRouteMetrics({ method: 'POST', route, statusCode: 500, duration, errorMetric: 'route_handler_error' });
        return sendError(reply, 500, 'Database error');
      }
    },
  );
}
