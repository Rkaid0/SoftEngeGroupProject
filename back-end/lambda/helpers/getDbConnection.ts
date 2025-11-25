import mysql from "mysql2/promise";
import { dbConfig } from "./getDbConfig";

export async function getConnection() {
  return await mysql.createConnection({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database
  });
}