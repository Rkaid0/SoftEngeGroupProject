import mysql from "mysql2/promise";
import { getConnection } from "./helpers/getDbConnection";

let RemoveChainDB = async (connection: mysql.Connection, name: string) => {
  const [rows] = await connection.execute(
    "DELETE FROM storeChain WHERE name = ?",
    [name]
  );
  return rows as mysql.ResultSetHeader;
};

export const removeStoreChain = async function(event: any) {
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*"
  };

  try {
    // Parse incoming body
    const payload = JSON.parse(event.body || "{}");
    const name = payload.name;

    // Missing name
    if (!name) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Missing required field: name" }),
      };
    }

    // DB: delete by name
    const connection = await getConnection();
    const result = await RemoveChainDB(connection, name);
    await connection.end();

    // Nothing deleted
    if (result.affectedRows === 0) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({
          error: `Store chain '${name}' not found`,
        }),
      };
    }

    // Success
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        deleted: true,
        name,
      }),
    };

  } catch (err: any) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Server error",
        details: err.message || err,
      }),
    };
  }
};
