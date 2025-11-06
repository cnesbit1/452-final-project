import express from "express";
import { query, warmup, close } from "./db.js";
import bcrypt from "bcryptjs";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors())

// CORS middleware - allow requests from the frontend dev server
// In production you should restrict this to your real frontend origin or use the `cors` package.
app.use((req, res, next) => {
  // Adjust the origin as needed for development/testing
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  // Allow preflight requests to short-circuit
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.post("/v1/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    // Query the auth table to find the user
    const { rows: auth_rows } = await query(
      `SELECT a.user_id, a.username, a.password_hash 
       FROM app.auth a
       WHERE a.username = $1`,
      [username]
    );

    if (auth_rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validated = await bcrypt.compare(password, auth_rows[0].password_hash); // (plaintext password, hashed password)
    if (!validated) { // incorrect password
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Send back user info (excluding password)
    res.json({
      user_id: auth_rows[0].user_id,
      username: auth_rows[0].username
    });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/v1/auth/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }
    // verify that username is not already in use
    const { rows: user_rows } = await query(
      `SELECT a.user_id, a.username 
       FROM app.auth a
       WHERE a.username = $1`,
      [username]
    );

    if (user_rows.length !== 0) {
      return res.status(401).json({ error: "Username in use" });
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // TODO: first create row in users table, then insert user into auth table using that userID
    const { rows } = await query(
      `INSERT INTO app.users DEFAULT VALUES RETURNING id;`
    );
    const newId = rows[0].id;
    const { rows: auth_rows} = await query(
      `INSERT INTO app.auth(username, password_hash, user_id)
      VALUES ($1, $2, $3)
      RETURNING id`, [username, hashedPassword, newId]
    );

    console.log("User created", auth_rows);
    if (auth_rows === 0) {
      res.status(400).json({ error: "User not added to auth table" })
    }

    // Send back user info (excluding password)
    res.json({
      user_id: rows[0].user_id,
      username: rows[0].username
    });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ error: "Internal server error" });
  }
});


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
