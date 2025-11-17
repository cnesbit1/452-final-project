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