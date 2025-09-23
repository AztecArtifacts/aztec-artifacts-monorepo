import { z } from 'zod';

// Health schemas
export const healthResponseSchema = z.object({
  status: z.enum(['healthy']),
});

export const readyResponseSchema = z.object({
  status: z.enum(['ready']),
});

export const unavailableResponseSchema = z.object({
  status: z.enum(['unavailable']),
  error: z.string(),
});

// Token schemas
export const tokenSchema = z.object({
  id: z.number().optional(),
  symbol: z.string(),
  name: z.string(),
  decimals: z.number(),
  address: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid L2 address format'),
});

// For runtime validation with transforms
export const paginationParamsSchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 100;
      const num = Number.parseInt(val, 10);
      return Math.min(Math.max(1, num), 1000);
    }),
  cursor: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 0;
      return Number.parseInt(val, 10);
    }),
});

// For OpenAPI documentation (without transforms)
export const paginationParamsJsonSchema = z.object({
  limit: z.string().optional().describe('Maximum number of items to return (1-1000)'),
  cursor: z.string().optional().describe('Cursor for pagination'),
});

export const paginationResponseSchema = z.object({
  limit: z.number(),
  cursor: z.number().optional(),
  nextCursor: z.number().optional(),
  hasMore: z.boolean(),
});

export const paginatedTokenResponseSchema = z.object({
  data: z.array(tokenSchema),
  pagination: paginationResponseSchema,
});

export const errorResponseSchema = z.object({
  error: z.string(),
});

export const tokenAddressParamsSchema = z.object({
  address: z.string(),
});

// Contract schemas exports
export {
  // API-specific schemas and types
  type apiContractAddressParams as ContractAddressParams,
  type apiContractArtifact as ContractArtifact,
  type apiContractArtifactParams as ContractArtifactParams,
  type apiContractClassIdParams as ContractClassIdParams,
  type apiContractClassInstanceMatch as ContractClassInstanceMatch,
  type apiContractClassInstancesQueryParams as ContractClassInstancesQueryParams,
  type apiContractInstance as ContractInstance,
  type apiContractInstancesResponse as ContractInstancesResponse,
  type apiContractQueryParams as ContractQueryParams,
  contractAddressParamsSchema,
  contractArtifactParamsSchema,
  contractArtifactSchema,
  contractClassIdParamsSchema,
  contractClassInstanceMatchSchema,
  contractClassInstancesQueryParamsJsonSchema,
  contractClassInstancesQueryParamsSchema,
  contractInstanceSchema,
  contractInstancesResponseSchema,
  contractQueryParamsJsonSchema,
  contractQueryParamsSchema,
  type UploadContractArtifact,
  type UploadContractArtifactResponse,
  type UploadContractInstance,
  type UploadContractInstanceResponse,
  uploadContractArtifactResponseSchema,
  uploadContractArtifactSchema,
  uploadContractInstanceResponseSchema,
  uploadContractInstanceSchema,
} from './contracts.js';

// Export types
export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type ReadyResponse = z.infer<typeof readyResponseSchema>;
export type UnavailableResponse = z.infer<typeof unavailableResponseSchema>;
export type Token = z.infer<typeof tokenSchema>;
export type PaginationParams = z.infer<typeof paginationParamsSchema>;
export type PaginationResponse = z.infer<typeof paginationResponseSchema>;
export type PaginatedTokenResponse = z.infer<typeof paginatedTokenResponseSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type TokenAddressParams = z.infer<typeof tokenAddressParamsSchema>;

// Convert Zod schemas to JSON Schema for OpenAPI
export function zodToJsonSchema(schema: z.ZodSchema, options?: Parameters<typeof z.toJSONSchema>[1]) {
  return z.toJSONSchema(schema, {
    target: 'openapi-3.0',
    ...options,
  });
}
