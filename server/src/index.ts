import http from 'node:http';
import { createApp } from './app';
import { pool } from './db/pool';
import { config } from './utils/config';

const server = http.createServer(createApp());

server.listen(config.port, () => {
  console.log(`Team Finder API listening on http://localhost:${config.port}`);
  if (!config.aiApiKey) console.log('AI_API_KEY not set — AI matching uses PostgreSQL skill matching.');
});

async function shutdown() {
  server.close();
  await pool.end();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
