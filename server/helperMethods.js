// any business logic that the db needs to do could go here for now
import { query } from "./db.js";

function generateToken() {
    try {
      return uuid().toString();
    } catch (error) {
      // UUID not available. Generating a random string. Making it 64 characters to reduce the liklihood of a duplicate
      let result = "";
      const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$^*()-+";
      const charactersLength = characters.length;
      for (let i = 0; i < 64; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * charactersLength)
        );
      }

      return result;
    }
  }

export async function createAuthToken(user_id){
  const authtoken = generateToken();
  const { rows: token_rows } = await query(
    `INSERT INTO app.auths (user_id, token) VALUES ($1, $2) RETURNING *;`, [user_id, authtoken]
  );
  if (token_rows.length === 0) {
    console.log({authtoken: authtoken, success: false})
    return {authtoken: authtoken, success: false}
  }
  console.log({authtoken: authtoken, success: true})
  return {authtoken: authtoken, success: true}
}

export async function validateAndGetUserIdFromAuthToken(req, res){
  const authHeader = req.headers["authorization"];
    if (!authHeader) {
      res.status(400).json({ error: "No authorization header" });
      return null;
    }
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      res.status(400).json({ error: "Format must be: Bearer [authtoken]" });
      return null;
    }

    const authtoken = parts[1];
    const { rows: token_rows } = await query(
      `SELECT a.user_id 
       FROM app.auths a
       WHERE a.token = $1`,
      [authtoken]
    );

    if (token_rows.length === 0) {
      res.status(401).json({ error: "Unauthorized" });
      return null;
    }

    const userId = token_rows[0].user_id;
    return userId;
}

// auto update status of jobs based on last_updated column # last_date_updated

export async function autoUpdateJobStatuses(user_id){
  const { rows } = await query(
      `UPDATE app.jobs
      SET status = 'ghosted'
      WHERE user_id = $1
      AND status <> 'ghosted' AND status <> 'offer' AND status <> 'rejected'
      AND last_date_updated < NOW() - INTERVAL '30 days'`,
      [user_id]
    );
}