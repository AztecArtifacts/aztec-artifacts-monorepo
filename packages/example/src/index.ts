import { AztecArtifactsApiClient } from '@aztec-artifacts/client';
import { fetchArtifacts } from './fetch-artifacts.js';
import { fetchContractAddresses } from './fetch-contract-addresses.js';
import { fetchSelectors } from './fetch-selectors.js';
import { fetchTokens } from './fetch-tokens.js';
import { uploadArtifacts } from './upload-artifacts.js';

/**
 * Comprehensive example demonstrating all Aztec Artifacts API client capabilities.
 *
 * This demo runs through a complete workflow:
 * 1. Upload contract artifacts
 * 2. Fetch artifacts back
 * 3. Query tokens
 * 4. Query contract addresses
 * 5. Query function selectors
 */
async function main() {
  const apiUrl = process.env.API_BASE_URL || 'http://localhost:8080';
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   Aztec Artifacts API Client - Comprehensive Examples');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\nAPI URL: ${apiUrl}\n`);

  // Initialize the client
  const client = new AztecArtifactsApiClient({
    baseUrl: apiUrl,
  });

  try {
    // Step 1: Upload artifacts
    await uploadArtifacts(client);

    // Step 2: Fetch artifacts
    await fetchArtifacts(client);

    // Step 3: Query tokens
    await fetchTokens(client);

    // Step 4: Query contract addresses
    await fetchContractAddresses(client);

    // Step 5: Query selectors
    await fetchSelectors(client);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✨ All examples completed successfully!');
    console.log('═══════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('\n═══════════════════════════════════════════════════════════');
    console.error('❌ Fatal error during example execution:');
    console.error('═══════════════════════════════════════════════════════════');
    if (error instanceof Error) {
      console.error(`\n${error.message}`);
      if (error.stack) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
