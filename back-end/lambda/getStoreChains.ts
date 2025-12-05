import mysql from "mysql2/promise";
import { getConnection } from "./helpers/getDbConnection";

export const getStoreChains = async () => {
  const connection = await getConnection();

  const [rows] = await connection.execute(
    "SELECT idstorechain, name, url FROM storeChain"
  );

  await connection.end();
  return rows;
};

export const handler = async () => {
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*"
  };

  try {
    const chains = await getStoreChains();

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(chains),
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
