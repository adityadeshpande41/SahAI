import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env file
config({ path: resolve(process.cwd(), ".env") });

const { Pool } = pg;

async function setupDatabase() {
  console.log("🔧 Setting up SahAI database...\n");

  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error("❌ DATABASE_URL not found in environment variables");
    console.error("Please set DATABASE_URL in your .env file");
    process.exit(1);
  }

  console.log("📡 Connecting to database...");
  
  const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  });

  try {
    // Test connection
    const client = await pool.connect();
    console.log("✅ Database connection successful\n");
    
    const result = await client.query("SELECT version()");
    console.log("📊 PostgreSQL version:", result.rows[0].version.split(" ")[1]);
    
    client.release();
    
    console.log("\n🚀 Ready to push schema!");
    console.log("\nNext steps:");
    console.log("1. Run: npm run db:push");
    console.log("2. This will create all 18 tables in your Supabase database");
    console.log("3. Start the server: npm run dev\n");
    
  } catch (error: any) {
    console.error("\n❌ Database connection failed:");
    console.error(error.message);
    console.error("\nPlease check:");
    console.error("1. DATABASE_URL is correct in .env");
    console.error("2. Your Supabase project is running");
    console.error("3. Password is correct (no special characters issues)");
    console.error("4. Network connection is stable\n");
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();
