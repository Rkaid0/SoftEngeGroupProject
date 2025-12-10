import mysql from "mysql2/promise";
import { getConnection } from "./helpers/getDbConnection";

let AddItemToListDB = async (
  connection: mysql.Connection,
  shoppingListID: number,
  categoryID: number
): Promise<mysql.ResultSetHeader> => {

  const [rows] = await connection.execute<mysql.ResultSetHeader>(
    "INSERT INTO shoppingListCategories (shoppingListID, categoryID) VALUES (?, ?)",
    [shoppingListID, categoryID]
  );

  return rows;
};

export const addItemToShoppingList = async function(event: any) {
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*"
  }

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

    let result: mysql.ResultSetHeader;

    try {
      result = await AddItemToListDB(connection, shoppingListID, categoryID);
    } catch (error: any) {
      // Duplicate entry means already linked (PK constraint)
      if (error.code === "ER_DUP_ENTRY") {
        await connection.end();
        return {
          statusCode: 409,
          headers: corsHeaders,
          body: JSON.stringify({
            error: "Category is already on this shopping list."
          }),
        };
      }
      throw error;
    }

    await connection.end();

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Item added to shopping list successfully",
        shoppingListID,
        categoryID,
        insertId: result.insertId || null
      }),
    };

  } catch (error: any) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Server error",
        details: error.message || error
      }),
    };
  }
};
