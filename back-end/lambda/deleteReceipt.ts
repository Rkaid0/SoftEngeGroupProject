import mysql from "mysql2/promise";
import { getConnection } from "./helpers/getDbConnection"; // filename is getDbConnection.ts

let deleteReceiptDB = async (connection: mysql.Connection, receiptID: Number, userID: Number): Promise<mysql.ResultSetHeader> => {
  const [rows] = await connection.execute<mysql.ResultSetHeader>(
    "DELETE FROM Receipts WHERE receiptID = ? and userID = ?",
    [receiptID, userID]
  );
  return rows;
};

export const handler = async function(event: any) {
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*"
  }

  try {
    console.log(JSON.stringify(event));
    const payload = JSON.parse(event.body || "{}");
    const receiptID = payload.receiptID;
    const userID = payload.userID;
    if (!receiptID || !userID) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    // connect to db
    const connection = await getConnection();

    await deleteReceiptDB(connection, receiptID, userID);

    await connection.end();

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify("Success"),
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
