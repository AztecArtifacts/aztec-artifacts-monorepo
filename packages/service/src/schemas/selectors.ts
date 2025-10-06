import { z } from 'zod';

const selectorPattern = /^0x[a-fA-F0-9]{8}$/;

export const functionSelectorParamsSchema = z.object({
  selector: z
    .string()
    .regex(selectorPattern, 'Invalid function selector format. Expected 0x followed by 8 hex characters.'),
});

export const functionSelectorResponseSchema = z.object({
  selector: z
    .string()
    .regex(selectorPattern, 'Invalid function selector format. Expected 0x followed by 8 hex characters.'),
  signatures: z.array(z.string()),
});

export const artifactSelectorsResponseSchema = z.object({
  contractClassId: z.string(),
  selectors: z.array(
    z.object({
      selector: z.string(),
      signature: z.string(),
    }),
  ),
});

export const selectorArtifactsResponseSchema = z.object({
  selector: z
    .string()
    .regex(selectorPattern, 'Invalid function selector format. Expected 0x followed by 8 hex characters.'),
  contractClassIds: z.array(z.string()),
});

export const selectorListItemSchema = z.object({
  id: z.number().optional(),
  selector: z
    .string()
    .regex(selectorPattern, 'Invalid function selector format. Expected 0x followed by 8 hex characters.'),
  signature: z.string(),
});

export const paginationResponseSchema = z.object({
  cursor: z.number().optional(),
  nextCursor: z.number().optional(),
  limit: z.number(),
  hasMore: z.boolean(),
});

export const paginatedSelectorResponseSchema = z.object({
  data: z.array(selectorListItemSchema),
  pagination: paginationResponseSchema,
});

export type FunctionSelectorParams = z.infer<typeof functionSelectorParamsSchema>;
export type FunctionSelectorResponse = z.infer<typeof functionSelectorResponseSchema>;
export type ArtifactSelectorsResponse = z.infer<typeof artifactSelectorsResponseSchema>;
export type SelectorArtifactsResponse = z.infer<typeof selectorArtifactsResponseSchema>;
export type SelectorListItem = z.infer<typeof selectorListItemSchema>;
export type PaginatedSelectorResponse = z.infer<typeof paginatedSelectorResponseSchema>;
