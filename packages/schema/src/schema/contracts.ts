import { boolean, integer, pgTable, serial, timestamp } from 'drizzle-orm/pg-core';
import {
  aztecAddressField,
  contractArtifactJsonb,
  frField,
  initializationDataJsonb,
  publicKeysJsonb,
} from './types.js';

export const contractArtifacts = pgTable('contract_artifacts', {
  id: serial('id').primaryKey(),
  isToken: boolean(),
  artifactHash: frField().notNull().unique(),
  // Storing entire artifact as JSONB to allow queries on individual fields if needed
  artifact: contractArtifactJsonb().notNull(),
  contractClassId: frField().notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const contractInstances = pgTable('contract_instances', {
  id: serial('id').primaryKey(),
  address: aztecAddressField().notNull().unique(),
  version: integer('version').notNull().default(1),
  salt: frField().notNull(),
  deployer: aztecAddressField().notNull(),
  currentContractClassId: frField()
    .notNull()
    .references(() => contractArtifacts.contractClassId),
  originalContractClassId: frField()
    .notNull()
    .references(() => contractArtifacts.contractClassId),
  initializationHash: frField().notNull(),
  // Storing public keys as JSONB to allow queries on individual keys if needed
  publicKeys: publicKeysJsonb().notNull(),
  // JSON payload capturing constructor & args used during deployment
  initializationData: initializationDataJsonb(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Infer types from database schema - these will use the actual Aztec types
export type DbContractArtifact = typeof contractArtifacts.$inferSelect;
export type DbNewContractArtifact = typeof contractArtifacts.$inferInsert;

export type DbContractInstance = typeof contractInstances.$inferSelect;
export type DbNewContractInstance = typeof contractInstances.$inferInsert;
