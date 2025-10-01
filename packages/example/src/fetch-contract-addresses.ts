import type { AztecArtifactsApiClient } from '@aztec-artifacts/client';
import { TokenContractArtifact } from '@turnstile-portal/aztec-artifacts';

/**
 * Example: Fetch contract addresses from the API
 *
 * Demonstrates how to:
 * - Get contract addresses with pagination
 * - Get all contract addresses at once
 * - Get contract addresses by contract class ID
 * - Filter by match type (current, original, any)
 */
export async function fetchContractAddresses(client: AztecArtifactsApiClient): Promise<void> {
  console.log('\n=== FETCHING CONTRACT ADDRESSES ===\n');

  // Example 1: Get contract addresses with pagination
  console.log('📄 Fetching first page of contract addresses (limit: 10)...');
  try {
    const firstPage = await client.getContractAddresses({ limit: 10 });
    console.log(`✅ Retrieved ${firstPage.data.length} contract addresses`);
    console.log(`   Has more pages: ${firstPage.pagination.hasMore}`);

    if (firstPage.data.length > 0) {
      console.log('\n   First few addresses:');
      for (const address of firstPage.data.slice(0, 3)) {
        console.log(`     - ${address}`);
      }
      console.log('');
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Failed to fetch contract addresses: ${error.message}\n`);
    } else {
      console.error('❌ Failed to fetch contract addresses:', error);
    }
  }

  // Example 2: Get all contract addresses at once (automatic pagination)
  console.log('📋 Fetching ALL contract addresses (automatic pagination)...');
  try {
    const allAddresses = await client.getAllContractAddresses();
    console.log(`✅ Retrieved all ${allAddresses.length} contract addresses\n`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Failed to fetch all addresses: ${error.message}\n`);
    } else {
      console.error('❌ Failed to fetch all addresses:', error);
    }
  }

  // Example 3: Get contract addresses by contract class ID
  // First upload the Token artifact to get its contract class ID
  console.log('🔍 Uploading Token artifact to get contract class ID...');
  let tokenClassId: string | undefined;
  try {
    const result = await client.uploadContractArtifact(TokenContractArtifact);
    tokenClassId = result.contractClassId;
  } catch (error) {
    // Artifact may already exist, try to get addresses anyway
    console.log(error);
    console.log('⚠️  Token artifact may already exist (continuing...)\n');
  }

  if (tokenClassId) {
    console.log('🔍 Fetching contract addresses by contract class ID...');
    console.log(`   Contract Class ID: ${tokenClassId}`);

    try {
      // Get addresses with default match (current)
      const addressesPage = await client.getContractAddressesByClassId(tokenClassId, { limit: 10 });
      console.log(`✅ Found ${addressesPage.data.length} addresses for this class`);
      console.log(`   Has more pages: ${addressesPage.pagination.hasMore}\n`);

      if (addressesPage.data.length > 0) {
        console.log('   Addresses:');
        for (const address of addressesPage.data.slice(0, 3)) {
          console.log(`     - ${address}`);
        }
        if (addressesPage.data.length > 3) {
          console.log(`     ... and ${addressesPage.data.length - 3} more`);
        }
        console.log('');
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`❌ Failed to fetch addresses by class: ${error.message}\n`);
      } else {
        console.error('❌ Failed to fetch addresses by class:', error);
      }
    }
  }

  // Example 4: Get all addresses by class ID with different match types
  if (tokenClassId) {
    console.log('🔍 Fetching ALL addresses by class ID with different match types...');

    const matchTypes: Array<'current' | 'original' | 'any'> = ['current', 'original', 'any'];

    for (const matchType of matchTypes) {
      try {
        const addresses = await client.getAllContractAddressesByClassId(tokenClassId, { match: matchType });
        console.log(`   Match type '${matchType}': ${addresses.length} addresses`);
      } catch (error) {
        if (error instanceof Error) {
          console.error(`   ❌ Failed for match type '${matchType}': ${error.message}`);
        } else {
          console.error(`   ❌ Failed for match type '${matchType}':`, error);
        }
      }
    }
    console.log('');
  }
}
