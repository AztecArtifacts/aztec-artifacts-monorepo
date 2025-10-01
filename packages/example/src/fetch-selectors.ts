import type { AztecArtifactsApiClient } from '@aztec-artifacts/client';
import { PortalContractArtifact, TokenContractArtifact } from '@turnstile-portal/aztec-artifacts';

/**
 * Example: Fetch function selectors from the API
 *
 * Demonstrates how to:
 * - Get all selectors for a contract artifact
 * - Get function signatures by selector
 * - Get contract artifacts that implement a selector
 */
export async function fetchSelectors(client: AztecArtifactsApiClient): Promise<void> {
  console.log('\n=== FETCHING FUNCTION SELECTORS ===\n');

  // First upload the Token artifact to get its contract class ID
  let tokenClassId: string | undefined;
  try {
    const result = await client.uploadContractArtifact(TokenContractArtifact);
    tokenClassId = result.contractClassId;
  } catch (error) {
    console.log(error);
    console.log('⚠️  Token artifact may already exist (continuing...)\n');
  }

  if (!tokenClassId) {
    console.log('⚠️  Could not determine Token contract class ID, skipping selector examples\n');
    return;
  }

  // Example 1: Get all selectors for a contract artifact
  console.log('📋 Fetching all selectors for Token contract...');
  console.log(`   Contract Class ID: ${tokenClassId}`);

  try {
    const selectorsResponse = await client.getSelectorsForArtifact(tokenClassId);
    console.log(`✅ Retrieved ${selectorsResponse.selectors.length} selectors`);
    console.log(`   Contract Class ID: ${selectorsResponse.contractClassId}\n`);

    // Display first few selectors with their signatures
    if (selectorsResponse.selectors.length > 0) {
      console.log('   First few selectors:');
      for (const item of selectorsResponse.selectors.slice(0, 5)) {
        console.log(`     ${item.selector}: ${item.signature}`);
      }
      if (selectorsResponse.selectors.length > 5) {
        console.log(`     ... and ${selectorsResponse.selectors.length - 5} more`);
      }
      console.log('');
    }

    // Example 2: Get function signatures by selector
    if (selectorsResponse.selectors.length > 0) {
      const firstSelector = selectorsResponse.selectors[0];
      if (firstSelector) {
        console.log('🔍 Fetching signatures for a specific selector...');
        console.log(`   Selector: ${firstSelector.selector}`);

        try {
          const signaturesResponse = await client.getSignaturesBySelector(firstSelector.selector);
          console.log(`✅ Found ${signaturesResponse.signatures.length} signature(s) for this selector:`);
          for (const sig of signaturesResponse.signatures) {
            console.log(`     - ${sig}`);
          }
          console.log('');
        } catch (error) {
          if (error instanceof Error) {
            console.error(`❌ Failed to fetch signatures: ${error.message}\n`);
          } else {
            console.error('❌ Failed to fetch signatures:', error);
          }
        }

        // Example 3: Get contract artifacts that implement a selector
        console.log('🔍 Fetching artifacts that implement this selector...');
        console.log(`   Selector: ${firstSelector.selector}`);

        try {
          const artifactsResponse = await client.getArtifactsForSelector(firstSelector.selector);
          console.log(`✅ Found ${artifactsResponse.contractClassIds.length} contract(s) implementing this selector:`);
          for (const classId of artifactsResponse.contractClassIds) {
            console.log(`     - ${classId}`);
          }
          console.log('');
        } catch (error) {
          if (error instanceof Error) {
            console.error(`❌ Failed to fetch artifacts: ${error.message}\n`);
          } else {
            console.error('❌ Failed to fetch artifacts:', error);
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Failed to fetch selectors: ${error.message}\n`);
    } else {
      console.error('❌ Failed to fetch selectors:', error);
    }
  }

  // Example 4: Compare selectors across multiple artifacts
  console.log('🔄 Analyzing selector overlap between contracts...');
  try {
    // Get Token selectors
    const tokenSelectors = await client.getSelectorsForArtifact(tokenClassId);
    const tokenSelectorSet = new Set(tokenSelectors.selectors.map((s: { selector: string }) => s.selector));

    console.log(`   Token contract has ${tokenSelectorSet.size} unique selectors`);

    // Try to get selectors from other contracts if available
    const allAddresses = await client.getAllContractAddresses({ limit: 50 });
    if (allAddresses.length > 0) {
      // Get a different contract's artifact - try Portal or ShieldGateway
      try {
        const portalResult = await client.uploadContractArtifact(PortalContractArtifact);
        const otherClassId = portalResult.contractClassId;

        if (otherClassId !== tokenClassId) {
          const otherSelectors = await client.getSelectorsForArtifact(otherClassId);
          const otherSelectorSet = new Set(otherSelectors.selectors.map((s: { selector: string }) => s.selector));

          // Find common selectors
          const commonSelectors = [...tokenSelectorSet].filter((s) => otherSelectorSet.has(s));

          console.log(`   Portal contract has ${otherSelectorSet.size} selectors`);
          console.log(`     Common with Token: ${commonSelectors.length} selectors`);
        }
      } catch {
        // Skip if Portal artifact not available
      }
    }
    console.log('');
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Failed to analyze selector overlap: ${error.message}\n`);
    } else {
      console.error('❌ Failed to analyze selector overlap:', error);
    }
  }
}
