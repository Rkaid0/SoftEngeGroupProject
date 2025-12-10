import mysql from "mysql2/promise";
import { getConnection } from "./helpers/getDbConnection"; // filename is getDbConnection.ts

let AddReceiptDB = async (connection: mysql.Connection, storeID: Number, date: Date, userID: Number): Promise<mysql.ResultSetHeader> => {
  const [rows] = await connection.execute<mysql.ResultSetHeader>(
    "INSERT INTO Receipts (storeID, date, userID, total) VALUES (?, ?, ?, ?)",
    [storeID, date, userID, 0.00]
  );
  return rows;
};

export const createReceipt = async function(event: any) {
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*"
  }

  try {
    console.log(JSON.stringify(event));
    const payload = JSON.parse(event.body || "{}");
    const storeID = payload.storeID;
    const date = payload.date;
    const userID = payload.userID;
    if (!storeID || !date || !userID) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    // connect to db
    const connection = await getConnection();

    const result: mysql.ResultSetHeader = await AddReceiptDB(connection, storeID, date, userID);

    await connection.end();

    const receiptID = result.insertId;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        receiptID,
        storeID,
        date,
        items: [],
        total: 0.00
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
