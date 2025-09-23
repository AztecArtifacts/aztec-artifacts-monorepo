import type { ContractArtifact } from '@aztec/aztec.js';
import { AztecAddress, Fr, PublicKeys } from '@aztec/aztec.js';
import { jsonParseWithSchema, jsonStringify } from '@aztec/foundation/json-rpc';
import { ContractArtifactSchema } from '@aztec/stdlib/abi';
import { customType } from 'drizzle-orm/pg-core';

export type InitializationData = {
  constructorArtifact?: string | null;
  constructorArgs?: unknown[] | null;
};

// Custom type for Fr field
export const frField = customType<{ data: Fr; driverData: string }>({
  dataType() {
    return 'text';
  },
  fromDriver(value: unknown): Fr {
    if (typeof value !== 'string') {
      throw new Error(`Expected hex string, got ${typeof value}`);
    }
    return Fr.fromHexString(value); // Note: NOT Fr.fromString() which expects bigint string
  },
  toDriver(value: Fr): string {
    return value.toString().toLowerCase(); // Normalize to lower case
  },
});

// Custom type for AztecAddress field
export const aztecAddressField = customType<{ data: AztecAddress; driverData: string }>({
  dataType() {
    return 'text';
  },
  fromDriver(value: unknown): AztecAddress {
    if (typeof value !== 'string') {
      throw new Error(`Expected hex string, got ${typeof value}`);
    }
    return AztecAddress.fromString(value);
  },
  toDriver(value: AztecAddress): string {
    return value.toString().toLowerCase(); // Normalize to lower case
  },
});

// Custom type for ContractArtifact JSONB field
export const contractArtifactJsonb = customType<{ data: ContractArtifact; driverData: string }>({
  dataType() {
    return 'jsonb';
  },
  fromDriver(value: unknown): ContractArtifact {
    if (typeof value === 'string') {
      return jsonParseWithSchema(value, ContractArtifactSchema);
    }
    return ContractArtifactSchema.parse(value);
  },
  toDriver(value: ContractArtifact): string {
    const stringified = jsonStringify(value);
    const _validated = jsonParseWithSchema(stringified, ContractArtifactSchema);
    return stringified;
  },
});

// Custom type for PublicKeys JSONB field
export const publicKeysJsonb = customType<{ data: PublicKeys; driverData: string }>({
  dataType() {
    return 'jsonb';
  },
  fromDriver(value: string): PublicKeys {
    // If value is a string, parse it as JSON using Aztec's parser
    if (typeof value === 'string') {
      return jsonParseWithSchema(value, PublicKeys.schema);
    }
    // If already an object, validate it directly
    return PublicKeys.schema.parse(value);
  },
  toDriver(value: PublicKeys): string {
    const stringified = jsonStringify(value);
    const _validated = jsonParseWithSchema(stringified, PublicKeys.schema);
    return stringified;
  },
});

// Create a custom type for InitializationData
export const initializationDataJsonb = customType<{ data: InitializationData; driverData: string }>({
  dataType() {
    return 'jsonb';
  },
  fromDriver(value: string): InitializationData {
    if (typeof value === 'string') {
      return JSON.parse(value) as InitializationData;
    }
    return value as InitializationData;
  },
  toDriver(value: InitializationData): string {
    return JSON.stringify(value);
  },
});
