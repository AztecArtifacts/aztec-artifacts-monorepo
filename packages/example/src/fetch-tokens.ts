import type { AztecArtifactsApiClient } from '@aztec-artifacts/client';

/**
 * Example: Fetch tokens from the API
 *
 * Demonstrates how to:
 * - Get tokens with pagination
 * - Get all tokens at once
 * - Get a specific token by address
 */
export async function fetchTokens(client: AztecArtifactsApiClient): Promise<void> {
  console.log('\n=== FETCHING TOKENS ===\n');

  // Example 1: Get tokens with pagination
  console.log('📄 Fetching first page of tokens (limit: 10)...');
  try {
    const firstPage = await client.getTokens({ limit: 10 });
    console.log(`✅ Retrieved ${firstPage.data.length} tokens`);
    console.log(`   Has more pages: ${firstPage.pagination.hasMore}`);

    if (firstPage.data.length > 0) {
      const firstToken = firstPage.data[0];
      if (firstToken) {
        console.log('\n   First token:');
        console.log(`     Address: ${firstToken.address}`);
        console.log(`     Name: ${firstToken.name}`);
        console.log(`     Symbol: ${firstToken.symbol}`);
        console.log(`     Decimals: ${firstToken.decimals}\n`);
      }
    }

    // Example 2: Get next page if available
    if (firstPage.pagination.nextCursor) {
      console.log('📄 Fetching next page of tokens...');
      const secondPage = await client.getTokens({
        limit: 10,
        cursor: firstPage.pagination.nextCursor,
      });
      console.log(`✅ Retrieved ${secondPage.data.length} more tokens\n`);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Failed to fetch tokens: ${error.message}\n`);
    } else {
      console.error('❌ Failed to fetch tokens:', error);
    }
  }

  // Example 3: Get all tokens at once (automatic pagination)
  console.log('📋 Fetching ALL tokens (automatic pagination)...');
  try {
    const allTokens = await client.getAllTokens();
    console.log(`✅ Retrieved all ${allTokens.length} tokens\n`);

    // Display summary
    if (allTokens.length > 0) {
      console.log('   Token Summary:');
      for (const token of allTokens.slice(0, 5)) {
        console.log(`     - ${token.symbol} (${token.name}): ${token.address}`);
      }
      if (allTokens.length > 5) {
        console.log(`     ... and ${allTokens.length - 5} more\n`);
      } else {
        console.log('');
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Failed to fetch all tokens: ${error.message}\n`);
    } else {
      console.error('❌ Failed to fetch all tokens:', error);
    }
  }

  // Example 4: Get a specific token by address
  console.log('🔍 Fetching specific token by address...');
  try {
    const allTokens = await client.getAllTokens();
    if (allTokens.length > 0 && allTokens[0]) {
      const tokenAddress = allTokens[0].address;
      console.log(`   Looking up token: ${tokenAddress}`);

      const token = await client.getTokenByAddress(tokenAddress);
      console.log('✅ Token retrieved!');
      console.log(`   Name: ${token.name}`);
      console.log(`   Symbol: ${token.symbol}`);
      console.log(`   Decimals: ${token.decimals}\n`);
    } else {
      console.log('⚠️  No tokens available to fetch by address\n');
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Failed to fetch token by address: ${error.message}\n`);
    } else {
      console.error('❌ Failed to fetch token by address:', error);
    }
  }
}
