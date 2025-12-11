import mysql from "mysql2/promise";
import { getConnection } from "./helpers/getDbConnection";

// ------------------------------
// GET SHOPPING LISTS (DB QUERY)
// ------------------------------
export const getShoppingLists = async (userID: number) => {
  const connection = await getConnection();

  const [rows]: any = await connection.execute(
    `
    SELECT
      sl.idshoppingList AS shoppingListID,
      sl.name AS shoppingListName,
      
      sli.idShoppingListItem AS itemID,
      sli.name AS itemName,
      sli.quantity AS quantity,

      c.categoryID AS categoryID,
      c.name AS categoryName

    FROM shoppingList sl
    LEFT JOIN shoppingListItem sli ON sli.shoppingListID = sl.idshoppingList
    LEFT JOIN Categories c ON c.categoryID = sli.categoryID

    WHERE sl.userID = ?
    ORDER BY sl.idshoppingList DESC
    `,
    [userID]
  );

  await connection.end();

  // Group items under each shopping list
  const grouped: any = {};

  for (const row of rows) {
    if (!grouped[row.shoppingListID]) {
      grouped[row.shoppingListID] = {
        shoppingListID: row.shoppingListID,
        name: row.shoppingListName,
        items: [],
      };
    }

    // Only push item if it exists (not null due to LEFT JOIN)
    if (row.itemID) {
      grouped[row.shoppingListID].items.push({
        itemID: row.itemID,
        name: row.itemName,
        quantity: row.quantity,
        categoryID: row.categoryID,
        categoryName: row.categoryName,
      });
    }
  }

  return Object.values(grouped);
};

// ------------------------------
// LAMBDA HANDLER (Request Handler)
// ------------------------------
export const handler = async (event: any) => {
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*",
  };

  try {
    console.log("EVENT:", JSON.stringify(event)); // Logs the incoming event for debugging

    // Parse the incoming request body
    const payload = JSON.parse(event.body || "{}");
    const userID = payload.userID;

    // Validate the presence of userID in the request body
    if (!userID) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "Missing required field: userID",
        }),
      };
    }

    // Query the database to get shopping lists for the user
    const lists = await getShoppingLists(userID);

    // Return the lists in the response
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(lists),
    };
  } catch (error: any) {
    console.error("ERROR:", error);

    // Return a 500 error if something went wrong
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
