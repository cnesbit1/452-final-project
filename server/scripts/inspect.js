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

const qJobs = `SELECT * FROM app.jobs;`

try {
  const t = await pool.query(qTables);
  const v = await pool.query(qViews);
  const k = await pool.query(qJobs);
  console.log("\nTables:");
  console.table(t.rows);
  console.log("\nViews:");
  console.table(v.rows);
  k.rows.forEach((row, index) => {
    console.log(`\n--- Job Row ${index + 1} ---`);
    // Iterate over the keys (column names) of the current row
    for (const column in row) {
        // console.log() automatically handles formatting various data types
        console.log(`${column}: ${row[column]}`);
    }
});
} catch (e) {
  console.error("Inspect failed:", e.message);
  process.exit(1);
} finally {
  await pool.end();
}
