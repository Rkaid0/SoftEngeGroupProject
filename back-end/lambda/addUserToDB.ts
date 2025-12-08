import { getConnection } from "./helpers/getDbConnection";
import mysql from "mysql2/promise";

export const handler = async (event: any) => {
  let conn: mysql.Connection | null = null;

  try {
    console.log("AddUser Lambda invoked with event:", event);

    const { email } = event;
    if (!email) {
      console.error("Missing email in event");
      return { userID: null };
    }

    conn = await getConnection();

    // 1. Check if user already exists
    const [existing]: any = await conn.execute(
      "SELECT userID FROM Users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      const existingID = existing[0].userID;
      console.log("User already exists:", email, "ID =", existingID);

      return {
        statusCode: 200,
        userID: existingID,
      };
    }

    // 2. Insert new user
    const [insertResult]: any = await conn.execute(
      "INSERT INTO Users (email) VALUES (?)",
      [email]
    );

    const newUserID = insertResult.insertId;
    console.log("Inserted new user:", email, "ID =", newUserID);

    return {
      statusCode: 200,
      userID: newUserID,
    };

  } catch (err: any) {
    console.error("ERROR in AddUser Lambda:", err);

    return {
      statusCode: 500,
      userID: null,
      error: err.message || String(err),
    };

  } finally {
    if (conn) {
      await conn.end();
    }
  }
};
