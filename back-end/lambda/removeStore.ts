import mysql from "mysql2/promise";
import { getConnection } from "./helpers/getDbConnection";

export const removeStore = async (event: any) => {
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*",
  };

  try {
    const payload = JSON.parse(event.body || "{}");
    const storeAddress = payload.storeAddress;
    const chainName = payload.chainName;

    if (!storeAddress || !chainName) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    const connection = await getConnection();

    // --- Get the storeChainID from name ---
    const [chainRows]: any = await connection.execute(
      "SELECT idstoreChain FROM storeChain WHERE name = ?",
      [chainName]
    );

    if (chainRows.length === 0) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Store chain not found" }),
      };
    }

    const chainID = chainRows[0].idstoreChain;

    // --- Delete store by address & chain ID ---
    const [deleteResult]: any = await connection.execute(
      "DELETE FROM Stores WHERE storeAddress = ? AND storeChainID = ?",
      [storeAddress, chainID]
    );

    await connection.end();

    if (deleteResult.affectedRows === 0) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Store not found" }),
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Store deleted successfully",
        storeAddress,
        chainName
      }),
    };

  } catch (error: any) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Server error",
        details: error.message,
      }),
    };
  }
};
