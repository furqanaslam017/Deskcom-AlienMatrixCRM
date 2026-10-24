import pg from "pg";
import fs from "node:fs";

const env = fs.readFileSync(".env.local", "utf8");
const dbUrl = env.match(/SUPABASE_DB_URL=(.*)/)?.[1]?.trim().replace(/^['"]|['"]$/g, "");
const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function seed() {
  await client.connect();
  console.log("Connected to PostgreSQL for Phase 3 Seeding...");

  const orgId = "27728f33-73f5-4ebf-a23d-a2a0fbc855d2"; // CRM_AlienMatrix

  // 1. Seed Custom Roles
  console.log("Seeding Custom Roles...");
  const roles = [
    {
      name: "Sales Executive",
      slug: "sales_executive",
      description: "Full access to create and manage deals, proposals, and customer communications.",
      permissions: {
        objects: {
          deals: ["read", "create", "update"],
          contacts: ["read", "create", "update"],
          invoices: ["read", "create", "update"],
          products: ["read"],
        },
        fields: {
          "deals.lost_reason": "editable",
        },
        allRecordsVisibility: true,
      },
    },
    {
      name: "Support Specialist",
      slug: "support_specialist",
      description: "Customer service and query resolution with read-only access to commercial values.",
      permissions: {
        objects: {
          contacts: ["read", "update"],
          deals: ["read"],
          products: ["read"],
        },
        fields: {
          "deals.value_cents": "readonly",
        },
        allRecordsVisibility: false,
      },
    },
    {
      name: "Listing Manager (Real Estate)",
      slug: "listing_manager",
      description: "Specialized role managing properties, developments, and customer site viewings.",
      permissions: {
        objects: {
          properties: ["read", "create", "update", "delete"],
          viewings: ["read", "create", "update"],
          contacts: ["read", "create"],
        },
        allRecordsVisibility: true,
      },
    },
  ];

  for (const r of roles) {
    await client.query(`
      insert into public.crm_custom_roles (organization_id, name, slug, description, permissions)
      values ($1, $2, $3, $4, $5)
      on conflict (organization_id, slug) do update set
        name = excluded.name,
        permissions = excluded.permissions;
    `, [orgId, r.name, r.slug, r.description, JSON.stringify(r.permissions)]);
  }
  console.log("✅ Seeded Custom Roles.");

  // 2. Seed Security Settings
  console.log("Seeding Security Settings...");
  await client.query(`
    insert into public.crm_security_settings (
      organization_id, enforce_2fa, sso_provider, sso_domain, session_timeout_minutes
    ) values ($1, false, 'google', 'whitehouseforexacademy.com', 1440)
    on conflict (organization_id) do update set
      sso_provider = excluded.sso_provider,
      sso_domain = excluded.sso_domain;
  `, [orgId]);
  console.log("✅ Seeded Security & SSO Settings.");

  // 3. Seed Tenant Settings (Branding & Localization)
  console.log("Seeding Tenant Settings & Localization...");
  await client.query(`
    insert into public.crm_tenant_settings (
      organization_id, brand_name, primary_color_hex, accent_color_hex, timezone, currency, language
    ) values ($1, 'AlienMatrix CRM', '#2563eb', '#3b82f6', 'America/New_York', 'USD', 'en')
    on conflict (organization_id) do update set
      brand_name = excluded.brand_name,
      language = excluded.language,
      currency = excluded.currency;
  `, [orgId]);
  console.log("✅ Seeded Tenant Branding & Localization.");

  // 4. Seed Soft-deleted Record in Trash
  console.log("Seeding Trash / Soft Deletes...");
  const { rows: existingTrash } = await client.query(`
    select id from public.crm_soft_deletes where organization_id = $1 limit 1;
  `, [orgId]);

  if (existingTrash.length === 0) {
    await client.query(`
      insert into public.crm_soft_deletes (
        organization_id, entity_type, entity_id, entity_name, entity_data
      ) values (
        $1, 'product', gen_random_uuid(), 'Legacy Consulting Package (Deprecated)',
        '{"name": "Legacy Consulting Package", "unit_price_cents": 250000, "currency": "USD"}'::jsonb
      );
    `, [orgId]);
  }
  console.log("✅ Seeded Trash Data.");

  await client.end();
  console.log("🎉 Phase 3 Seeding Completed Successfully!");
}

seed().catch(err => {
  console.error("Seeding error:", err);
  process.exit(1);
});
