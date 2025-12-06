import mysql from "mysql2/promise";
import { getConnection } from "./helpers/getDbConnection";

export const getStoreChains = async () => {
  const connection = await getConnection();

  const [rows] = await connection.execute(`
    SELECT 
      sc.idstoreChain,
      sc.name AS chainName,
      sc.url AS chainURL,
      s.idStores,
      s.storeAddress
    FROM storeChain sc
    LEFT JOIN Stores s ON sc.idstoreChain = s.storeChainID
    ORDER BY sc.idstoreChain, s.idStores;
  `);

  await connection.end();

  // Convert flat rows → nested structure
  const chains: any[] = [];
  const map = new Map();

  for (const row of rows as any[]) {
    if (!map.has(row.idstoreChain)) {
      map.set(row.idstoreChain, {
        idstoreChain: row.idstoreChain,
        name: row.chainName,
        url: row.chainURL,
        stores: []
      });
      chains.push(map.get(row.idstoreChain));
    }

    if (row.idStores) {
      map.get(row.idstoreChain).stores.push({
        idStores: row.idStores,
        storeAddress: row.storeAddress
      });
    }
  }

  return chains;
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
