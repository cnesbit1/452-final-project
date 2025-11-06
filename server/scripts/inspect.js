import { pool } from "../db.js";

const qTables = `
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_type='BASE TABLE'
  AND table_schema NOT IN ('pg_catalog','information_schema')
ORDER BY 1,2;`;

const qViews = `
SELECT table_schema, table_name
FROM information_schema.views
WHERE table_schema NOT IN ('pg_catalog','information_schema')
ORDER BY 1,2;`;

try {
  const t = await pool.query(qTables);
  const v = await pool.query(qViews);
  console.log("\nTables:");
  console.table(t.rows);
  console.log("\nViews:");
  console.table(v.rows);
} catch (e) {
  console.error("Inspect failed:", e.message);
  process.exit(1);
} finally {
  await pool.end();
}
