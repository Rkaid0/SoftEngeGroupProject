import mysql from "mysql2/promise";
import { getConnection } from "./helpers/getDbConnection";

let AddShoppingListDB = async (
  connection: mysql.Connection,
  userID: Number,
  name: string
): Promise<mysql.ResultSetHeader> => {

  const [rows] = await connection.execute<mysql.ResultSetHeader>(
    "INSERT INTO shoppingList (userID, name) VALUES (?, ?)",
    [userID, name]
  );

  return rows;
};

export const createShoppingList = async function(event: any) {
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*"
  };

  try {
    console.log(JSON.stringify(event));

    const payload = JSON.parse(event.body || "{}");

    const userID = payload.userID;
    const name = payload.name;

    if (!userID || !name) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Missing required fields: userID, name" }),
      };
    }

    const connection = await getConnection();

    const result: mysql.ResultSetHeader = await AddShoppingListDB(
      connection,
      userID,
      name
    );

    await connection.end();

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        shoppingListID: result.insertId,
        userID,
        name,
        items: []
      }),
    };

  } catch (error: any) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Server error",
        details: error.message || error,
      }),
    };
  }
};
