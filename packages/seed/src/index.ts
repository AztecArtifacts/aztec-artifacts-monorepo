#!/usr/bin/env node
import 'dotenv/config';
import { seedArtifacts } from './seed-artifacts.js';

// Run the seeding
seedArtifacts().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
