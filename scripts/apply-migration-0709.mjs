import pg from "pg";
import fs from "node:fs";
import path from "node:path";

const { Client } = pg;

function getDbUrl() {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL;
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
    console.error("❌ SUPABASE_DB_URL not found in .env.local");
    process.exit(1);
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("Connected to Supabase PostgreSQL.");

    const migrationPath = path.join(
      process.cwd(),
      "supabase",
      "migrations",
      "20261022140000_0709_alienmatrix_ai_layer_upgrade.sql"
    );
    const sql = fs.readFileSync(migrationPath, "utf8");

    console.log("Applying Migration 0709: AI Layer Upgrade...");
    await client.query(sql);
    console.log("✅ Migration 0709 applied successfully!");
  } catch (err) {
    console.error("❌ Failed to apply migration 0709:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
