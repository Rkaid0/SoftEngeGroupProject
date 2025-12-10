import mysql from "mysql2/promise";
import { getConnection } from "./helpers/getDbConnection";

export const getReceipts = async (
  userID: number,
  startDate: string,
  endDate: string
) => {
  const connection = await getConnection();

  const [rows] = await connection.execute(
    `SELECT
        r.receiptID AS receiptID,
        r.storeID,
        r.date,
        r.total,

        s.storeAddress,

        sc.idstoreChain AS storeChainID,
        sc.name AS storeChainName,

        i.idItem AS itemID,
        i.name AS itemName,
        i.price,
        i.categoryID,
        i.quantity AS itemQuantity,

        c.name AS categoryName

    FROM Receipts r
    LEFT JOIN Stores s
        ON r.storeID = s.idStores
    LEFT JOIN storeChain sc
        ON s.storeChainID = sc.idstoreChain
    LEFT JOIN Item i 
        ON i.receiptID = r.receiptID
    LEFT JOIN Categories c 
        ON c.categoryID = i.categoryID

    WHERE r.userID = ?
      AND r.date BETWEEN ? AND ?

    ORDER BY r.date DESC, i.idItem`,
    [userID, startDate, endDate]
  );

  await connection.end();

  // ---- GROUP INTO RECEIPTS ----
  const receiptMap = new Map<number, any>();
  const result: any[] = [];

  for (const row of rows as any[]) {
    if (!receiptMap.has(row.receiptID)) {
      const receipt = {
        receiptID: row.receiptID,
        storeID: row.storeID,
        storeAddress: row.storeAddress,
        date: row.date,
        total: row.total,
        storeChainName: row.storeChainName,
        storeChainID: row.storeChainID,
        items: [],
      };

      receiptMap.set(row.receiptID, receipt);
      result.push(receipt);
    }

    if (row.itemID) {
      receiptMap.get(row.receiptID).items.push({
        itemID: row.itemID,
        name: row.itemName,
        price: row.price,
        quantity: row.itemQuantity,
        categoryID: row.categoryID,
        categoryName: row.categoryName,
      });
    }
  }

  return result;
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

    const userID = payload.userID;
    const startDate = payload.startDate;
    const endDate = payload.endDate;

    if (!userID || !startDate || !endDate) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "Missing required fields: userID, startDate, endDate",
        }),
      };
    }

    const receipts = await getReceipts(userID, startDate, endDate);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(receipts),
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
