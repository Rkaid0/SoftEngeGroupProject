import mysql from "mysql2/promise";
import { getConnection } from "./helpers/getDbConnection";

// Insert store into DB
let AddStoreDB = async (
  connection: mysql.Connection,
  storeAddress: string,
  storeChainID: number
): Promise<mysql.ResultSetHeader> => {

  const [rows] = await connection.execute<mysql.ResultSetHeader>(
    "INSERT INTO Stores (storeAddress, storeChainID) VALUES (?, ?)",
    [storeAddress, storeChainID]
  );

  return rows;
};

export const createStore = async function (event: any) {
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*"
  };

  try {
    console.log(JSON.stringify(event));

    const payload = JSON.parse(event.body || "{}");

    const storeAddress = payload.storeAddress;
    const storeChainID = payload.storeChainID;

    if (!storeAddress || !storeChainID) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    // connect to DB
    const connection = await getConnection();

    const result = await AddStoreDB(
      connection,
      storeAddress,
      storeChainID
    );

    await connection.end();

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        storeID: result.insertId,
        storeAddress,
        storeChainID
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
