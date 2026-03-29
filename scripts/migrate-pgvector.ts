/**
 * Migration: jsonb → pgvector for vector_memory table
 *
 * Run once against your Render Postgres instance:
 *   npx tsx scripts/migrate-pgvector.ts
 *
 * What this does:
 *   1. Enables the pgvector extension
 *   2. Adds a new vector(1536) column
 *   3. Migrates existing jsonb embeddings into it
 *   4. Drops the old jsonb column
 *   5. Creates an HNSW index for fast ANN search
 */

import pg from "pg";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env") });

const { Pool } = pg;

async function migrate() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ DATABASE_URL not set");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();

  try {
    console.log("🔌 Connected to Postgres");

    // ── Step 1: Enable pgvector ───────────────────────────────────────────
    console.log("\n1️⃣  Enabling pgvector extension...");
    await client.query(`CREATE EXTENSION IF NOT EXISTS vector;`);
    console.log("   ✅ pgvector enabled");

    // ── Step 2: Check current column type ────────────────────────────────
    const colCheck = await client.query(`
      SELECT data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'vector_memory' AND column_name = 'embedding';
    `);

    if (colCheck.rows.length === 0) {
      console.log("\n⚠️  vector_memory table doesn't exist yet — run db:push first");
      process.exit(1);
    }

    const currentType = colCheck.rows[0].udt_name;
    console.log(`\n   Current embedding column type: ${currentType}`);

    if (currentType === "vector") {
      console.log("   ✅ Already using pgvector — nothing to migrate");
    } else {
      // ── Step 3: Add new vector column alongside old jsonb ───────────────
      console.log("\n2️⃣  Adding vector(1536) column...");
      await client.query(`
        ALTER TABLE vector_memory
        ADD COLUMN IF NOT EXISTS embedding_vec vector(1536);
      `);
      console.log("   ✅ Column added");

      // ── Step 4: Migrate existing jsonb embeddings ───────────────────────
      console.log("\n3️⃣  Migrating existing embeddings...");
      const { rowCount } = await client.query(`
        UPDATE vector_memory
        SET embedding_vec = embedding::text::vector
        WHERE embedding IS NOT NULL AND embedding_vec IS NULL;
      `);
      console.log(`   ✅ Migrated ${rowCount} rows`);

      // ── Step 5: Drop old jsonb column, rename new one ───────────────────
      console.log("\n4️⃣  Swapping columns...");
      await client.query(`ALTER TABLE vector_memory DROP COLUMN IF EXISTS embedding;`);
      await client.query(`ALTER TABLE vector_memory RENAME COLUMN embedding_vec TO embedding;`);
      console.log("   ✅ Column swapped");
    }

    // ── Step 6: Create HNSW index ─────────────────────────────────────────
    // HNSW = Hierarchical Navigable Small World — best for recall + speed tradeoff
    // m=16, ef_construction=64 are good defaults for 1536-dim embeddings
    console.log("\n5️⃣  Creating HNSW index for cosine similarity search...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS vector_memory_embedding_hnsw
      ON vector_memory
      USING hnsw (embedding vector_cosine_ops)
      WITH (m = 16, ef_construction = 64);
    `);
    console.log("   ✅ HNSW index created");

    // ── Step 7: Verify ────────────────────────────────────────────────────
    const verify = await client.query(`
      SELECT
        COUNT(*) as total_memories,
        COUNT(embedding) as with_embeddings
      FROM vector_memory;
    `);
    console.log(`\n📊 vector_memory: ${verify.rows[0].total_memories} total, ${verify.rows[0].with_embeddings} with embeddings`);

    console.log("\n✅ Migration complete! RAG now uses native pgvector ANN search.");
    console.log("   Query pattern: ORDER BY embedding <=> $queryVector LIMIT 5");

  } catch (err: any) {
    console.error("\n❌ Migration failed:", err.message);
    console.error(err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
