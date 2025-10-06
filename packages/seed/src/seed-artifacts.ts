#!/usr/bin/env node
import 'dotenv/config';
import { AztecArtifactsApiClient } from '@aztec-artifacts/client';
import { ARTIFACTS } from './artifacts/index.js';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';

async function seedArtifacts() {
  console.log(`🌱 Seeding artifacts to ${API_BASE_URL}...`);

  const client = new AztecArtifactsApiClient({ baseUrl: API_BASE_URL });

  console.log(`Found ${ARTIFACTS.length} artifacts to seed`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const artifact of ARTIFACTS) {
    try {
      // Skip if not a valid artifact structure
      if (!artifact.name || !artifact.functions) {
        console.log('⚠️  Skipping artifact: Invalid structure');
        skipCount++;
        continue;
      }

      console.log(`📦 Uploading ${artifact.name}...`);

      // Try to create the artifact
      await client.uploadContractArtifact(artifact);

      console.log(`✅ Successfully uploaded ${artifact.name}`);
      successCount++;
    } catch (error) {
      if (error && typeof error === 'object' && 'response' in error) {
        const responseError = error as { response?: { status?: number } };
        if (responseError.response?.status === 409) {
          console.log(`⏭️  ${artifact.name} already exists, skipping`);
          skipCount++;
          continue;
        }
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to upload ${artifact.name}:`, message);
      errorCount++;
    }
  }

  console.log('\n📊 Seeding complete:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ⏭️  Skipped: ${skipCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📦 Total: ${ARTIFACTS.length}`);

  if (errorCount > 0) {
    process.exit(1);
  }
}

// Run the seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedArtifacts().catch((error) => {
    console.error('Fatal error during seeding:', error);
    process.exit(1);
  });
}
