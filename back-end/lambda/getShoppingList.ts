import mysql from "mysql2/promise";
import { getConnection } from "./helpers/getDbConnection"; // filename is getDbConnection.ts

// --- DB QUERY FUNCTION ---
let GetShoppingListsDB = async (
  connection: mysql.Connection,
  userID: Number
) => {
  const [rows] = await connection.execute(
    "SELECT shoppingListID, userID, name FROM ShoppingList WHERE userID = ? ORDER BY shoppingListID DESC",
    [userID]
  );

  return rows as any[];
};

// --- HANDLER ---
export const getShoppingLists = async function(event: any) {
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

    if (!userID) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Missing required field: userID" }),
      };
    }

    // connect to db
    const connection = await getConnection();

    const lists = await GetShoppingListsDB(connection, userID);

    await connection.end();

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(lists),
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
