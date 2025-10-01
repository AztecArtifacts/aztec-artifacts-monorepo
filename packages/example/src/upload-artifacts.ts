import type { AztecArtifactsApiClient } from '@aztec-artifacts/client';
import {
  PortalContractArtifact,
  ShieldGatewayContractArtifact,
  TokenContractArtifact,
} from '@turnstile-portal/aztec-artifacts';

/**
 * Example: Upload contract artifacts to the API
 *
 * Demonstrates how to upload multiple contract artifacts.
 */
export async function uploadArtifacts(client: AztecArtifactsApiClient): Promise<void> {
  console.log('\n=== UPLOADING CONTRACT ARTIFACTS ===\n');

  const artifacts = [
    { name: 'ShieldGateway', artifact: ShieldGatewayContractArtifact },
    { name: 'Portal', artifact: PortalContractArtifact },
    { name: 'Token', artifact: TokenContractArtifact },
  ];

  console.log(`Uploading ${artifacts.length} contract artifacts...\n`);

  for (const { name, artifact } of artifacts) {
    try {
      console.log(`📦 Uploading ${name} contract artifact...`);
      const result = await client.uploadContractArtifact(artifact);
      console.log(`✅ ${name} uploaded successfully!`);
      console.log(`   Contract Class ID: ${result.contractClassId}\n`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`❌ Failed to upload ${name}: ${error.message}\n`);
      } else {
        console.error(`❌ Failed to upload ${name}:`, error);
      }
    }
  }
}
