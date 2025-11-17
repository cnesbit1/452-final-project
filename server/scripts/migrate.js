import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sql = await fs.readFile(path.join(__dirname, '../schema.sql'), 'utf8');
try {
  await pool.query('BEGIN');
  await pool.query(sql);
  await pool.query('COMMIT');
  console.log('Migration applied.');
} catch (e) {
  await pool.query('ROLLBACK');
  console.error('Migration failed:', e.message);
  process.exit(1);
} finally {
  await pool.end();
}