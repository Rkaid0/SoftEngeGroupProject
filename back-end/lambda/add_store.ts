import mysql from "mysql2/promise";
import { getConnection } from "./helpers/getDBConnection"; //getDbConnection.ts

let AddStoreDB = async (connection: mysql.Connection, address : String, name: string, storeChainID : Number): Promise<mysql.ResultSetHeader> => {
  const [rows] = await connection.execute<mysql.ResultSetHeader>(
    "INSERT INTO Stores (storeAddress, storeName, storeChainID) VALUES (?, ?, ?)",
    [address, name, storeChainID]
  );

  return rows;
};

export const addStore = async function(event: any) {
  try {
    const body = JSON.parse(event.body || "{}");

    const storeChainID = body.storeChainID;
    const storeAddress = body.address;
    const storeName = body.name;

    if (!storeAddress || !storeName || !storeChainID) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Malformed request" }),
      };
    }

    // connect to db
    const connection = await getConnection();

    const store: mysql.ResultSetHeader = await AddStoreDB(connection, storeAddress, storeName, storeChainID);
    const [storesInChain] = await connection.execute("SELECT * FROM Stores WHERE storeChainID = ?", [storeChainID])
    const [chainRows]: any = await connection.execute("SELECT * FROM storeChain WHERE idstoreChain = ? LIMIT 1", [storeChainID]);
    const storeChainName = chainRows[0].name;

    await connection.end();

    // return the store CHAIN
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeChainID,
        storeChainName,
        stores: storesInChain,
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
