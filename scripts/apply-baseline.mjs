import pg from "pg";
import fs from "node:fs";
import path from "node:path";

const { Client } = pg;

// Read .env.local to find SUPABASE_DB_URL
function getDbUrl() {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL;
  if (process.argv[2]) return process.argv[2];

  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const l of lines) {
      const m = /^\s*SUPABASE_DB_URL\s*=\s*(.*)$/.exec(l);
      if (m && m[1]?.trim()) {
        return m[1].trim().replace(/^["']|["']$/g, "");
      }
    }
  }
  return null;
}

async function main() {
  const dbUrl = getDbUrl();
  if (!dbUrl) {
    console.error("❌ SUPABASE_DB_URL not found.");
    console.error("Usage: node scripts/apply-baseline.mjs <postgresql-connection-string>");
    console.error("Or add SUPABASE_DB_URL to your .env.local");
    process.exit(1);
  }

  console.log("Connecting to PostgreSQL database...");
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log(" Connected to database!");

  // Step 1: Enable extensions
  console.log("1. Enabling extensions (vector, citext, pg_trgm)...");
  await client.query(`
    create extension if not exists vector with schema public;
    create extension if not exists citext with schema public;
    create extension if not exists pg_trgm with schema public;
  `);
  console.log(" Extensions ready.");

  // Step 2: Apply baseline.sql
  const baselinePath = path.join(process.cwd(), "supabase", "baseline.sql");
  console.log(`2. Reading ${baselinePath} (~3 MB)...`);
  const sql = fs.readFileSync(baselinePath, "utf8");

  console.log("3. Applying baseline schema (this may take 30-60 seconds)...");
  await client.query(sql);
  console.log(" Baseline schema applied successfully!");

  // Step 3: Apply test seed data
  const seedPath = path.join(process.cwd(), "supabase", "seed_test_data.sql");
  if (fs.existsSync(seedPath)) {
    console.log("4. Applying seed test data...");
    const seedSql = fs.readFileSync(seedPath, "utf8");
    await client.query(seedSql);
    console.log(" Test seed data applied successfully!");
  }

  await client.end();
  console.log("\n All database tables and test data have been created successfully!");
}

main().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
