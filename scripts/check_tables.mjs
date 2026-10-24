import pg from 'pg';
import fs from 'node:fs';

const { Client } = pg;
const envContent = fs.readFileSync('.env.local', 'utf8');
const match = envContent.match(/SUPABASE_DB_URL\s*=\s*(.*)/);
const dbUrl = match[1].trim().replace(/^['"]|['"]$/g, '');

const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
await client.connect();

for (const table of ['crm_tenant_settings', 'crm_inbound_webhooks', 'crm_tenant_guardrails']) {
  const res = await client.query('SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2;', ['public', table]);
  console.log(table, 'columns:', res.rows.map(r => r.column_name));
}

await client.end();
