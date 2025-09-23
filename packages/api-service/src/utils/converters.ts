import { AztecAddress, type ContractArtifact, Fr, PublicKeys } from '@aztec/aztec.js';
import { jsonParseWithSchema, jsonStringify } from '@aztec/foundation/json-rpc';
import { ContractArtifactSchema } from '@aztec/stdlib/abi';

export function toJson(obj: unknown): string {
  return jsonStringify(obj);
}

export function jsonToFr(json: string): Fr {
  return jsonParseWithSchema(json, Fr.schema);
}

export function jsonToAztecAddress(json: string): AztecAddress {
  return jsonParseWithSchema(json, AztecAddress.schema);
}

export function jsonToPublicKeys(json: string): PublicKeys {
  return jsonParseWithSchema(json, PublicKeys.schema);
}

export function jsonToContractArtifact(json: string): ContractArtifact {
  return jsonParseWithSchema(json, ContractArtifactSchema);
}
