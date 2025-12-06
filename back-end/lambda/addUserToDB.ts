import { getConnection } from "./helpers/getDbConnection";
import mysql from "mysql2/promise";

export const handler = async (event: any) => {
  const { email } = event;

  if (!email) return;

  const conn = await getConnection();

  // Check if exists
  const [existing] = await conn.execute(
    "SELECT userID FROM Users WHERE email = ?",
    [email]
  );

  if (Array.isArray(existing) && existing.length > 0) {
    console.log("User already exists:", email);
    await conn.end();
    return;
  }

  // Insert new user
  await conn.execute(
    "INSERT INTO Users (email) VALUES (?)",
    [email]
  );

  console.log("Inserted new user:", email);
  await conn.end();
};
