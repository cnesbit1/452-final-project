import 'dotenv/config';
import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  application_name: 'timescale-node-starter'
});

export async function query(text, params) {
  return pool.query(text, params);
}

export async function warmup() {
  let delay = 200;
  for (let i = 0; i < 5; i++) {
    try { await query('select 1'); return; }
    catch (e) {
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }
  throw new Error('DB warmup failed');
}

export async function close() {
  await pool.end();
}
