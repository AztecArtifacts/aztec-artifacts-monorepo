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
  contractInstancesResponseSchema,
  contractQueryParamsJsonSchema,
  contractQueryParamsSchema,
  errorResponseSchema,
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
import { CacheControl, sendError, sendJsonResponse } from '../utils/response.js';

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
      try {
        const { address } = contractAddressParamsSchema.parse(request.params);
        const { includeArtifact } = contractQueryParamsSchema.parse(request.query);

        const dbInstance = await contractService.getContractInstance(address);

        if (!dbInstance) {
          return sendError(reply, 404, 'Contract instance not found');
        }

        let artifact = null;
        if (includeArtifact) {
          artifact = await contractService.getContractArtifactByInstance(dbInstance);
        }

        const instance = convertDbContractInstanceToApi(dbInstance, includeArtifact, artifact || undefined);

        // Contract instances are immutable once deployed
        sendJsonResponse(reply, instance, CacheControl.IMMUTABLE);
      } catch (error) {
        if (error instanceof ZodError) {
          return sendError(reply, 400, 'Invalid address format');
        }

        if (error instanceof Error && error.message.includes('Invalid address format')) {
          return sendError(reply, 400, 'Invalid address format');
        }

        fastify.log.error({ error }, 'Failed to query contract instance');
        sendError(reply, 500, 'Database error');
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
      const { identifier } = contractArtifactParamsSchema.parse(request.params);

      try {
        // Validate identifier format (should be 66 character hex string)
        if (!/^0x[a-fA-F0-9]{64}$/.test(identifier)) {
          return sendError(reply, 400, 'Invalid identifier format - must be a 66 character hex string');
        }

        const dbArtifact = await contractService.getContractArtifact(identifier);

        if (!dbArtifact) {
          return sendError(reply, 404, 'Contract artifact not found');
        }

        const artifact = convertDbArtifactToApi(dbArtifact);

        // Contract artifacts are immutable
        sendJsonResponse(reply, artifact, CacheControl.IMMUTABLE);
      } catch (error) {
        fastify.log.error({ error }, 'Failed to query contract artifact');
        sendError(reply, 500, 'Database error');
      }
    },
  );

  fastify.get<{
    Params: { contractClassId: string };
    Querystring: { match?: 'current' | 'original' | 'any' };
  }>(
    '/contracts/by-class/:contractClassId/addresses',
    {
      schema: {
        tags: ['Contracts'],
        summary: 'Get contract addresses for a class',
        description:
          'Get all contract instance addresses that match the given contract class ID with configurable match scope',
        params: zodToJsonSchema(contractClassIdParamsSchema),
        querystring: zodToJsonSchema(contractClassInstancesQueryParamsJsonSchema),
        response: {
          200: zodToJsonSchema(contractInstancesResponseSchema),
          400: zodToJsonSchema(errorResponseSchema),
          500: zodToJsonSchema(errorResponseSchema),
        },
      },
    },
    async (request, reply) => {
      const { contractClassId } = contractClassIdParamsSchema.parse(request.params);
      const { match } = contractClassInstancesQueryParamsSchema.parse(request.query);
      const matchScope: ContractClassInstanceMatch = match ?? 'current';

      try {
        // Validate contractClassId format
        if (!/^0x[a-fA-F0-9]{64}$/.test(contractClassId)) {
          return sendError(reply, 400, 'Invalid contract class ID format - must be a 66 character hex string');
        }

        const addresses = await contractService.getContractInstancesByClassId(contractClassId, matchScope);

        // Contract instances are immutable, cache for a reasonable time
        sendJsonResponse(reply, addresses, CacheControl.PUBLIC_5MIN);
      } catch (error) {
        fastify.log.error({ error }, 'Failed to query contract instances by class ID');
        sendError(reply, 500, 'Database error');
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
      try {
        const payload = uploadContractInstanceSchema.parse(request.body);
        const {
          instance: dbInstance,
          artifact: dbArtifact,
          created,
        } = await contractService.createContractInstance(payload);

        const includeArtifact = Boolean(dbArtifact);
        const apiInstance = convertDbContractInstanceToApi(dbInstance, includeArtifact, dbArtifact ?? undefined);

        return reply
          .status(created ? 201 : 200)
          .header('Cache-Control', CacheControl.NO_CACHE)
          .send(apiInstance);
      } catch (error) {
        if (error instanceof ZodError) {
          return sendError(reply, 400, 'Invalid contract instance payload');
        }

        if (error instanceof Error) {
          if (error.message === ContractInstanceError.ArtifactMismatch) {
            return sendError(reply, 409, error.message);
          }

          if (
            error.message === ContractInstanceError.MissingArtifactData ||
            error.message === ContractInstanceError.MissingCurrentArtifact ||
            error.message === ContractInstanceError.MissingOriginalArtifact ||
            error.message.startsWith('Invalid public keys')
          ) {
            return sendError(reply, 400, error.message);
          }

          if (error.message.includes('JSON') || error.message.includes('parse') || error.message.includes('schema')) {
            return sendError(reply, 400, `Invalid artifact format: ${error.message}`);
          }

          if (error.message.includes('artifact') || error.message.includes('contract')) {
            return sendError(reply, 400, `Invalid contract artifact: ${error.message}`);
          }

          if (error.message.includes('Invalid address format')) {
            return sendError(reply, 400, error.message);
          }
        }

        fastify.log.error({ error }, 'Failed to create contract instance');
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
      try {
        const { artifact } = uploadContractArtifactSchema.parse(request.body);

        // Validate and create the contract artifact
        const dbArtifact = await contractService.createContractArtifact(artifact);

        // Convert to API response format
        const apiArtifact = convertDbArtifactToApi(dbArtifact);

        // Return 201 for created resource
        reply.status(201).send(apiArtifact);
      } catch (error) {
        if (error instanceof Error) {
          // Handle parsing errors
          if (error.message.includes('JSON') || error.message.includes('parse') || error.message.includes('schema')) {
            return sendError(reply, 400, `Invalid artifact format: ${error.message}`);
          }

          // Handle validation errors from Aztec stdlib
          if (error.message.includes('artifact') || error.message.includes('contract')) {
            return sendError(reply, 400, `Invalid contract artifact: ${error.message}`);
          }
        }

        fastify.log.error({ error }, 'Failed to create contract artifact');
        sendError(reply, 500, 'Database error');
      }
    },
  );
}
