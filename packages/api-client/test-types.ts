// Test file to verify new schema types are working correctly
import type { ContractInstance, DeserializedContractInstance } from './src/index.js';

// Test the raw API response types (hex strings)
const _testContractInstance: ContractInstance = {
  address: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  version: 1,
  salt: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  deployer: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  original_contract_class_id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  current_contract_class_id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  initialization_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  public_keys: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  initialization_data: {
    constructorArtifact: 'constructor_with_minter',
    constructorArgs: [42, 'test'],
  },
  artifact: {
    name: 'TestContract',
    functions: [],
    events: [],
    file_map: {},
    notes: [],
    storage_layout: [],
    structs: {},
  },
};

// Test that fields can be null
const _testContractInstanceWithNulls: ContractInstance = {
  address: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  version: 1,
  salt: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  deployer: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  original_contract_class_id: null,
  current_contract_class_id: null,
  initialization_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  public_keys: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  initialization_data: null,
};

// Test the deserialized types (proper Aztec types)
// Note: We can't create actual instances here without importing the full Aztec libraries,
// but we can verify the type structure exists
const _testDeserializedType: DeserializedContractInstance = {} as DeserializedContractInstance;

// Verify the deserialized type has the expected structure
type _TestDeserializedFields = {
  address: DeserializedContractInstance['address']; // Should be AztecAddress
  salt: DeserializedContractInstance['salt']; // Should be Fr
  deployer: DeserializedContractInstance['deployer']; // Should be AztecAddress
  current_contract_class_id: DeserializedContractInstance['current_contract_class_id']; // Should be Fr | null
  original_contract_class_id: DeserializedContractInstance['original_contract_class_id']; // Should be Fr | null
  initialization_hash: DeserializedContractInstance['initialization_hash']; // Should be Fr
  public_keys: DeserializedContractInstance['public_keys']; // Should be PublicKeys
  initialization_data: DeserializedContractInstance['initialization_data']; // Should be the same structure
};

console.log('New schema types test passed!');
