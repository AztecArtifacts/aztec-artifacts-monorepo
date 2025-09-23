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

// Simplified Initialization Data Schema
export const initializationDataSchema = z
  .object({
    constructorArtifact: z.string().nullable().optional(),
    constructorArgs: z.array(z.unknown()).nullable().optional(),
  })
  .nullable()
  .optional();

const publicKeyPointSchema = z.object({
  x: z.string(),
  y: z.string(),
});

const publicKeysInputSchema = z.union([
  z.string().min(1, 'Public keys must be provided'),
  z.object({
    masterNullifierPublicKey: publicKeyPointSchema,
    masterIncomingViewingPublicKey: publicKeyPointSchema,
    masterOutgoingViewingPublicKey: publicKeyPointSchema,
    masterTaggingPublicKey: publicKeyPointSchema,
  }),
]);

const uploadArtifactInputSchema = z.string();

const uploadContractInstancePayloadSchema = z.object({
  address: z.string().regex(hex256).describe('Aztec address as hex string'),
  version: z.number().int().min(1).optional().describe('Contract class version'),
  salt: z.string().regex(hex256).describe('Salt as hex string'),
  deployer: z.string().regex(hex256).describe('Deployer address as hex string'),
  current_contract_class_id: z.string().regex(hex256).describe('Current contract class ID as hex string'),
  original_contract_class_id: z.string().regex(hex256).describe('Original contract class ID as hex string'),
  initialization_hash: z.string().regex(hex256).describe('Initialization hash as hex string'),
  public_keys: publicKeysInputSchema.describe(
    'Public keys as serialized string (PublicKeys.toString()) or structured object',
  ),
  initialization_data: initializationDataSchema,
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
  current_contract_class_id: z.string().regex(hex256).describe('Current contract class ID as hex string'),
  original_contract_class_id: z.string().regex(hex256).describe('Original contract class ID as hex string'),
  initialization_hash: z.string().regex(hex256).describe('Initialization hash as hex string'),
  public_keys: z
    .string()
    .regex(hex2048)
    .describe('Public keys as concatenated hex string (use PublicKeys.toString() / fromString() for conversion)'),
  // API-specific fields
  initialization_data: initializationDataSchema,

  // Optional artifact field as serialized hex string
  artifact: z.string().optional().describe('Serialized ContractArtifact as hex string'),

  // Token detection field
  isToken: z.boolean().optional().describe('Whether this contract instance is a token contract'),
});

// Contract Artifact Schema using standard Zod types for OpenAPI compatibility
export const contractArtifactSchema = z.object({
  id: z.number().optional(),
  artifact_hash: z.string().regex(hex256).describe('Artifact hash as hex string'),
  contract_class_id: z.string().regex(hex256).describe('Contract class ID as hex string'),
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
  contractClassId: z.string(),
});

// Export types
export type apiContractInstance = z.infer<typeof contractInstanceSchema>;
export type apiContractArtifact = z.infer<typeof contractArtifactSchema>;
export type apiContractQueryParams = z.infer<typeof contractQueryParamsSchema>;
export type apiContractInstancesResponse = z.infer<typeof contractInstancesResponseSchema>;
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
    .describe('Serialized ContractArtifact as hex string.  Use contractArtifactToBuffer, then hex encode'),
});

export const uploadContractArtifactResponseSchema = z.object({
  id: z.number().describe('Database ID of the created artifact'),
  artifact_hash: z.string().regex(hex256).describe('Artifact hash as hex string'),
  contract_class_id: z.string().regex(hex256).describe('Contract class ID as hex string'),
  artifact: z
    .string()
    .describe(
      'Serialized ContractArtifact as hex string. Deserialize using contractArtifactFromBuffer(Buffer.from(hex.replace(/^0x/, ""), "hex"))',
    ),
  isToken: z.boolean().describe('Whether this contract artifact is a token contract'),
});

export const uploadContractInstanceResponseSchema = contractInstanceSchema;

// Export upload types
export type UploadContractArtifact = z.infer<typeof uploadContractArtifactSchema>;
export type UploadContractArtifactResponse = z.infer<typeof uploadContractArtifactResponseSchema>;
export type UploadContractInstance = z.infer<typeof uploadContractInstanceSchema>;
export type UploadContractInstanceResponse = z.infer<typeof uploadContractInstanceResponseSchema>;
