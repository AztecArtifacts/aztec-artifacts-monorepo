import type { ContractArtifact } from '@aztec/aztec.js';
import { AztecAddress, Fr, PublicKeys } from '@aztec/aztec.js';
import { jsonParseWithSchema, jsonStringify } from '@aztec/foundation/json-rpc';
import { ContractArtifactSchema } from '@aztec/stdlib/abi';
import { customType } from 'drizzle-orm/pg-core';

type Hex = `0x${string}`;

type InitializationData = {
  constructorName: string;
  encodedArgs?: Fr[] | null;
};

type SerializedInitializationData = {
  constructorName: string;
  encodedArgs?: string[] | null;
};

// Custom type for Fr field
export const frField = customType<{ data: Fr; driverData: Hex }>({
  dataType() {
    return 'text';
  },
  fromDriver(value: unknown): Fr {
    if (typeof value !== 'string') {
      throw new Error(`Expected hex string, got ${typeof value}`);
    }
    return Fr.fromHexString(value); // Note: NOT Fr.fromString() which expects bigint string
  },
  toDriver(value: Fr): Hex {
    return value.toString();
  },
});

// Custom type for AztecAddress field
export const aztecAddressField = customType<{ data: AztecAddress; driverData: Hex }>({
  dataType() {
    return 'text';
  },
  fromDriver(value: unknown): AztecAddress {
    if (typeof value !== 'string') {
      throw new Error(`Expected hex string, got ${typeof value}`);
    }
    return AztecAddress.fromString(value);
  },
  toDriver(value: AztecAddress): Hex {
    return value.toString(); // Normalize to lower case
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
    const parsed: SerializedInitializationData = JSON.parse(value);

    // Convert encodedArgs from hex strings back to Fr objects
    if (parsed?.encodedArgs) {
      return {
        constructorName: parsed.constructorName,
        encodedArgs: parsed.encodedArgs.map((arg: string) => Fr.fromHexString(arg)),
      };
    }

    return parsed as InitializationData;
  },
  toDriver(value: InitializationData): string {
    // Convert Fr objects to hex strings for storage
    const serializable: SerializedInitializationData = { constructorName: value.constructorName };
    if (value.encodedArgs) {
      serializable.encodedArgs = value.encodedArgs.map((fr) => fr.toString().toLowerCase());
    }

    return JSON.stringify(serializable);
  },
});
