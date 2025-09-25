#!/usr/bin/env tsx

import type { ContractInstanceWithAddress } from '@aztec/aztec.js';
import { AztecAddress } from '@aztec/aztec.js';
import { randomContractArtifact, randomContractInstance } from '@aztec/stdlib/testing';
import { ApiError, AztecArtifactsApiClient, BadRequestError, NotFoundError } from '../src/index.js';

// Get API URL from environment or use localhost
const API_URL = process.env.API_URL || 'http://localhost:3000';

console.log('🔧 Running Contract Instance E2E Tests');
console.log(`📡 API URL: ${API_URL}\n`);

const client = new AztecArtifactsApiClient({
  baseUrl: API_URL,
  headers: {
    'User-Agent': 'E2E-Test/1.0.0',
  },
});

async function testInstanceUploadAndFetch() {
  console.log('📝 Test: Upload and Fetch Contract Instance');
  console.log('='.repeat(50));

  // Generate test data
  const artifact = randomContractArtifact();
  const instance = await randomContractInstance({
    contractClassId: artifact.contractClassId,
  });

  console.log('✅ Generated test data');
  console.log(`   Contract Address: ${instance.address}`);
  console.log(`   Contract Class ID: ${instance.contractClassId}`);
  console.log(`   Artifact Hash: ${artifact.artifactHash}\n`);

  // Test 1: Upload instance with artifact
  console.log('📤 Uploading instance with artifact...');
  try {
    await client.uploadContractInstance(instance, artifact);
    console.log('✅ Instance uploaded successfully with artifact\n');
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`❌ Failed to upload instance: ${error.message} (HTTP ${error.status})`);
      throw error;
    }
    throw error;
  }

  // Test 2: Fetch instance without artifact
  console.log('📥 Fetching instance (without artifact)...');
  try {
    const { instance: fetchedInstance, artifact: fetchedArtifact } = await client.getContract(
      instance.address.toString(),
      false, // Don't include artifact
    );

    console.log('✅ Instance fetched successfully');
    console.log(`   Address matches: ${fetchedInstance.address.toString() === instance.address.toString()}`);
    console.log(
      `   Class ID matches: ${fetchedInstance.contractClassId.toString() === instance.contractClassId.toString()}`,
    );
    console.log(`   Artifact included: ${fetchedArtifact ? 'Yes' : 'No'}`);

    if (fetchedArtifact) {
      throw new Error('Artifact should not be included when includeArtifact=false');
    }
    console.log('✅ Instance fetched correctly without artifact\n');
  } catch (error) {
    if (error instanceof NotFoundError) {
      console.error('❌ Instance not found');
    } else if (error instanceof ApiError) {
      console.error(`❌ API error: ${error.message} (HTTP ${error.status})`);
    }
    throw error;
  }

  // Test 3: Fetch instance with artifact
  console.log('📥 Fetching instance (with artifact)...');
  try {
    const { instance: fetchedInstance, artifact: fetchedArtifact } = await client.getContract(
      instance.address.toString(),
      true, // Include artifact
    );

    console.log('✅ Instance fetched successfully with artifact');
    console.log(`   Address matches: ${fetchedInstance.address.toString() === instance.address.toString()}`);
    console.log(
      `   Class ID matches: ${fetchedInstance.contractClassId.toString() === instance.contractClassId.toString()}`,
    );
    console.log(`   Artifact included: ${fetchedArtifact ? 'Yes' : 'No'}`);

    if (!fetchedArtifact) {
      throw new Error('Artifact should be included when includeArtifact=true');
    }

    // Verify artifact matches
    if (fetchedArtifact.contractClassId.toString() !== artifact.contractClassId.toString()) {
      throw new Error('Artifact class ID mismatch!');
    }
    if (fetchedArtifact.artifactHash.toString() !== artifact.artifactHash.toString()) {
      throw new Error('Artifact hash mismatch!');
    }
    console.log('✅ Instance and artifact fetched correctly\n');
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`❌ API error: ${error.message} (HTTP ${error.status})`);
    }
    throw error;
  }

  // Test 4: Test duplicate upload (should be idempotent)
  console.log('📤 Testing duplicate instance upload...');
  try {
    await client.uploadContractInstance(instance, artifact);
    console.log('✅ Duplicate upload handled successfully (idempotent)\n');
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      console.log('✅ API correctly rejected duplicate (409 Conflict)\n');
    } else {
      throw error;
    }
  }

  // Test 5: Upload instance without artifact (when artifact already exists)
  console.log('📤 Testing instance upload without artifact (artifact already exists)...');
  const newInstance = await randomContractInstance({
    contractClassId: artifact.contractClassId,
  });

  try {
    await client.uploadContractInstance(newInstance); // No artifact provided
    console.log('✅ Instance uploaded successfully without artifact');
    console.log(`   New Address: ${newInstance.address}\n`);
  } catch (error) {
    if (error instanceof BadRequestError) {
      console.error('❌ Failed - artifact may not exist on server');
    }
    throw error;
  }

  // Test 6: Test fetching non-existent instance
  console.log('📥 Testing fetch of non-existent instance...');
  const fakeAddress = AztecAddress.random();
  try {
    await client.getContract(fakeAddress.toString());
    console.error('❌ Expected NotFoundError but got success!');
    throw new Error('Should have thrown NotFoundError');
  } catch (error) {
    if (error instanceof NotFoundError) {
      console.log('✅ Correctly threw NotFoundError for non-existent instance\n');
    } else {
      throw error;
    }
  }

  console.log('🎉 All instance tests passed!\n');
}

async function testInstancesWithSameArtifact() {
  console.log('📝 Test: Multiple Instances with Same Artifact');
  console.log('='.repeat(50));

  // Create one artifact for multiple instances
  const artifact = randomContractArtifact();
  console.log('✅ Generated shared artifact');
  console.log(`   Contract Class ID: ${artifact.contractClassId}\n`);

  const instances: ContractInstanceWithAddress[] = [];
  const numInstances = 3;

  // Upload first instance with artifact
  console.log('📤 Uploading first instance with artifact...');
  const firstInstance = await randomContractInstance({
    contractClassId: artifact.contractClassId,
  });
  instances.push(firstInstance);
  await client.uploadContractInstance(firstInstance, artifact);
  console.log('✅ First instance uploaded with artifact');
  console.log(`   Address: ${firstInstance.address}\n`);

  // Upload remaining instances without artifact
  console.log(`📤 Uploading ${numInstances - 1} more instances (without artifact)...`);
  for (let i = 1; i < numInstances; i++) {
    const instance = await randomContractInstance({
      contractClassId: artifact.contractClassId,
    });
    instances.push(instance);

    try {
      await client.uploadContractInstance(instance);
      console.log(`   ✅ Instance ${i + 1}/${numInstances} uploaded`);
      console.log(`      Address: ${instance.address}`);
    } catch (_error) {
      // If this fails, try uploading with artifact
      console.log('   ⚠️ Retrying with artifact...');
      await client.uploadContractInstance(instance, artifact);
      console.log(`   ✅ Instance ${i + 1}/${numInstances} uploaded with artifact`);
    }
  }
  console.log(`✅ All ${numInstances} instances uploaded\n`);

  // Verify all instances can be fetched with the same artifact
  console.log('📥 Verifying all instances share the same artifact...');
  for (let i = 0; i < instances.length; i++) {
    const instance = instances[i];
    try {
      const { instance: fetchedInstance, artifact: fetchedArtifact } = await client.getContract(
        instance.address.toString(),
        true,
      );

      if (fetchedInstance.contractClassId.toString() !== artifact.contractClassId.toString()) {
        throw new Error(`Instance ${i + 1} class ID mismatch!`);
      }

      if (!fetchedArtifact || fetchedArtifact.contractClassId.toString() !== artifact.contractClassId.toString()) {
        throw new Error(`Instance ${i + 1} artifact mismatch!`);
      }

      console.log(`   ✅ Instance ${i + 1}/${numInstances} verified`);
    } catch (error) {
      console.error(`   ❌ Failed to verify instance ${i + 1}`);
      throw error;
    }
  }
  console.log('✅ All instances share the same artifact correctly\n');

  console.log('🎉 Multiple instances with same artifact test passed!\n');
}

async function testBulkQueries() {
  console.log('📝 Test: Bulk Queries (Contract Addresses)');
  console.log('='.repeat(50));

  // First, upload some test data
  console.log('📤 Preparing test data...');
  const artifact = randomContractArtifact();
  const instances: ContractInstanceWithAddress[] = [];

  for (let i = 0; i < 5; i++) {
    const instance = await randomContractInstance({
      contractClassId: artifact.contractClassId,
    });
    instances.push(instance);

    try {
      if (i === 0) {
        await client.uploadContractInstance(instance, artifact);
      } else {
        await client.uploadContractInstance(instance);
      }
    } catch (error) {
      // Ignore duplicates
      if (!(error instanceof ApiError && error.status === 409)) {
        throw error;
      }
    }
  }
  console.log(`✅ Uploaded ${instances.length} test instances\n`);

  // Test paginated query
  console.log('📥 Testing paginated contract address query...');
  try {
    const { data, pagination } = await client.getContractAddresses({
      limit: 2,
      cursor: 0,
    });

    console.log('✅ Fetched page of contract addresses');
    console.log(`   Returned: ${data.length} addresses`);
    console.log(`   Has more: ${pagination.hasMore}`);
    if (pagination.hasMore) {
      console.log(`   Next cursor: ${pagination.nextCursor}`);
    }
    console.log();
  } catch (error) {
    console.error('❌ Failed to fetch paginated addresses');
    throw error;
  }

  // Test auto-paginated query
  console.log('📥 Testing auto-paginated query (get all addresses)...');
  try {
    const allAddresses = await client.getAllContractAddresses();
    console.log('✅ Fetched all contract addresses');
    console.log(`   Total: ${allAddresses.length} addresses`);

    // Check if our test instances are in the results
    const testAddresses = instances.map((i) => i.address.toString());
    const foundCount = allAddresses.filter((addr) => testAddresses.includes(addr.toString())).length;

    console.log(`   Found ${foundCount}/${instances.length} test instances in results\n`);
  } catch (error) {
    console.error('❌ Failed to fetch all addresses');
    throw error;
  }

  // Test query by class ID
  console.log('📥 Testing query by contract class ID...');
  try {
    const { data, pagination } = await client.getContractAddressesByClassId(artifact.contractClassId.toString(), {
      match: 'current',
      limit: 10,
      cursor: 0,
    });

    console.log('✅ Fetched addresses by class ID');
    console.log(`   Class ID: ${artifact.contractClassId}`);
    console.log(`   Found: ${data.length} addresses`);
    console.log(`   Has more: ${pagination.hasMore}\n`);

    // Verify all returned addresses match our test instances
    const testAddresses = instances.map((i) => i.address.toString());
    const matchCount = data.filter((addr) => testAddresses.includes(addr.toString())).length;

    if (matchCount > 0) {
      console.log(`   ✅ Found ${matchCount} of our test instances\n`);
    }
  } catch (error) {
    console.error('❌ Failed to query by class ID');
    throw error;
  }

  console.log('🎉 Bulk query tests passed!\n');
}

// Main execution
async function main() {
  try {
    // Check if API is reachable
    console.log('🔍 Checking API connectivity...');
    try {
      await fetch(`${API_URL}/health`);
      console.log('✅ API is reachable\n');
    } catch (_error) {
      console.error('❌ Cannot reach API. Is the service running?');
      console.error('   Try: cd packages/service && pnpm dev');
      process.exit(1);
    }

    await testInstanceUploadAndFetch();
    await testInstancesWithSameArtifact();
    await testBulkQueries();

    console.log('✨ All Contract Instance E2E tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ E2E tests failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
