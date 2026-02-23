import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!db) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      console.warn("DATABASE_URL not set, using in-memory storage");
      return null;
    }

    const pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    });

    db = drizzle(pool, { schema });
  }

  return db;
}

export { schema };
