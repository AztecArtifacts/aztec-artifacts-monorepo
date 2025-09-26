import { spawn } from 'node:child_process';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_BASE_URL = 'https://api.aztec-artifacts.org/v1';
const DEFAULT_PORT = process.env.PORT ?? '4173';

const filePath = fileURLToPath(import.meta.url);
const packageRoot = path.resolve(path.dirname(filePath), '..');
const distDir = path.join(packageRoot, 'dist');
const runtimeConfigPath = path.join(distDir, 'runtime-config.js');

async function ensureDistExists() {
  try {
    await stat(distDir);
  } catch {
    console.error('❌ inspector dist/ directory not found. Run `pnpm build` before starting preview.');
    process.exit(1);
  }
}

function resolveBaseUrl() {
  const candidates = [process.env.INSPECTOR_BASE_URL, process.env.VITE_INSPECTOR_BASE_URL];
  for (const candidate of candidates) {
    if (candidate && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  return DEFAULT_BASE_URL;
}

async function writeRuntimeConfig(baseUrl) {
  await mkdir(distDir, { recursive: true });
  const content = `window.__INSPECTOR_BASE_URL__ = ${JSON.stringify(baseUrl)};\n`;
  await writeFile(runtimeConfigPath, content, 'utf-8');
}

async function main() {
  await ensureDistExists();
  const baseUrl = resolveBaseUrl();
  await writeRuntimeConfig(baseUrl);
  console.info(`ℹ️  inspector default base URL set to ${baseUrl}`);

  const preview = spawn(
    'pnpm',
    ['exec', 'vite', 'preview', '--host', '0.0.0.0', '--port', DEFAULT_PORT],
    {
      cwd: packageRoot,
      stdio: 'inherit',
      env: process.env,
    },
  );

  preview.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

await main();
