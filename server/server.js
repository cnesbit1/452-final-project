import express from "express";
import { query, warmup, close } from "./db.js";
import bcrypt from "bcryptjs";
import cors from "cors";
import { createAuthToken, autoUpdateJobStatuses, validateAndGetUserIdFromAuthToken } from "./helperMethods.js";
import { ResumeS3DAO } from "./s3.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" })); // increase payload size limit for sending pdfs
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// CORS middleware - allow requests from the frontend dev server
// In production you should restrict this to your real frontend origin or use the `cors` package.
app.use((req, res, next) => {
  // Adjust the origin as needed for development/testing
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  // Allow preflight requests to short-circuit
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/v1/auth/status", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(400).json({ error: "No authorization header" });
    }
    const parts = authHeader.split(" ");
    if (parts.length !== 2) {
      return res.status(400).json({ error: "Format Bearer [authtoken]" });
    }

    const authtoken = parts[1];
    const { rows: token_rows } = await query(
      `SELECT a.user_id 
       FROM app.auths a
       WHERE a.token = $1`,
      [authtoken]
    );
    if (token_rows.length === 0) {
      return res.status(401).json({ authenticated: false });
    }
    return res.status(200).json({ authenticated: true });
  } catch (e) {
    console.error("checking login status error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/v1/auth/logout", async (req, res) => {
  try {
    // they give me authtoken I remove from table and say success
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(400).json({ error: "No authorization header" });
    }
    const parts = authHeader.split(" ");
    if (parts.length !== 2) {
      return res.status(400).json({ error: "Format Bearer [authtoken]" });
    }

    const authtoken = parts[1];
    const { rows: token_rows } = await query(
      `DELETE 
       FROM app.auths
       WHERE token = $1 RETURNING *`,
      [authtoken]
    );
    if (token_rows.length === 0) {
      return res.status(401).json({ error: "error deleting authtoken" });
    }
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error("logout error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/v1/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    // Query the auth table to find the user
    const { rows: user_rows } = await query(
      `SELECT id AS user_id, username, password_hash 
       FROM app.users
       WHERE username = $1`,
      [username]
    );

    if (user_rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = user_rows[0];
    const validated = await bcrypt.compare(password, user.password_hash); // (plaintext password, hashed password)
    if (!validated) {
      // incorrect password
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const { authtoken, success } = await createAuthToken(user.user_id);
    if (!success) {
      return res.status(401).json({ error: "Failed to create authtoken" });
    }

    // Send back user info (excluding password)
    res.json({
      user_id: user.user_id,
      username: user.username,
      token: authtoken,
    });
  } catch (e) {
    console.error("Login error:", e);
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
    const { rows: existing } = await query(
      `SELECT id FROM app.users WHERE username = $1`,
      [username]
    );
    if (existing.length !== 0) {
      return res.status(409).json({ error: "Username in use" });
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with credentials directly in app.users
    const { rows } = await query(
      `INSERT INTO app.users (username, password_hash)
       VALUES ($1, $2)
       RETURNING id`,
      [username, hashedPassword]
    );
    const newId = rows[0].id;

    console.log("User created", rows);
    if (rows.length === 0) {
      res.status(400).json({ error: "User not added to users table" });
    }
    const { authtoken, success } = await createAuthToken(newId);
    if (!success) {
      return res.status(500).json({ error: "Failed to create authtoken" });
    }

    res.status(201).json({
      user_id: newId,
      username,
      token: authtoken,
    });
  } catch (e) {
    console.error("Register error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/v1/tools/add-job", async (req, res) => {
  try {
    const {
      authToken,
      companyName,
      position,
      description,
      href,
      resumeBytes,
      resumeFileExtension,
    } = req.body;
    if (!authToken || !companyName || !position | !href) {
      return res
        .status(400)
        .json({ error: "authtoken, company, position and link are required" });
    }

    // use authtoken to get user_id and do verification
    const { rows: token_rows } = await query(
      `SELECT a.user_id 
       FROM app.auths a
       WHERE a.token = $1`,
      [authToken]
    );
    if (token_rows.length === 0) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user_id = token_rows[0].user_id;

    let resumeText = undefined;
    let resumeS3Link = undefined;

    if (resumeBytes) {
      // get the text from the resume file and insert that
      let s3DAO = new ResumeS3DAO();
      resumeS3Link = await s3DAO.putResume(resumeBytes, resumeFileExtension);
      console.log("resume stored with resume/", resumeS3Link);
    }

    const currentDate = new Date().toISOString();

    // dynamic insertion allowing for several fields to be empty
    const data = {
      user_id: user_id,
      date_applied: currentDate,
      company_name: companyName,
      position: position,
      posting_link: href,
      posting_description: description,
      resume_text: resumeText,
      resume_s3_link: resumeS3Link,
    };
    // construct statement
    const allFields = [
      "user_id",
      "date_applied",
      "company_name",
      "position",
      "posting_link",
      "posting_description",
      "resume_text",
      "resume_s3_link",
    ];
    const presentFields = allFields.filter(
      (field) => data[field] !== undefined
    );
    const values = presentFields.map((field) => data[field]);
    const placeholders = presentFields
      .map((_, index) => `$${index + 1}`)
      .join(", ");
    const columns = presentFields.join(", ");

    const { rows: job_rows } = await query(
      `INSERT INTO app.jobs (${columns})
        VALUES (${placeholders})
        RETURNING id;`,
      values
    );
    console.log("Job added:", job_rows);
  } catch (e) {
    console.error("Add job error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/v1/tools/jobs", async (req, res) => {
  try {
    const userId = await validateAndGetUserIdFromAuthToken(req, res);
    if (!userId) return; // validation failed, response already sent
    
    await autoUpdateJobStatuses(userId); // auto-update job statuses before fetching jobs

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
      SELECT id, company_name, position, status, date_applied, posting_link, created_at, posting_description, resume_s3_link
      FROM app.jobs
      WHERE ${clauses.join(" AND ")}
      ORDER BY created_at DESC
      LIMIT ${Math.min(Number(limit) || 50, 200)}`;

    const { rows } = await query(sql, args);
    console.log("rows:", rows);

    // TODO: convert the s3 links into resume data
    let s3DAO = new ResumeS3DAO();

      const modifiedRows = await Promise.all(rows.map(async row => {
        if (row.resume_s3_link) {
          return {
            ...row,
            resumeBytes: await s3DAO.getResume(row.resume_s3_link)
          };
        } else {
          return row;
        }
      }));
      res.json(modifiedRows);

  } catch (e) {
    console.error("Get jobs error:", e);
    res.status(500).json({ error: "internal" });
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

