import pg from "pg";
import fs from "node:fs";
import path from "node:path";
const DEFAULT_PLANS = [
  {
    slug: "starter",
    name: "Starter",
    description: "Ideal para pequenas empresas e autônomos iniciando vendas no WhatsApp.",
    price_monthly_cents: 14900,
    price_yearly_cents: 149000,
    currency: "BRL",
    max_seats: 3,
    max_whatsapp_numbers: 1,
    monthly_ai_tokens: 1000000,
    max_custom_objects: 3,
    features: [
      "1 Número de WhatsApp Conectado",
      "Até 3 Usuários na Equipe",
      "1.000.000 Tokens de IA / mês",
      "Funis de Vendas Ilimitados",
      "Suporte por Email e WhatsApp",
    ],
    is_active: true,
  },
  {
    slug: "pro",
    name: "Professional",
    description: "Para equipes em crescimento com múltiplos números e IA avançada.",
    price_monthly_cents: 34900,
    price_yearly_cents: 349000,
    currency: "BRL",
    max_seats: 10,
    max_whatsapp_numbers: 4,
    monthly_ai_tokens: 5000000,
    max_custom_objects: 15,
    features: [
      "4 Números de WhatsApp (WAHA + Meta Cloud)",
      "Até 10 Usuários na Equipe",
      "5.000.000 Tokens de IA / mês (Claude 3.5 Sonnet)",
      "Objetos Customizados e Templates de Nicho",
      "Workflows de Automação e Webhooks",
      "Disparo em Massa Anti-Ban com Throttling",
    ],
    is_active: true,
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    description: "Operação de alto volume com IA ilimitada, infraestrutura dedicada e SLA.",
    price_monthly_cents: 89000,
    price_yearly_cents: 890000,
    currency: "BRL",
    max_seats: 50,
    max_whatsapp_numbers: 15,
    monthly_ai_tokens: 25000000,
    max_custom_objects: 50,
    features: [
      "15+ Números de WhatsApp com Balanceamento",
      "Usuários Ilimitados",
      "25.000.000 Tokens de IA / mês",
      "Base de Conhecimento RAG Ilimitada",
      "Gerente de Conta Dedicado e SLA de 1h",
      "Opção de Pagamento Local (PIX/Boleto com NF-e)",
    ],
    is_active: true,
  },
];

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

    // 1. Seed Billing Plans
    console.log("Seeding Billing Plans catalog...");
    for (const plan of DEFAULT_PLANS) {
      await client.query(
        `INSERT INTO public.crm_billing_plans (
          slug, name, description, price_monthly_cents, price_yearly_cents,
          currency, max_seats, max_whatsapp_numbers, monthly_ai_tokens, max_custom_objects, features, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          price_monthly_cents = EXCLUDED.price_monthly_cents,
          features = EXCLUDED.features;`,
        [
          plan.slug,
          plan.name,
          plan.description,
          plan.price_monthly_cents,
          plan.price_yearly_cents,
          plan.currency,
          plan.max_seats,
          plan.max_whatsapp_numbers,
          plan.monthly_ai_tokens,
          plan.max_custom_objects,
          JSON.stringify(plan.features),
          plan.is_active,
        ]
      );
    }

    const { rows: proPlanRows } = await client.query(
      "SELECT id FROM public.crm_billing_plans WHERE slug = 'pro' LIMIT 1"
    );
    const proPlanId = proPlanRows[0]?.id;

    // 2. Seed Subscriptions & Reports for both demo orgs
    const { rows: orgs } = await client.query(
      "SELECT id, display_name FROM public.organizations WHERE id IN ('00000000-0000-0000-0000-000000000001', '27728f33-73f5-4ebf-a23d-a2a0fbc855d2')"
    );

    for (const org of orgs) {
      console.log(`Seeding Phase 7 data for ${org.display_name} (${org.id})...`);

      // Subscription
      if (proPlanId) {
        await client.query(
          `INSERT INTO public.crm_tenant_subscriptions (
            organization_id, plan_id, status, payment_provider, billing_cycle,
            current_period_start, current_period_end
          ) VALUES ($1, $2, 'active', 'stripe', 'monthly', now(), now() + interval '30 days')
          ON CONFLICT (organization_id) DO UPDATE SET
            plan_id = EXCLUDED.plan_id,
            status = 'active';`,
          [org.id, proPlanId]
        );
      }

      // Reports
      const { rows: insertedReport } = await client.query(
        `INSERT INTO public.crm_analytics_reports (
          organization_id, title, report_type, parameters, is_favorite
        ) VALUES 
        ($1, 'Funil de Vendas & Conversão Geral', 'sales_funnel', '{"period": "last_30_days"}'::jsonb, true),
        ($1, 'Performance e Volume do WhatsApp', 'whatsapp_performance', '{"channel": "all"}'::jsonb, true),
        ($1, 'Leaderboard & Ranking de Consultores', 'rep_leaderboard', '{}'::jsonb, false),
        ($1, 'Forecast Ponderado e Previsão de Fechamento', 'revenue_forecast', '{"weighted": true}'::jsonb, true)
        RETURNING id;`,
        [org.id]
      );

      const reportId = insertedReport[0]?.id;
      if (reportId) {
        await client.query(
          `INSERT INTO public.crm_scheduled_reports (
            organization_id, report_id, frequency, recipient_emails, format, is_active
          ) VALUES 
          ($1, $2, 'weekly', ARRAY['diretoria@alienmatrix.io', 'vendas@alienmatrix.io'], 'pdf', true),
          ($1, $2, 'monthly', ARRAY['financeiro@alienmatrix.io'], 'csv', true)
          ON CONFLICT DO NOTHING;`,
          [org.id, reportId]
        );
      }
    }

    console.log("✅ Seed data for Phase 7 applied successfully!");
  } catch (err) {
    console.error("❌ Failed to seed Phase 7 data:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
