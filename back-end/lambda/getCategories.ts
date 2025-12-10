import mysql from "mysql2/promise";
import { getConnection } from "./helpers/getDbConnection";

export const getCategories = async () => {
  const connection = await getConnection();

  const [rows] = await connection.execute(`
    SELECT categoryID, name from Categories
  `);

  await connection.end();

  return rows;
};

export const handler = async () => {
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*"
  };

  try {
    const categories = await getCategories();

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(categories),
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