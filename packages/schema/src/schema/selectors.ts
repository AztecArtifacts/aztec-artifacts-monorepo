import { pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

// Stores function selectors and every signature we've seen for them.
// A selector can legitimately map to multiple signatures, so we only enforce
// uniqueness at the selector+signature pair level.
export const functionSelectors = pgTable(
  'function_selectors',
  {
    id: serial('id').primaryKey(),
    selector: text('selector').notNull(),
    signature: text('signature').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    selectorSignatureUnique: uniqueIndex('function_selectors_selector_signature_idx').on(
      table.selector,
      table.signature,
    ),
  }),
);

export type DbFunctionSelector = typeof functionSelectors.$inferSelect;
export type DbNewFunctionSelector = typeof functionSelectors.$inferInsert;
