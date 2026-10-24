import pg from "pg";
import fs from "node:fs";

const env = fs.readFileSync(".env.local", "utf8");
const dbUrl = env.match(/SUPABASE_DB_URL=(.*)/)?.[1]?.trim().replace(/^['"]|['"]$/g, "");
const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function seed() {
  await client.connect();
  console.log("Connected to PostgreSQL for Phase 2 Seeding...");

  const orgId = "27728f33-73f5-4ebf-a23d-a2a0fbc855d2"; // CRM_AlienMatrix

  // 1. Seed Products
  console.log("Seeding Products...");
  const products = [
    {
      sku: "CRM-ENT-01",
      name: "Enterprise CRM License (Annual)",
      category: "Software",
      unit_price_cents: 480000,
      currency: "USD",
      stock_quantity: 100,
      description: "Full multi-tenant CRM license with unlimited contacts, custom objects and Kanban pipelines.",
    },
    {
      sku: "AI-WA-SETUP",
      name: "AI WhatsApp Agent Setup & Tuning",
      category: "Services",
      unit_price_cents: 150000,
      currency: "USD",
      stock_quantity: 50,
      description: "Custom knowledge base RAG ingestion, prompt engineering and guardrails setup.",
    },
    {
      sku: "SLA-PREMIUM",
      name: "Dedicated Account Manager & 24/7 SLA",
      category: "Services",
      unit_price_cents: 60000,
      currency: "USD",
      stock_quantity: 20,
      description: "Priority response times and quarterly strategy reviews.",
    },
    {
      sku: "PLUG-RE-01",
      name: "Real Estate Portal Sync Plugin",
      category: "Add-ons",
      unit_price_cents: 95000,
      currency: "USD",
      stock_quantity: 500,
      description: "Automatic two-way sync between CRM properties and real estate portals.",
    },
  ];

  const createdProductIds = [];
  for (const p of products) {
    const { rows } = await client.query(`
      insert into public.crm_products (
        organization_id, sku, name, category, unit_price_cents, currency, stock_quantity, description
      ) values ($1, $2, $3, $4, $5, $6, $7, $8)
      on conflict (organization_id, sku) do update set
        name = excluded.name,
        unit_price_cents = excluded.unit_price_cents
      returning id;
    `, [orgId, p.sku, p.name, p.category, p.unit_price_cents, p.currency, p.stock_quantity, p.description]);
    createdProductIds.push(rows[0].id);
  }
  console.log(`✅ Seeded ${createdProductIds.length} products.`);

  // 2. Ensure Contact exists
  let contactId;
  const { rows: contactRows } = await client.query(`
    select id from public.contacts where organization_id = $1 limit 1;
  `, [orgId]);

  if (contactRows.length > 0) {
    contactId = contactRows[0].id;
  } else {
    const { rows: newContact } = await client.query(`
      insert into public.contacts (organization_id, name, email, phone_number)
      values ($1, 'Roberto Andrade', 'roberto@alianca.com.br', '+5511988887777')
      returning id;
    `, [orgId]);
    contactId = newContact[0].id;
  }

  // 3. Seed Deals in crm_leads
  console.log("Seeding Deals...");
  const { rows: defaultPipe } = await client.query(`
    select id from public.crm_pipelines where organization_id = $1 and is_default = true limit 1;
  `, [orgId]);
  const pipelineId = defaultPipe[0]?.id;

  const { rows: stages } = await client.query(`
    select id, name from public.crm_stages where organization_id = $1 order by position asc;
  `, [orgId]);

  const stage1 = stages[0]?.id;
  const stage2 = stages[1]?.id || stage1;

  let dealId;
  const { rows: existingDeal } = await client.query(`
    select id from public.crm_leads where organization_id = $1 and title = 'Expansão Operação Imobiliária — Grupo Aliança' limit 1;
  `, [orgId]);

  if (existingDeal.length > 0) {
    dealId = existingDeal[0].id;
  } else {
    const { rows: newDeal } = await client.query(`
      insert into public.crm_leads (
        organization_id, contact_id, pipeline_id, stage_id, title, status, value_cents, currency, description
      ) values ($1, $2, $3, $4, 'Expansão Operação Imobiliária — Grupo Aliança', 'open', 725000, 'USD', 'Implantação completa de CRM e IA WhatsApp para 15 corretores.')
      returning id;
    `, [orgId, contactId, pipelineId, stage2]);
    dealId = newDeal[0].id;
  }
  console.log(`✅ Seeded Deal: ${dealId}`);

  // 4. Seed Deal Products
  await client.query(`delete from public.crm_deal_products where organization_id = $1 and lead_id = $2`, [orgId, dealId]);
  await client.query(`
    insert into public.crm_deal_products (
      organization_id, lead_id, product_id, product_name, quantity, unit_price_cents, currency, total_cents
    ) values 
      ($1, $2, $3, 'Enterprise CRM License (Annual)', 1, 480000, 'USD', 480000),
      ($1, $2, $4, 'AI WhatsApp Agent Setup & Tuning', 1, 150000, 'USD', 150000),
      ($1, $2, $5, 'Real Estate Portal Sync Plugin', 1, 95000, 'USD', 95000);
  `, [orgId, dealId, createdProductIds[0], createdProductIds[1], createdProductIds[3]]);

  // 5. Seed Invoices & Quotes
  console.log("Seeding Invoices...");
  const invoices = [
    {
      number: "QTE-2026-1042",
      kind: "quote",
      status: "sent",
      title: "Proposta de Implantação AlienMatrix — Grupo Aliança",
      subtotal: 725000,
      total: 725000,
      notes: "Validade da proposta: 15 dias corridos.",
      payment_instructions: "PIX ou Transferência Bancária PJ. 50% na contratação, 50% na homologação.",
    },
    {
      number: "INV-2026-8910",
      kind: "invoice",
      status: "paid",
      title: "Licenciamento Anual + Setup — Imobiliária Prime",
      subtotal: 540000,
      total: 540000,
      notes: "Fatura liquidada via cartão de crédito.",
      payment_instructions: "Comprovante de pagamento registrado no gateway.",
    },
  ];

  for (const inv of invoices) {
    const { rows: invRows } = await client.query(`
      insert into public.crm_invoices (
        organization_id, invoice_number, kind, status, title, subtotal_cents, total_cents, currency, contact_id, lead_id, notes, payment_instructions
      ) values ($1, $2, $3, $4, $5, $6, $7, 'USD', $8, $9, $10, $11)
      on conflict (organization_id, invoice_number) do update set
        status = excluded.status,
        total_cents = excluded.total_cents
      returning id;
    `, [orgId, inv.number, inv.kind, inv.status, inv.title, inv.subtotal, inv.total, contactId, dealId, inv.notes, inv.payment_instructions]);

    const invoiceId = invRows[0].id;
    await client.query(`delete from public.crm_invoice_items where invoice_id = $1`, [invoiceId]);
    await client.query(`
      insert into public.crm_invoice_items (
        organization_id, invoice_id, product_id, description, quantity, unit_price_cents, total_cents, position
      ) values 
        ($1, $2, $3, 'Enterprise CRM License (Annual)', 1, 480000, 480000, 0),
        ($1, $2, $4, 'AI WhatsApp Agent Setup & Tuning', 1, 150000, 150000, 1);
    `, [orgId, invoiceId, createdProductIds[0], createdProductIds[1]]);
  }
  console.log("✅ Seeded Invoices & Quotes.");

  // 6. Seed Call & Meeting Logs
  console.log("Seeding Call Logs...");
  const calls = [
    {
      activity_type: "demo",
      direction: "outbound",
      outcome: "completed",
      subject: "Apresentação e Demonstração do AlienMatrix CRM",
      duration_seconds: 2700, // 45 min
      notes: "Cliente adorou a integração nativa com WhatsApp e o Kanban de imóveis. Pediu proposta formal.",
    },
    {
      activity_type: "whatsapp_call",
      direction: "inbound",
      outcome: "connected",
      subject: "Dúvidas sobre sincronização de portais e catálogo",
      duration_seconds: 1200, // 20 min
      notes: "Explicado funcionamento do plugin de portais imobiliários.",
    },
    {
      activity_type: "meeting",
      direction: "outbound",
      outcome: "completed",
      subject: "Reunião de Fechamento de Contrato",
      duration_seconds: 1800, // 30 min
      notes: "Alinhados detalhes de SLA e treinamento da equipe de vendas.",
    },
  ];

  for (const c of calls) {
    await client.query(`
      insert into public.crm_call_logs (
        organization_id, contact_id, lead_id, activity_type, direction, outcome, subject, duration_seconds, notes, performed_at
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, now() - interval '1 day' * random() * 3);
    `, [orgId, contactId, dealId, c.activity_type, c.direction, c.outcome, c.subject, c.duration_seconds, c.notes]);
  }
  console.log("✅ Seeded Call & Meeting Logs.");

  await client.end();
  console.log("🎉 Phase 2 Seeding Completed Successfully!");
}

seed().catch(err => {
  console.error("Seeding error:", err);
  process.exit(1);
});
