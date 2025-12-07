import mysql from "mysql2/promise";
import { getConnection } from "./helpers/getDbConnection";

// Insert item row
let AddItemToDB = async (
  connection: mysql.Connection,
  receiptID: number,
  name: string,
  price: number,
  categoryID: number
): Promise<mysql.ResultSetHeader> => {

  const [rows] = await connection.execute<mysql.ResultSetHeader>(
    "INSERT INTO Item (name, categoryID, price, receiptID) VALUES (?, ?, ?, ?)",
    [name, categoryID, price, receiptID]
  );

  return rows;
};

// Returns a number (categoryID)
let getCategoryID = async (
  connection: mysql.Connection,
  categoryName: string
): Promise<number> => {

  // 1. Check if category exists
  const [existing]: any = await connection.execute(
    "SELECT categoryID FROM Categories WHERE name = ?",
    [categoryName]
  );

  if (existing.length > 0) {
    console.log("Category exists:", existing[0].categoryID);
    return existing[0].categoryID;
  }

  // 2. Insert new category
  const [insertResult]: any = await connection.execute(
    "INSERT INTO Categories (name) VALUES (?)",
    [categoryName]
  );

  const newID = insertResult.insertId;
  console.log("Created new category:", newID);

  return newID;
};

export const handler = async function (event: any) {
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*",
  };

  try {
    console.log("EVENT:", event);

    const payload = JSON.parse(event.body || "{}");

    const receiptID: number = payload.receiptID;
    const name: string = payload.name;
    const price: number = payload.price;
    const categoryName: string = payload.category;

    // Validate input
    if (!receiptID || !name || price == null || !categoryName) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    const connection = await getConnection();

    const categoryID = await getCategoryID(connection, categoryName);

    const result = await AddItemToDB(connection, receiptID, name, price, categoryID);

    const idItem = result.insertId

    await connection.end();

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        idItem,
        receiptID,
        name,
        price,
        categoryID,
      }),
    };

  } catch (error: any) {
    console.error("ERROR:", error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Server error",
        details: error.message || String(error),
      }),
    };
  }
};
