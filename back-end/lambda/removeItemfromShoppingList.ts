import mysql from "mysql2/promise";
import { getConnection } from "./helpers/getDbConnection";

let RemoveItemDB = async (
  connection: mysql.Connection,
  shoppingListID: number,
  categoryID: number
): Promise<mysql.ResultSetHeader> => {

  const [rows] = await connection.execute<mysql.ResultSetHeader>(
    "DELETE FROM shoppingListCategories WHERE shoppingListID = ? AND categoryID = ?",
    [shoppingListID, categoryID]
  );

  return rows;
};

export const removeItemFromShoppingList = async function(event: any) {
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*"
  };

  try {
    console.log("EVENT:", JSON.stringify(event));

    const payload = JSON.parse(event.body || "{}");
    const shoppingListID = payload.shoppingListID;
    const categoryID = payload.categoryID;

    if (!shoppingListID || !categoryID) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "Missing required fields: shoppingListID, categoryID"
        }),
      };
    }

    // Get DB connection
    const connection = await getConnection();

    const result: mysql.ResultSetHeader = await RemoveItemDB(
      connection,
      shoppingListID,
      categoryID
    );

    await connection.end();

    // No row deleted = item wasn't on list
    if (result.affectedRows === 0) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "Item not found on this shopping list"
        }),
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Item removed successfully",
        shoppingListID,
        categoryID
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
