import express from "express";
import { query, warmup, close } from "./db.js";

const app = express();
app.use(express.json());

app.get("/healthz", async (_req, res) => {
  try {
    await query("select 1");
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/extensions", async (_req, res) => {
  const { rows } = await query(
    "select extname, extversion from pg_extension order by extname"
  );
  res.json(rows);
});

app.post("/v1/jobs", async (req, res) => {
  try {
    const userId = 1;
    const b = req.body || {};
    if (!b.company_name || !b.position) {
      return res
        .status(400)
        .json({ error: "company_name and position required" });
    }
    const { rows } = await query(
      `INSERT INTO app.jobs
         (user_id, company_name, position, status, posting_link, posting_description,
          date_applied, resume_text, resume_s3_link)
       VALUES ($1,$2,$3,COALESCE($4,'saved'),$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        userId,
        b.company_name,
        b.position,
        b.status,
        b.posting_link,
        b.posting_description,
        b.date_applied,
        b.resume_text,
        b.resume_s3_link,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "internal" });
  }
});

app.get("/v1/jobs", async (req, res) => {
  try {
    const userId = 1;
    const { status, company, q, from, to, limit = 50 } = req.query;
    const clauses = ["user_id = $1"];
    const args = [userId];
    let i = 2;

    if (status) {
      clauses.push(`status = $${i++}`);
      args.push(status);
    }
    if (company) {
      clauses.push(`company_name ILIKE $${i++}`);
      args.push(`%${company}%`);
    }
    if (from) {
      clauses.push(`date_applied >= $${i++}`);
      args.push(from);
    }
    if (to) {
      clauses.push(`date_applied <= $${i++}`);
      args.push(to);
    }
    if (q) {
      clauses.push(`(position ILIKE $${i} OR posting_description ILIKE $${i})`);
      args.push(`%${q}%`);
      i++;
    }

    const sql = `
      SELECT id, company_name, position, status, date_applied, posting_link, created_at
      FROM app.jobs
      WHERE ${clauses.join(" AND ")}
      ORDER BY created_at DESC
      LIMIT ${Math.min(Number(limit) || 50, 200)}`;
    const { rows } = await query(sql, args);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "internal" });
  }
});

app.get("/v1/jobs/:id", async (req, res) => {
  try {
    const userId = 1;
    const { rows } = await query(
      `SELECT * FROM app.jobs WHERE id=$1 AND user_id=$2`,
      [req.params.id, userId]
    );
    if (!rows[0]) return res.status(404).json({ error: "not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "internal" });
  }
});

function pick(obj, allowed) {
  const out = {};
  for (const k of allowed) if (obj && obj[k] !== undefined) out[k] = obj[k];
  return out;
}

app.patch("/v1/jobs/:id", async (req, res) => {
  try {
    const userId = 1;
    const allowed = [
      "company_name",
      "position",
      "status",
      "posting_link",
      "posting_description",
      "date_applied",
      "resume_text",
      "resume_s3_link",
    ];
    const body = pick(req.body, allowed);
    if (!Object.keys(body).length)
      return res.status(400).json({ error: "no fields to update" });

    const sets = [];
    const args = [];
    let i = 1;
    for (const [k, v] of Object.entries(body)) {
      sets.push(`${k}=$${i++}`);
      args.push(v);
    }
    args.push(req.params.id, userId);
    const { rows } = await query(
      `UPDATE app.jobs SET ${sets.join(", ")}, last_date_updated = CURRENT_DATE
       WHERE id=$${i++} AND user_id=$${i}
       RETURNING *`,
      args
    );
    if (!rows[0]) return res.status(404).json({ error: "not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "internal" });
  }
});

app.delete("/v1/jobs/:id", async (req, res) => {
  try {
    const userId = 1;
    const { rowCount } = await query(
      `DELETE FROM app.jobs WHERE id=$1 AND user_id=$2`,
      [req.params.id, userId]
    );
    if (!rowCount) return res.status(404).json({ error: "not found" });
    res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "internal" });
  }
});

app.get("/v1/companies", async (_req, res) => {
  try {
    const userId = 1;
    const { rows } = await query(
      `SELECT company_name, total_applications, number_ghosted, last_applied_at
         FROM app.company_stats
        WHERE user_id=$1
        ORDER BY total_applications DESC, company_name ASC
        LIMIT 200`,
      [userId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "internal" });
  }
});

app.get("/v1/companies/:name", async (req, res) => {
  try {
    const userId = 1;
    const name = decodeURIComponent(req.params.name);
    const stats = await query(
      `SELECT company_name, total_applications, number_ghosted, last_applied_at
         FROM app.company_stats
        WHERE user_id=$1 AND company_name=$2`,
      [userId, name]
    );
    const jobs = await query(
      `SELECT id, position, status, date_applied, posting_link, created_at
         FROM app.jobs
        WHERE user_id=$1 AND company_name=$2
        ORDER BY created_at DESC
        LIMIT 50`,
      [userId, name]
    );
    if (!stats.rows[0]) return res.status(404).json({ error: "not found" });
    res.json({ ...stats.rows[0], recent_jobs: jobs.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "internal" });
  }
});

app.get("/v1/users/me/stats", async (_req, res) => {
  try {
    const userId = 1;
    const { rows } = await query(
      `SELECT * FROM app.user_stats WHERE user_id=$1`,
      [userId]
    );
    res.json(
      rows[0] || {
        total: 0,
        accepted: 0,
        rejected: 0,
        ghosted: 0,
        interviewing: 0,
        offers: 0,
      }
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "internal" });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, async () => {
  await warmup();
  console.log(`API listening on :${port}`);
});

process.on("SIGINT", async () => {
  await close();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await close();
  process.exit(0);
});
