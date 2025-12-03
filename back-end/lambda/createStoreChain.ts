import mysql from "mysql2/promise";
import { getConnection } from "./helpers/getDbConnection"; // filename is getDbConnection.ts

let AddChainDB = async (connection: mysql.Connection, name: string, url: string,): Promise<mysql.ResultSetHeader> => {
  const [rows] = await connection.execute<mysql.ResultSetHeader>(
    "INSERT INTO storeChain (name, url) VALUES (?, ?)",
    [name, url]
  );

  return rows;
};

export const createStoreChain = async function(event: any) {
  try {
    const body = JSON.parse(event.body || "{}");

    const name = body.name;
    const url = body.url

    if (!name || !url) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    // connect to db
    const connection = await getConnection();

    const result: mysql.ResultSetHeader = await AddChainDB(connection, name, url);

    await connection.end();

    const storeChainID = result.insertId;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeChainID,
        name,
        url,
        stores: [],
      }),
    };

  } catch (error: any) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Server error",
        details: error.message || error,
      }),
    };
  }
};
