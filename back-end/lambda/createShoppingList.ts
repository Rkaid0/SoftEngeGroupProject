
import mysql from "mysql2/promise";
import { getConnection } from "./helpers/getDbConnection"; // filename is getDbConnection.ts



export const handler = async (event : any) => {
  try {
    // Parse user input (API Gateway sends body as string)
    const body = JSON.parse(event.body);

    const { userID, name } = body;

    if (!userID || !name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "userID and name are required" }),
      };
    }

    // connect to DB and insert
    const connection = await getConnection();
    try {
      const [result] = await connection.execute<mysql.ResultSetHeader>(
        `INSERT INTO shoppingLists (userID, name) VALUES (?, ?)`,
        [userID, name]
      );

      const shoppingListID = (result as mysql.ResultSetHeader).insertId;

      return {
        statusCode: 200,
        body: JSON.stringify({ shoppingListID, userID, name }),
      };
    } finally {
      // always close DB connection
      await connection.end();
    }

    

    // unreachable — response returned from inside try block above

  } catch (err) {
    console.error("Error creating shopping list:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
