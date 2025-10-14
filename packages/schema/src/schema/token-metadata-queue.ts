import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { contractInstances } from './contracts.js';
import { aztecAddressField } from './types.js';

export const tokenMetadataQueue = pgTable('token_metadata_queue', {
  id: serial('id').primaryKey(),

  // Token contract address
  address: aztecAddressField()
    .notNull()
    .references(() => contractInstances.address),

  // Processing status
  status: text('status', {
    enum: ['pending', 'processing', 'completed', 'failed', 'unsupported'],
  })
    .notNull()
    .default('pending'),

  // Retry tracking
  attempts: integer('attempts').notNull().default(0),
  maxAttempts: integer('max_attempts').notNull().default(3),
  lastError: text('last_error'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
});

export type DbTokenMetadataJob = typeof tokenMetadataQueue.$inferSelect;
export type DbNewTokenMetadataJob = typeof tokenMetadataQueue.$inferInsert;
export type QueueStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'unsupported';
