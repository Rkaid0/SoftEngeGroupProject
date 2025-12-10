import mysql from "mysql2/promise";
import { getConnection } from "./helpers/getDbConnection"; // filename is getDbConnection.ts

let DeleteShoppingListDB = async (
  connection: mysql.Connection,
  shoppingListID: Number
): Promise<mysql.ResultSetHeader> => {

  const [rows] = await connection.execute<mysql.ResultSetHeader>(
    "DELETE FROM shoppingList WHERE shoppingListID = ?",
    [shoppingListID]
  );

  return rows;
};

export const deleteShoppingList = async function(event: any) {
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*"
  };

  try {
    console.log(JSON.stringify(event));

    const payload = JSON.parse(event.body || "{}");
    const shoppingListID = payload.shoppingListID;

    if (!shoppingListID) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Missing required field: shoppingListID" }),
      };
    }

    // connect to db
    const connection = await getConnection();

    const result: mysql.ResultSetHeader = await DeleteShoppingListDB(
      connection,
      shoppingListID
    );

    await connection.end();

    // If no rows deleted → invalid ID
    if (result.affectedRows === 0) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "Shopping list not found",
          shoppingListID
        }),
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Shopping list deleted successfully",
        shoppingListID
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
