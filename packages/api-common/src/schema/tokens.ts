import { pgTable, serial, smallint, text, timestamp } from 'drizzle-orm/pg-core';
import { contractInstances } from './contracts.js';
import { aztecAddressField } from './types.js';

export const tokens = pgTable('tokens', {
  id: serial('id').primaryKey(),

  // Token metadata
  // Technically this is optional, so leaving nullable
  symbol: text('symbol'),
  name: text('name'),
  decimals: smallint('decimals'),

  // Aztec L2 address
  address: aztecAddressField()
    .notNull()
    .unique()
    .references(() => contractInstances.address),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type DbToken = typeof tokens.$inferSelect;
export type DbNewToken = typeof tokens.$inferInsert;
