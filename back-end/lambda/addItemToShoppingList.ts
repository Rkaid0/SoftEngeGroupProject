import mysql from "mysql2/promise";
import { getConnection } from "./helpers/getDbConnection";

// Insert shoppingListItem
let AddShoppingListItemToDB = async (
  connection: mysql.Connection,
  shoppingListID: number,
  name: string,
  quantity: number,
  categoryID: number
): Promise<mysql.ResultSetHeader> => {

  const [rows] = await connection.execute<mysql.ResultSetHeader>(
    "INSERT INTO shoppingListItem (name, categoryID, shoppingListID, quantity) VALUES (?, ?, ?, ?)",
    [name, categoryID, shoppingListID, quantity]
  );

  return rows;
};

// Returns categoryID (same as receipts)
let getCategoryID = async (
  connection: mysql.Connection,
  categoryName: string
): Promise<number> => {

  const [existing]: any = await connection.execute(
    "SELECT categoryID FROM Categories WHERE name = ?",
    [categoryName]
  );

  if (existing.length > 0) {
    return existing[0].categoryID;
  }

  const [insertResult]: any = await connection.execute(
    "INSERT INTO Categories (name) VALUES (?)",
    [categoryName]
  );

  return insertResult.insertId;
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
    const name = payload.name;
    const quantity = payload.quantity;
    const categoryName = payload.category;

    if (!shoppingListID || !name || !quantity || !categoryName) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Missing required fields." }),
      };
    }

    const connection = await getConnection();

    const categoryID = await getCategoryID(connection, categoryName);

    const result = await AddShoppingListItemToDB(
      connection,
      shoppingListID,
      name,
      quantity,
      categoryID
    );

    const idShoppingListItem = result.insertId;

    await connection.end();

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        idShoppingListItem,
        shoppingListID,
        name,
        quantity,
        categoryID
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
