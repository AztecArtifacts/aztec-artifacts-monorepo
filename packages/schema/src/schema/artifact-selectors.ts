import { integer, pgTable, primaryKey, timestamp } from 'drizzle-orm/pg-core';
import { contractArtifacts } from './contracts.js';
import { functionSelectors } from './selectors.js';
import { frField } from './types.js';

// Junction table tracking which selectors are associated with which contract artifacts.
// This is a many-to-many relationship:
// - A selector can match multiple artifacts (hash collisions or same function across contracts)
// - An artifact can have multiple selectors (one per function)
export const artifactSelectors = pgTable(
  'artifact_selectors',
  {
    contractClassId: frField()
      .notNull()
      .references(() => contractArtifacts.contractClassId),
    functionSelectorId: integer('function_selector_id')
      .notNull()
      .references(() => functionSelectors.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.contractClassId, table.functionSelectorId] }),
  }),
);

export type DbArtifactSelector = typeof artifactSelectors.$inferSelect;
export type DbNewArtifactSelector = typeof artifactSelectors.$inferInsert;
