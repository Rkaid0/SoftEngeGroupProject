import mysql from "mysql2/promise";
import { getConnection } from "./helpers/getDbConnection";

// Function to remove an item from the shopping list by item ID
let removeItemFromShoppingList = async (
  connection: mysql.Connection,
  shoppingListID: number,
  itemID: number
): Promise<mysql.ResultSetHeader> => {

  const [rows] = await connection.execute<mysql.ResultSetHeader>(
    "DELETE FROM shoppingListItem WHERE shoppingListID = ? AND idShoppingListItem = ?",
    [shoppingListID, itemID]
  );

  return rows;
};

export const handler = async (event: any) => {
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*",
  };

  try {
    const payload = JSON.parse(event.body || "{}");
    const shoppingListID = payload.shoppingListID;
    const idShoppingListItem = payload.idShoppingListItem;

    if (!shoppingListID || !idShoppingListItem) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Missing required fields." }),
      };
    }

    const connection = await getConnection();

    // Call the function to remove the item
    const result = await removeItemFromShoppingList(connection, shoppingListID, idShoppingListItem);

    if (result.affectedRows === 0) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Item not found." }),
      };
    }

    await connection.end();

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Item removed successfully",
        shoppingListID,
        idShoppingListItem
      }),
    };

  } catch (err: any) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
