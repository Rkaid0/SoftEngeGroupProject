import mysql from "mysql2/promise";
import { getConnection } from "./helpers/getDbConnection";

// ------------------------------
// GET SHOPPING LISTS (DB QUERY)
// ------------------------------
export const getShoppingLists = async (userID: number) => {
  const connection = await getConnection();

  const [rows] = await connection.execute(
    `
    SELECT
      sl.idshoppingList AS idshoppingList,
      sl.name AS name
    FROM shoppingList sl
    WHERE sl.userID = ?
    ORDER BY sl.idshoppingList DESC
    `,
    [userID]
  );

  await connection.end();

  return rows;
};

// ------------------------------
// LAMBDA HANDLER
// ------------------------------
export const handler = async function (event: any) {
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*",
  };

  try {
    console.log("EVENT:", JSON.stringify(event));

    // Parse JSON body like your getReceipts Lambda
    const payload = JSON.parse(event.body || "{}");
    const userID = payload.userID;

    // Validate
    if (!userID) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "Missing required field: userID",
        }),
      };
    }

    // Query DB
    const lists = await getShoppingLists(userID);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(lists),
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
