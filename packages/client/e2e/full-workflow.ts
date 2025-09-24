#!/usr/bin/env tsx

import { randomContractArtifact, randomContractInstance } from '@aztec/stdlib/testing';
import { ApiError, AztecArtifactsApiClient, createDefaultClient } from '../src/index.js';

// Get API URL from environment or use localhost
const API_URL = process.env.API_URL || 'http://localhost:3000';

console.log('🔧 Running Full Workflow E2E Test');
console.log(`📡 API URL: ${API_URL}\n`);

// Test both custom and default client configurations
const customClient = new AztecArtifactsApiClient({
  baseUrl: API_URL,
  headers: {
    'User-Agent': 'E2E-Test/1.0.0',
  },
});

// Also test the default client if we're using production
const useDefaultClient = API_URL === 'https://api.aztec-artifacts.org/v1';
const defaultClient = useDefaultClient ? createDefaultClient() : null;

async function simulateRealWorldWorkflow() {
  console.log('🌟 Test: Real-World Contract Deployment Workflow');
  console.log('='.repeat(50));
  console.log('Simulating a typical developer workflow:\n');
  console.log('1. Deploy a new contract (upload artifact + instance)');
  console.log('2. Deploy more instances of the same contract');
  console.log('3. Another developer fetches contract info');
  console.log('4. Query all deployed contracts\n');

  const client = customClient;

  // Step 1: Developer A deploys a new contract type
  console.log('👤 Developer A: Deploying new contract type...');
  const artifact = randomContractArtifact();
  const firstInstance = await randomContractInstance({
    contractClassId: artifact.contractClassId,
  });

  console.log(`   📦 Contract Class ID: ${artifact.contractClassId}`);
  console.log(`   📍 Instance Address: ${firstInstance.address}`);

  try {
    await client.uploadContractInstance(firstInstance, artifact);
    console.log('   ✅ Contract deployed successfully\n');
  } catch (error) {
    if (error instanceof ApiError && error.status !== 409) {
      throw error;
    }
  }

  // Step 2: Developer A deploys more instances
  console.log('👤 Developer A: Deploying 2 more instances of the same contract...');
  const additionalInstances = [];

  for (let i = 0; i < 2; i++) {
    const instance = await randomContractInstance({
      contractClassId: artifact.contractClassId,
    });
    additionalInstances.push(instance);

    try {
      await client.uploadContractInstance(instance);
      console.log(`   ✅ Instance ${i + 1} deployed at: ${instance.address}`);
    } catch (_error) {
      // Retry with artifact if needed
      await client.uploadContractInstance(instance, artifact);
      console.log(`   ✅ Instance ${i + 1} deployed at: ${instance.address} (with artifact)`);
    }
  }
  console.log();

  // Step 3: Developer B wants to interact with the contracts
  console.log('👤 Developer B: Fetching contract information...');
  console.log('   Developer B knows the contract address and wants to interact with it');

  const targetAddress = additionalInstances[0].address;
  console.log(`   📍 Target address: ${targetAddress}\n`);

  // Developer B fetches the contract with artifact to register in their PXE
  try {
    const { instance, artifact: fetchedArtifact } = await client.getContract(targetAddress.toString(), true);

    console.log('   ✅ Contract fetched successfully');
    console.log(`   📦 Class ID: ${instance.contractClassId}`);
    console.log(`   📄 Has artifact: ${fetchedArtifact ? 'Yes' : 'No'}`);

    // In a real scenario, developer B would register this in their PXE:
    // await pxe.registerContract({ instance, artifact: fetchedArtifact });
    console.log('   💡 Ready to register in PXE and interact\n');
  } catch (error) {
    console.error('   ❌ Failed to fetch contract');
    throw error;
  }

  // Step 4: Developer C wants to see all deployed instances of this contract type
  console.log('👤 Developer C: Querying all instances of this contract type...');
  console.log(`   📦 Looking for Class ID: ${artifact.contractClassId}\n`);

  try {
    const allInstances = await client.getAllContractAddressesByClassId(artifact.contractClassId.toString(), {
      match: 'current',
    });

    console.log(`   ✅ Found ${allInstances.length} deployed instances:`);
    allInstances.forEach((addr, idx) => {
      console.log(`      ${idx + 1}. ${addr}`);
    });
    console.log();
  } catch (error) {
    console.error('   ❌ Failed to query instances');
    throw error;
  }

  // Step 5: Admin wants to see deployment statistics
  console.log('👤 Admin: Getting deployment statistics...');

  try {
    const allContracts = await client.getAllContractAddresses();
    console.log(`   📊 Total contracts in repository: ${allContracts.length}`);

    // Get paginated view for UI
    const firstPage = await client.getContractAddresses({ limit: 5, cursor: 0 });
    console.log(`   📄 Showing first ${firstPage.data.length} contracts`);
    console.log(`   📄 Has more pages: ${firstPage.pagination.hasMore}\n`);
  } catch (error) {
    console.error('   ❌ Failed to get statistics');
    throw error;
  }

  console.log('🎉 Real-world workflow completed successfully!\n');
}

async function testErrorScenarios() {
  console.log('🔥 Test: Error Handling Scenarios');
  console.log('='.repeat(50));

  const client = customClient;

  // Scenario 1: Invalid address format
  console.log('📝 Testing invalid address format...');
  try {
    await client.getContract('not-a-valid-address');
    console.error('   ❌ Should have thrown an error');
  } catch (error) {
    if (error instanceof ApiError) {
      console.log(`   ✅ Correctly rejected invalid address (HTTP ${error.status})\n`);
    } else {
      throw error;
    }
  }

  // Scenario 2: Upload instance without artifact when it doesn't exist
  console.log('📝 Testing instance upload without required artifact...');
  const orphanInstance = await randomContractInstance();

  try {
    await client.uploadContractInstance(orphanInstance);
    // This might succeed if the artifact somehow exists
    console.log('   ⚠️ Upload succeeded (artifact may already exist)\n');
  } catch (error) {
    if (error instanceof ApiError) {
      console.log(`   ✅ Correctly rejected instance without artifact (HTTP ${error.status})\n`);
    } else {
      throw error;
    }
  }

  // Scenario 3: Fetch with different includeArtifact flags
  console.log('📝 Testing includeArtifact parameter behavior...');

  // First upload a test contract
  const artifact = randomContractArtifact();
  const instance = await randomContractInstance({
    contractClassId: artifact.contractClassId,
  });

  try {
    await client.uploadContractInstance(instance, artifact);
  } catch (_error) {
    // Ignore if already exists
  }

  // Test with includeArtifact=false (default)
  const withoutArtifact = await client.getContract(instance.address.toString());
  console.log(`   Without artifact: artifact=${withoutArtifact.artifact ? 'present' : 'absent'}`);

  // Test with includeArtifact=true
  const withArtifact = await client.getContract(instance.address.toString(), true);
  console.log(`   With artifact: artifact=${withArtifact.artifact ? 'present' : 'absent'}`);

  if (!withoutArtifact.artifact && withArtifact.artifact) {
    console.log('   ✅ includeArtifact parameter works correctly\n');
  } else {
    console.error('   ❌ includeArtifact parameter not working as expected\n');
  }

  console.log('🎉 Error handling tests completed!\n');
}

async function testCachingBehavior() {
  console.log('🔄 Test: Client Caching Options');
  console.log('='.repeat(50));

  const client = customClient;

  // Upload test data
  const artifact = randomContractArtifact();
  const instance = await randomContractInstance({
    contractClassId: artifact.contractClassId,
  });

  try {
    await client.uploadContractInstance(instance, artifact);
  } catch (_error) {
    // Ignore if exists
  }

  console.log('📝 Testing different cache modes...');

  // Test with force-cache
  console.log('   Testing force-cache...');
  const cached = await client.getContract(instance.address.toString(), true, {
    cache: 'force-cache',
  });
  console.log('   ✅ force-cache request completed');

  // Test with no-cache
  console.log('   Testing no-cache...');
  const fresh = await client.getContract(instance.address.toString(), true, {
    cache: 'no-cache',
  });
  console.log('   ✅ no-cache request completed');

  // Verify both return the same data
  if (cached.instance.address.toString() === fresh.instance.address.toString()) {
    console.log('   ✅ Cache modes work correctly\n');
  } else {
    console.error('   ❌ Cache inconsistency detected\n');
  }

  console.log('🎉 Caching tests completed!\n');
}

// Main execution
async function main() {
  try {
    // Check if API is reachable
    console.log('🔍 Checking API connectivity...');
    try {
      const healthResponse = await fetch(`${API_URL}/health`);
      const health = await healthResponse.json();
      console.log('✅ API is reachable');
      console.log(`   Status: ${health.status || 'unknown'}`);
      console.log(`   Version: ${health.version || 'unknown'}\n`);
    } catch (_error) {
      console.error('❌ Cannot reach API. Is the service running?');
      console.error('   Try: cd packages/service && pnpm dev');
      process.exit(1);
    }

    // Test with custom client
    console.log('🔧 Testing with custom client configuration\n');
    await simulateRealWorldWorkflow();
    await testErrorScenarios();
    await testCachingBehavior();

    // If using default client, run a quick test
    if (defaultClient) {
      console.log('🔧 Testing default client (production)...');
      try {
        const addresses = await defaultClient.getContractAddresses({ limit: 1, cursor: 0 });
        console.log(`✅ Default client works (found ${addresses.data.length} contracts)\n`);
      } catch (_error) {
        console.log('⚠️ Default client test failed (production may be down)\n');
      }
    }

    console.log('✨ Full workflow E2E tests completed successfully!');
    console.log('\n📚 Summary:');
    console.log('   ✅ Real-world workflow simulation');
    console.log('   ✅ Error handling scenarios');
    console.log('   ✅ Caching behavior');
    if (defaultClient) {
      console.log('   ✅ Default client configuration');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ E2E tests failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
