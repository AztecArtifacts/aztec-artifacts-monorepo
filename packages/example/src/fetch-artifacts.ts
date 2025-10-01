import type { AztecArtifactsApiClient } from '@aztec-artifacts/client';
import {
  PortalContractArtifact,
  ShieldGatewayContractArtifact,
  TokenContractArtifact,
} from '@turnstile-portal/aztec-artifacts';

/**
 * Example: Fetch contract artifacts from the API
 *
 * Demonstrates how to:
 * - Get a single artifact by contract class ID
 * - Get an artifact by artifact hash
 */
export async function fetchArtifacts(client: AztecArtifactsApiClient): Promise<void> {
  console.log('\n=== FETCHING CONTRACT ARTIFACTS ===\n');

  // We'll use the known artifacts to upload first, so we have identifiers to fetch
  const testArtifacts = [
    { name: 'Token', artifact: TokenContractArtifact },
    { name: 'Portal', artifact: PortalContractArtifact },
    { name: 'ShieldGateway', artifact: ShieldGatewayContractArtifact },
  ];

  // First, ensure artifacts are uploaded and get their contract class IDs
  const artifactIds: Array<{ name: string; contractClassId: string }> = [];

  for (const { name, artifact } of testArtifacts) {
    try {
      const result = await client.uploadContractArtifact(artifact);
      artifactIds.push({ name, contractClassId: result.contractClassId });
    } catch (error) {
      // Artifact may already exist, which is fine
      console.log(error);
      console.log(`⚠️  ${name} artifact may already exist (continuing...)`);
    }
  }

  // Now fetch artifacts by contract class ID
  for (const { name, contractClassId } of artifactIds) {
    try {
      console.log(`🔍 Fetching ${name} artifact by contract class ID...`);
      console.log(`   Contract Class ID: ${contractClassId}`);

      const fetchedArtifact = await client.getArtifact(contractClassId);

      console.log(`✅ ${name} artifact retrieved!`);
      console.log(`   Name: ${fetchedArtifact.name}`);
      console.log(`   Functions: ${fetchedArtifact.functions.length}`);
      console.log(`   File Map Entries: ${Object.keys(fetchedArtifact.fileMap || {}).length}\n`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`❌ Failed to fetch ${name}: ${error.message}\n`);
      } else {
        console.error(`❌ Failed to fetch ${name}:`, error);
      }
    }
  }
}
