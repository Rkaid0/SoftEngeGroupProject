import mysql from "mysql2/promise";
import { getConnection } from "./helpers/getDbConnection"; // filename is getDbConnection.ts


let AddShoppingListDB = async (
  connection: mysql.Connection,
  userID: Number
): Promise<mysql.ResultSetHeader> => {

  const [rows] = await connection.execute<mysql.ResultSetHeader>(
    "INSERT INTO ShoppingList (userID) VALUES (?)",
    [userID]
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

    if (!userID) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Missing required field: userID" }),
      };
    }

    // connect to db
    const connection = await getConnection();

    const result: mysql.ResultSetHeader = await AddShoppingListDB(
      connection,
      userID
    );

    await connection.end();

    const shoppingListID = result.insertId;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        shoppingListID,
        userID,
        items: [], // a new shopping list starts empty (optional)
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
