import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

function getEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  const env = {};
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const l of lines) {
      const trimmed = l.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
        env[k] = v;
      }
    }
  }
  return env;
}

const env = getEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedPhase4() {
  console.log("Seeding Phase 4: Workflows, Lead Forms & Inbound Webhooks...");

  // 1. Get all organizations
  const { data: orgs } = await supabase.from("organizations").select("id, display_name");
  if (!orgs || orgs.length === 0) {
    console.error("No organization found.");
    process.exit(1);
  }

  for (const org of orgs) {
    const orgId = org.id;
    console.log(`Processing organization: ${org.display_name} (${orgId})`);

    // 2. Seed Workflows
    const workflowsToInsert = [
      {
        organization_id: orgId,
        name: "Alerta de Lead Qualificado (High Value)",
        description: "Notifica por WhatsApp e gera tarefa de follow-up prioritário quando o valor passar de R$ 5.000",
        trigger_type: "record_created",
        trigger_config: { entity: "crm_leads" },
        conditions: [
          { field: "value_cents", operator: "gte", value: 500000 }
        ],
        actions: [
          {
            type: "create_task",
            config: { title: "Follow-up Imediato — Lead VIP", priority: "high" }
          },
          {
            type: "send_whatsapp",
            config: { message: "Olá! Recebemos sua solicitação de proposta VIP. Um consultor sênior entrará em contato em instantes." }
          }
        ],
        is_active: true
      },
      {
        organization_id: orgId,
        name: "Celebração de Negócio Fechado & Onboarding",
        description: "Quando um deal for movido para 'Ganho', agenda tarefa de onboarding do cliente e notifica a equipe",
        trigger_type: "stage_changed",
        trigger_config: { target_stage: "won" },
        conditions: [
          { field: "stage", operator: "equals", value: "won" }
        ],
        actions: [
          {
            type: "create_task",
            config: { title: "Kickoff de Onboarding do Cliente", due_days: 2 }
          }
        ],
        is_active: true
      }
    ];

    for (const wf of workflowsToInsert) {
      const { data: existing } = await supabase
        .from("crm_workflows")
        .select("id")
        .eq("organization_id", orgId)
        .eq("name", wf.name)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase.from("crm_workflows").insert(wf);
        if (error) console.error("Error inserting workflow:", error.message);
        else console.log(`✓ Inserted workflow: ${wf.name}`);
      } else {
        console.log(`- Workflow already exists: ${wf.name}`);
      }
    }

    // 3. Seed Lead Forms
    const formsToInsert = [
      {
        organization_id: orgId,
        title: "Fale Conosco & Demonstração",
        slug: "contato-demo",
        description: "Formulário oficial do site institucional para solicitação de demonstração personalizada.",
        fields_config: [
          { name: "name", label: "Nome Completo", type: "text", required: true },
          { name: "email", label: "E-mail Corporativo", type: "email", required: true },
          { name: "phone", label: "WhatsApp / Celular", type: "phone", required: true },
          { name: "company", label: "Nome da Empresa", type: "text", required: false },
          { name: "need", label: "Principal Desafio de Vendas", type: "textarea", required: false }
        ],
        primary_color_hex: "#2563eb",
        success_message: "Recebemos sua mensagem! Nossa equipe entrará em contato via WhatsApp em até 15 minutos.",
        is_active: true,
        submissions_count: 27
      }
    ];

    for (const f of formsToInsert) {
      const { data: existing } = await supabase
        .from("crm_lead_forms")
        .select("id")
        .eq("organization_id", orgId)
        .eq("slug", f.slug)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase.from("crm_lead_forms").insert(f);
        if (error) console.error("Error inserting form:", error.message);
        else console.log(`✓ Inserted lead form: ${f.title}`);
      } else {
        console.log(`- Form already exists: ${f.title}`);
      }
    }

    // 4. Seed Inbound Webhooks
    const webhooksToInsert = [
      {
        organization_id: orgId,
        name: "Zapier — Facebook & Instagram Lead Ads",
        token: `whk_fb_lead_ads_${orgId.slice(0, 8)}`,
        target_entity: "lead",
        field_mapping: {
          full_name: "name",
          user_email: "email",
          phone_number: "phone",
          estimated_budget: "value"
        },
        is_active: true,
        calls_count: 42
      },
      {
        organization_id: orgId,
        name: "Typeform — Diagnóstico Comercial",
        token: `whk_typeform_diag_${orgId.slice(0, 8)}`,
        target_entity: "lead",
        field_mapping: {
          answers_name: "name",
          answers_email: "email",
          answers_phone: "phone"
        },
        is_active: true,
        calls_count: 19
      }
    ];

    for (const wh of webhooksToInsert) {
      const { data: existing } = await supabase
        .from("crm_inbound_webhooks")
        .select("id")
        .eq("organization_id", orgId)
        .eq("token", wh.token)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase.from("crm_inbound_webhooks").insert(wh);
        if (error) console.error("Error inserting webhook:", error.message);
        else console.log(`✓ Inserted inbound webhook: ${wh.name}`);
      } else {
        console.log(`- Webhook already exists: ${wh.name}`);
      }
    }
  }

  console.log("Phase 4 seeding completed successfully!");
}

seedPhase4().catch(console.error);
