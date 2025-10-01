import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';

const DEFAULT_BASE_URL = 'https://api.aztec-artifacts.org/v1';
const DEFAULT_PORT = process.env.PORT ?? '4173';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');

async function start() {
  const baseUrl = process.env.INSPECTOR_BASE_URL?.trim() || DEFAULT_BASE_URL;
  const port = Number.parseInt(DEFAULT_PORT, 10);

  const server = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  });

  // Serve runtime config as a dynamic endpoint
  server.get('/runtime-config.js', async (request, reply) => {
    reply
      .type('application/javascript')
      .send(`window.__INSPECTOR_BASE_URL__ = ${JSON.stringify(baseUrl)};\n`);
  });

  // Serve static files from dist/
  await server.register(fastifyStatic, {
    root: distDir,
    prefix: '/',
  });

  // SPA fallback - serve index.html for client-side routes
  server.setNotFoundHandler((request, reply) => {
    reply.sendFile('index.html');
  });

  await server.listen({ port, host: '0.0.0.0' });
  console.log(`Inspector running at http://0.0.0.0:${port}`);
  console.log(`Base URL configured: ${baseUrl}`);
}

start().catch((err) => {
  console.error('Failed to start inspector server:', err);
  process.exit(1);
});
