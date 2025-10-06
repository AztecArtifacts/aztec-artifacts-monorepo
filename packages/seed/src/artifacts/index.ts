/**
 * Central registry of all contract artifacts to seed.
 *
 * To add a new set of artifacts:
 * 1. Create a new file in this directory (e.g., my-contracts.ts)
 * 2. Export const ARTIFACTS = [...] from that file
 * 3. Import and spread it here
 */

import { ARTIFACTS as NOIR_CONTRACTS } from './noir-contracts.js';
import { ARTIFACTS as NOIR_TEST_CONTRACTS } from './noir-test-contracts.js';

export const ARTIFACTS = [...NOIR_CONTRACTS, ...NOIR_TEST_CONTRACTS];
