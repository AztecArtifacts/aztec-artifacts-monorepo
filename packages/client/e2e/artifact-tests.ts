#!/usr/bin/env tsx

import type { ContractArtifact } from '@aztec/aztec.js';
import { computeArtifactHash, getContractClassFromArtifact } from '@aztec/stdlib/contract';
import { randomContractArtifact } from '@aztec/stdlib/testing';
import { ApiError, AztecArtifactsApiClient, NotFoundError } from '../src/index.js';

// Get API URL from environment or use localhost
const API_URL = process.env.API_URL || 'http://localhost:3000';

console.log('🔧 Running Contract Artifact E2E Tests');
console.log(`📡 API URL: ${API_URL}\n`);

const client = new AztecArtifactsApiClient({
  baseUrl: API_URL,
  headers: {
    'User-Agent': 'E2E-Test/1.0.0',
  },
});

async function testArtifactUploadAndFetch() {
  console.log('📝 Test: Upload and Fetch Contract Artifact');
  console.log('='.repeat(50));

  // Generate a random artifact for testing
  const artifact = randomContractArtifact();
  console.log('✅ Generated test artifact');

  const artifactHash = await computeArtifactHash(artifact);
  const { id: contractClassId } = await getContractClassFromArtifact(artifact);

  console.log(`   Contract Class ID: ${contractClassId}`);
  console.log(`   Artifact Hash: ${artifactHash}\n`);

  // Test 1: Upload the artifact
  console.log('📤 Uploading artifact...');
  try {
    const uploadResult = await client.uploadContractArtifact(artifact);
    console.log('✅ Artifact uploaded successfully');
    console.log('   Result:', uploadResult, '\n');
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`❌ Failed to upload artifact: ${error.message} (HTTP ${error.status})`);
      throw error;
    }
    throw error;
  }

  // Test 2: Fetch by contract class ID
  console.log('📥 Fetching artifact by contract class ID...');
  try {
    const fetchedByClassId = await client.getArtifact(contractClassId.toString());
    console.log('✅ Artifact fetched by class ID successfully');

    const fetchedArtifactHash = await computeArtifactHash(fetchedByClassId);
    console.log(`   Fetched Artifact Hash: ${fetchedArtifactHash}`);

    const { id: fetchedContractClassId } = await getContractClassFromArtifact(fetchedByClassId);
    console.log(`   Fetched Contract Class ID: ${fetchedContractClassId}`);

    // Verify the fetched artifact matches
    if (!fetchedContractClassId.equals(contractClassId)) {
      throw new Error('Contract class ID mismatch!');
    }
    if (!fetchedArtifactHash.equals(artifactHash)) {
      throw new Error('Artifact hash mismatch!');
    }
    console.log('✅ Fetched artifact matches original\n');
  } catch (error) {
    if (error instanceof NotFoundError) {
      console.error('❌ Artifact not found by class ID');
    } else if (error instanceof ApiError) {
      console.error(`❌ API error: ${error.message} (HTTP ${error.status})`);
    }
    throw error;
  }

  // Test 3: Fetch by artifact hash
  console.log('📥 Fetching artifact by artifact hash...');
  try {
    const fetchedByHash = await client.getArtifact(artifactHash.toString());
    console.log('✅ Artifact fetched by hash successfully');

    const fetchedArtifactHash = await computeArtifactHash(fetchedByHash);
    console.log(`   Fetched Artifact Hash: ${fetchedArtifactHash}`);
    const { id: fetchedContractClassId } = await getContractClassFromArtifact(fetchedByHash);
    console.log(`   Fetched Contract Class ID: ${fetchedContractClassId}`);

    // Verify the fetched artifact matches
    if (!fetchedContractClassId.equals(contractClassId)) {
      throw new Error('Contract class ID mismatch!');
    }
    if (!fetchedArtifactHash.equals(artifactHash)) {
      throw new Error('Artifact hash mismatch!');
    }
    console.log('✅ Fetched artifact matches original\n');
  } catch (error) {
    if (error instanceof NotFoundError) {
      console.error('❌ Artifact not found by hash');
    } else if (error instanceof ApiError) {
      console.error(`❌ API error: ${error.message} (HTTP ${error.status})`);
    }
    throw error;
  }

  // Test 4: Test duplicate upload (should handle gracefully)
  console.log('📤 Testing duplicate upload (should be idempotent)...');
  try {
    const duplicateResult = await client.uploadContractArtifact(artifact);
    console.log('✅ Duplicate upload handled successfully');
    console.log('   Result:', duplicateResult, '\n');
  } catch (error) {
    // Some APIs might return 409 Conflict for duplicates, which is also fine
    if (error instanceof ApiError && error.status === 409) {
      console.log('✅ API correctly rejected duplicate (409 Conflict)\n');
    } else {
      throw error;
    }
  }

  // Test 5: Test fetching non-existent artifact
  console.log('📥 Testing fetch of non-existent artifact...');
  const fakeId = `0x${'0'.repeat(64)}`;
  try {
    await client.getArtifact(fakeId);
    console.error('❌ Expected NotFoundError but got success!');
    throw new Error('Should have thrown NotFoundError');
  } catch (error) {
    if (error instanceof NotFoundError) {
      console.log('✅ Correctly threw NotFoundError for non-existent artifact\n');
    } else {
      throw error;
    }
  }

  console.log('🎉 All artifact tests passed!\n');
}

async function testMultipleArtifacts() {
  console.log('📝 Test: Upload Multiple Artifacts');
  console.log('='.repeat(50));

  const artifacts: ContractArtifact[] = [];
  const numArtifacts = 3;

  // Generate and upload multiple artifacts
  console.log(`📤 Uploading ${numArtifacts} artifacts...`);
  for (let i = 0; i < numArtifacts; i++) {
    const artifact = randomContractArtifact();
    artifacts.push(artifact);

    try {
      await client.uploadContractArtifact(artifact);
      console.log(`   ✅ Uploaded artifact ${i + 1}/${numArtifacts}`);
    } catch (error) {
      if (error instanceof ApiError && error.status !== 409) {
        throw error;
      }
    }
  }
  console.log(`✅ All ${numArtifacts} artifacts uploaded\n`);

  // Verify all artifacts can be fetched
  console.log('📥 Verifying all artifacts can be fetched...');
  for (let i = 0; i < artifacts.length; i++) {
    const artifact = artifacts[i];
    const { id: contractClassId } = await getContractClassFromArtifact(artifact);

    try {
      const fetched = await client.getArtifact(contractClassId.toString());
      const { id: fetchedContractClassId } = await getContractClassFromArtifact(fetched);

      if (!fetchedContractClassId.equals(contractClassId)) {
        throw new Error(`Artifact ${i + 1} class ID mismatch!`);
      }
      console.log(`   ✅ Verified artifact ${i + 1}/${numArtifacts}`);
    } catch (error) {
      console.error(`   ❌ Failed to fetch artifact ${i + 1}`);
      throw error;
    }
  }
  console.log('✅ All artifacts verified\n');

  console.log('🎉 Multiple artifact tests passed!\n');
}

// Main execution
async function main() {
  try {
    // Check if API is reachable
    console.log('🔍 Checking API connectivity...');
    try {
      await fetch(`${API_URL}/health`);
      console.log('✅ API is reachable\n');
    } catch (error) {
      console.error('❌ Cannot reach API. Is the service running?', error);
      console.error('   Try: cd packages/service && pnpm dev');
      process.exit(1);
    }

    await testArtifactUploadAndFetch();
    await testMultipleArtifacts();

    console.log('✨ All Contract Artifact E2E tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ E2E tests failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
