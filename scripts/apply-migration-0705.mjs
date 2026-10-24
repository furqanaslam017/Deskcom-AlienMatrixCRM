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

  await client.connect();
  console.log("Connected to PostgreSQL for Migration 0705...");

  const migrationPath = path.join(process.cwd(), "supabase/migrations/20261022090000_0705_alienmatrix_core_crm_modules.sql");
  const sql = fs.readFileSync(migrationPath, "utf8");

  await client.query(sql);
  console.log("✅ Migration 0705 applied successfully!");

  // Verify created tables
  const { rows } = await client.query(`
    select table_name 
    from information_schema.tables 
    where table_schema = 'public' and table_name like 'crm_%'
    order by table_name;
  `);
  console.log("Current CRM tables:", rows.map(r => r.table_name));

  await client.end();
}

main().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
