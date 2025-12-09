import mysql from "mysql2/promise";
import { getConnection } from "./helpers/getDbConnection";

export const getStores = async (storeChainID: number) => {
  const connection = await getConnection();

  const [rows] = await connection.execute(
    "SELECT idStores, storeAddress FROM Stores WHERE storeChainID = ?",
    [storeChainID]
  );

  await connection.end();
  return rows;
};

export const handler = async function (event: any) {
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*",
  };

  try {
    console.log("EVENT:", JSON.stringify(event));

    const payload = JSON.parse(event.body || "{}");
    const storeChainID = payload.storeChainID;

    // Validate input
    if (!storeChainID) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "Missing required field: storeChainID",
        }),
      };
    }

    const stores = await getStores(storeChainID);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(stores),
    };

  } catch (error: any) {
    console.error("ERROR:", error);

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
