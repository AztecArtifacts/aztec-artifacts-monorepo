import { z } from 'zod';

/**
 * IMPORTANT: OpenAPI/JSON Schema Compatibility Note
 *
 * We cannot use Aztec's built-in schemas (AztecAddress.schema, Fr.schema, etc.)
 * directly in our OpenAPI definitions because:
 *
 * 1. Aztec schemas use ZodEffects with transform functions that return class instances
 * 2. OpenAPI/JSON Schema only supports primitive JSON-serializable types
 * 3. The zodToJsonSchema converter cannot process these transforms, resulting in errors
 *
 * Solution: We use hex string serialization for complex Aztec types:
 * - ContractInstance → Custom serialization using Aztec utilities → hex strings
 * - ContractArtifact → contractArtifactToBuffer → hex string
 *
 * This approach:
 * - Maintains type safety through Aztec's official serialization
 * - Simplifies the wire format to just hex strings
 * - Reduces API complexity and payload size
 * - Enables proper OpenAPI documentation generation
 */

// 256-bit hex string regex (0x + 64 hex chars)
const hex256 = /^0x[a-fA-F0-9]{64}$/;

// 2048-bit hex string regex (0x + 8 * 64 hex chars)
const hex2048 = /^0x[a-fA-F0-9]{512}$/;

const hex = /^0x[a-fA-F0-9]+$/;

// Simplified Initialization Data Schema
export const initializationDataSchema = z
  .object({
    constructorName: z.string(),
    encodedArgs: z.array(z.string().regex(hex256)).optional(),
  })
  .optional()
  .nullable();

const publicKeysInputSchema = z
  .string()
  .regex(hex2048)
  .describe('Public keys as hex string (use PublicKeys.toString() for serialization)');

const uploadArtifactInputSchema = z.string().regex(hex).describe('Serialized ContractArtifact as hex string');

const uploadContractInstancePayloadSchema = z.object({
  address: z.string().regex(hex256).describe('Aztec address as hex string'),
  version: z.number().int().min(1).optional().describe('Contract class version'),
  salt: z.string().regex(hex256).describe('Salt as hex string'),
  deployer: z.string().regex(hex256).describe('Deployer address as hex string'),
  currentContractClassId: z.string().regex(hex256).describe('Current contract class ID as hex string'),
  originalContractClassId: z.string().regex(hex256).describe('Original contract class ID as hex string'),
  initializationHash: z.string().regex(hex256).describe('Initialization hash as hex string'),
  publicKeys: publicKeysInputSchema,
  initializationData: initializationDataSchema,
});

// Contract Instance Schema using standard Zod types for OpenAPI compatibility
export const contractInstanceSchema = z.object({
  // Database-specific fields
  id: z.number().optional(),

  // Core Aztec fields as hex strings for API transport
  address: z.string().regex(hex256).describe('Aztec address as hex string'),
  version: z.number(),
  salt: z.string().regex(hex256).describe('Salt as hex string'),
  deployer: z.string().regex(hex256).describe('Deployer address as hex string'),
  currentContractClassId: z.string().regex(hex256).describe('Current contract class ID as hex string'),
  originalContractClassId: z.string().regex(hex256).describe('Original contract class ID as hex string'),
  initializationHash: z.string().regex(hex256).describe('Initialization hash as hex string'),
  publicKeys: z
    .string()
    .regex(hex2048)
    .describe('Public keys as concatenated hex string (use PublicKeys.toString() / fromString() for conversion)'),
  // API-specific fields
  initializationData: initializationDataSchema,

  // Optional artifact field as serialized hex string
  artifact: z.string().optional().describe('Serialized ContractArtifact as hex string'),

  // Token detection field
  isToken: z.boolean().optional().describe('Whether this contract instance is a token contract'),
});

// Contract Artifact Schema using standard Zod types for OpenAPI compatibility
export const contractArtifactSchema = z.object({
  id: z.number().optional(),
  artifactHash: z.string().regex(hex256).describe('Artifact hash as hex string'),
  contractClassId: z.string().regex(hex256).describe('Contract class ID as hex string'),
  artifact: z.string().describe('Serialized ContractArtifact as hex string'),
  isToken: z.boolean().optional().describe('Whether this contract artifact is a token contract'),
});

// Query Parameters
export const contractQueryParamsSchema = z.object({
  includeArtifact: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

// For OpenAPI documentation (without transforms)
export const contractQueryParamsJsonSchema = z.object({
  includeArtifact: z.string().optional().describe('Include artifact data in the response (true/false)'),
});

// Response schemas
export const contractInstancesResponseSchema = z
  .array(z.string().regex(hex256).describe('Contract address as hex string'))
  .describe('List of contract addresses as hex strings');

// Pagination response schema for contract addresses
export const paginatedContractAddressesResponseSchema = z.object({
  data: z.array(z.string().regex(hex256).describe('Contract address as hex string')),
  pagination: z.object({
    limit: z.number(),
    cursor: z.number().optional(),
    nextCursor: z.number().optional(),
    hasMore: z.boolean(),
  }),
});

export const contractClassInstanceMatchSchema = z.enum(['current', 'original', 'any']);

export const contractClassInstancesQueryParamsSchema = z.object({
  match: contractClassInstanceMatchSchema.optional(),
});

export const contractClassInstancesQueryParamsJsonSchema = z.object({
  match: contractClassInstanceMatchSchema
    .optional()
    .describe('Match scope for contract instances: current (default), original, or any'),
});

// Path Parameters
export const contractAddressParamsSchema = z.object({
  address: z.string().regex(hex256).describe('Aztec address as hex string'),
});

export const contractArtifactParamsSchema = z.object({
  identifier: z.string().regex(hex256).describe('ContractClass ID or Artifact Hash as hex string'), // Can be contractClassId or artifactHash
});

export const contractClassIdParamsSchema = z.object({
  contractClassId: z.string().regex(hex256).describe('Contract class ID as hex string'),
});

// Export types
export type apiContractInstance = z.infer<typeof contractInstanceSchema>;
export type apiContractArtifact = z.infer<typeof contractArtifactSchema>;
export type apiContractQueryParams = z.infer<typeof contractQueryParamsSchema>;
export type apiContractInstancesResponse = z.infer<typeof contractInstancesResponseSchema>;
export type apiPaginatedContractAddressesResponse = z.infer<typeof paginatedContractAddressesResponseSchema>;
export type apiContractAddressParams = z.infer<typeof contractAddressParamsSchema>;
export type apiContractArtifactParams = z.infer<typeof contractArtifactParamsSchema>;
export type apiContractClassIdParams = z.infer<typeof contractClassIdParamsSchema>;
export type apiContractClassInstanceMatch = z.infer<typeof contractClassInstanceMatchSchema>;
export type apiContractClassInstancesQueryParams = z.infer<typeof contractClassInstancesQueryParamsSchema>;

export const uploadContractInstanceSchema = z.object({
  instance: uploadContractInstancePayloadSchema,
  artifact: uploadArtifactInputSchema.optional(),
});

export const uploadContractArtifactSchema = z.object({
  artifact: z
    .string()
    .regex(hex)
    .describe('Serialized ContractArtifact as hex string.  Use contractArtifactToBuffer, then hex encode'),
});

export const uploadContractArtifactResponseSchema = z.object({
  contractClassId: z.string().regex(hex256).describe('Contract class ID as hex string'),
});

export const uploadContractInstanceResponseSchema = z.object({
  address: z.string().regex(hex256).describe('Aztec address as hex string'),
  currentContractClassId: z.string().regex(hex256).describe('Current contract class ID as hex string'),
});

// Export upload types
export type UploadContractArtifact = z.infer<typeof uploadContractArtifactSchema>;
export type UploadContractArtifactResponse = z.infer<typeof uploadContractArtifactResponseSchema>;
export type UploadContractInstance = z.infer<typeof uploadContractInstanceSchema>;
export type UploadContractInstanceResponse = z.infer<typeof uploadContractInstanceResponseSchema>;
