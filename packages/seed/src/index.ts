#!/usr/bin/env node
import 'dotenv/config';

// Import and run the seed-artifacts script
import('./seed-artifacts.js').catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
