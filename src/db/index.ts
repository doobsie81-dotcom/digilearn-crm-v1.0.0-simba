import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

// Validate environment variables
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

// Parse DATABASE_URL to handle special characters in password
let poolConfig;

if (process.env.DATABASE_URL.startsWith('mysql://')) {
  // Parse the URL manually to avoid issues with special characters
  const url = new URL(process.env.DATABASE_URL);
  
  poolConfig = {
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1), // Remove leading slash
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    maxIdle: 10, // Maximum idle connections
    idleTimeout: 60000, // 60 seconds
    connectTimeout: 10000, // 10 seconds
  };
  
} else {
  // Fallback to uri format
  poolConfig = {
    uri: process.env.DATABASE_URL,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    maxIdle: 10, // Maximum idle connections
    idleTimeout: 60000, // 60 seconds
    connectTimeout: 10000, // 10 seconds
  };
}

const poolConnection = mysql.createPool(poolConfig);

// Initialize Drizzle with schema for type safety and relations
// Pass pool connection directly - works with both standard and relational queries
export const db = drizzle(poolConnection, { schema, mode: "default" });
