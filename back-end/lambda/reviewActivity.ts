/** 
 * Disclaimer: This Lambda function was written with the help of ChatGPT 5.2,
 * using previous user-written functions as templates
*/

import mysql from "mysql2/promise";
import { getConnection } from "./helpers/getDbConnection";

type PeriodType = "day" | "week" | "month";

//Fetch aggregated spending grouped by period + storeChain
const getAggregatedSpend = async (userID: number, period: PeriodType) => {
  const connection = await getConnection();

  let labelExpr = "";

  switch (period) {
    case "day":
      labelExpr = "DATE(r.date)";
      break;

    case "week":
      labelExpr = `
        CONCAT(
          'Week of ',
          DATE(
            SUBDATE(
              r.date,
              WEEKDAY(r.date) + 1
            )
          )
        )
      `;
      break;

    case "month":
      labelExpr = `
        CONCAT(
          MONTHNAME(r.date),
          ' ',
          YEAR(r.date)
        )
      `;
      break;
  }

  const [rows] = await connection.execute(
    `
    SELECT
      ${labelExpr} AS period,
      sc.name AS storeChainName,
      SUM(r.total) AS total
    FROM Receipts r
    LEFT JOIN Stores s
      ON r.storeID = s.idStores
    LEFT JOIN storeChain sc
      ON s.storeChainID = sc.idstoreChain
    WHERE r.userID = ?
    GROUP BY period, sc.name
    ORDER BY MIN(r.date) DESC
    `,
    [userID]
  );

  await connection.end();
  return rows as any[];
};


//Convert flat rows into grouped structure
const groupByPeriod = (rows: any[]) => {
  const map = new Map<string, any>();

  for (const row of rows) {
    if (!map.has(row.period)) {
      map.set(row.period, {
        period: row.period,
        total: 0,
        byStoreChain: {},
      });
    }

    const entry = map.get(row.period);
    const amount = Number(row.total);

    entry.total += amount;

    if (row.storeChainName) {
      entry.byStoreChain[row.storeChainName] =
        (entry.byStoreChain[row.storeChainName] || 0) + amount;
    }
  }

  return Array.from(map.values());
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

    if (!userID) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Missing required field: userID" }),
      };
    }

    const [dayRows, weekRows, monthRows] = await Promise.all([
      getAggregatedSpend(userID, "day"),
      getAggregatedSpend(userID, "week"),
      getAggregatedSpend(userID, "month"),
    ]);

    const response = {
      byDay: groupByPeriod(dayRows),
      byWeek: groupByPeriod(weekRows),
      byMonth: groupByPeriod(monthRows),
    };

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(response),
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
