import mysql from "mysql2/promise";
import { getConnection } from "./helpers/getDbConnection";

export const getProfitByChain = async function(event: any) {
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*"
  };

  try {
    const connection = await getConnection();

    // SQL joins Receipts -> Stores -> StoreChain and groups by chain
    const [rows] = await connection.execute(
      `
      SELECT sc.idstoreChain AS chainID,
             sc.name AS chainName,
             SUM(r.total) AS total
      FROM Receipts r
      JOIN Stores s ON r.storeID = s.idStores
      JOIN storeChain sc ON s.storeChainID = sc.idstoreChain
      GROUP BY sc.idstoreChain, sc.name;
      `
    );

    await connection.end();

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(rows),
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
