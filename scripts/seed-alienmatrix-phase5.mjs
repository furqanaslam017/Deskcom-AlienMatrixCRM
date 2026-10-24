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

async function seedPhase5() {
  console.log("Seeding Phase 5: WhatsApp Flagship, Shared Inbox, Multi-Numbers & Guardrails...");

  const { data: orgs } = await supabase.from("organizations").select("id, display_name");
  if (!orgs || orgs.length === 0) {
    console.error("No organizations found.");
    process.exit(1);
  }

  for (const org of orgs) {
    const orgId = org.id;
    console.log(`Processing org: ${org.display_name} (${orgId})`);

    // 1. WhatsApp Numbers (WAHA + Meta Cloud API)
    const numbersToInsert = [
      {
        organization_id: orgId,
        name: "WhatsApp Vendas VIP (Brasil)",
        phone_number: "+5511988887777",
        provider: "waha",
        status: "connected",
        waha_session_name: `waha_vendas_${orgId.slice(0, 8)}`,
        battery_level: 96,
        health_status: "healthy",
        auto_reconnect_enabled: true,
        is_default: true,
      },
      {
        organization_id: orgId,
        name: "WhatsApp Suporte Oficial (Meta Cloud)",
        phone_number: "+15550192834",
        provider: "meta_cloud",
        status: "connected",
        meta_phone_number_id: "meta_phone_1009823487",
        meta_waba_id: "waba_7788990011",
        battery_level: 100,
        health_status: "healthy",
        auto_reconnect_enabled: true,
        is_default: false,
      },
    ];

    const insertedNumberIds = [];
    for (const num of numbersToInsert) {
      const { data: existing } = await supabase
        .from("crm_whatsapp_numbers")
        .select("id")
        .eq("organization_id", orgId)
        .eq("phone_number", num.phone_number)
        .maybeSingle();

      if (!existing) {
        const { data, error } = await supabase.from("crm_whatsapp_numbers").insert(num).select("id").single();
        if (error) console.error("Error inserting number:", error.message);
        else {
          console.log(`✓ Inserted WhatsApp number: ${num.name}`);
          insertedNumberIds.push(data.id);
        }
      } else {
        insertedNumberIds.push(existing.id);
      }
    }

    const primaryNumberId = insertedNumberIds[0];

    // 2. Fetch or create sample contact & deal
    let contactId = null;
    const { data: contacts } = await supabase.from("contacts").select("id").eq("organization_id", orgId).limit(1);
    if (contacts && contacts.length > 0 && contacts[0]) {
      contactId = contacts[0].id;
    } else {
      const { data: newContact } = await supabase
        .from("contacts")
        .insert({
          organization_id: orgId,
          name: "Carlos Eduardo Silva",
          phone_number: "+5511977776666",
          email: "carlos.silva@enterprise.com",
        })
        .select("id")
        .single();
      contactId = newContact?.id;
    }

    let dealId = null;
    const { data: deals } = await supabase.from("crm_leads").select("id").eq("organization_id", orgId).limit(1);
    if (deals && deals.length > 0 && deals[0]) {
      dealId = deals[0].id;
    }

    // 3. Shared Inbox Conversation
    let convId = null;
    const { data: existingConv } = await supabase
      .from("crm_whatsapp_conversations")
      .select("id")
      .eq("organization_id", orgId)
      .eq("contact_id", contactId)
      .maybeSingle();

    if (!existingConv && contactId) {
      const { data: newConv, error } = await supabase
        .from("crm_whatsapp_conversations")
        .insert({
          organization_id: orgId,
          whatsapp_number_id: primaryNumberId,
          contact_id: contactId,
          deal_id: dealId,
          status: "open",
          priority: "high",
          unread_count: 0,
          last_message_text: "Perfeito, acabei de aprovar a proposta comercial! Como procedemos?",
          last_message_at: new Date().toISOString(),
          labels: ["VIP", "Fechamento", "Q4"],
        })
        .select("id")
        .single();

      if (!error && newConv) {
        convId = newConv.id;
        console.log(`✓ Inserted shared conversation: ${convId}`);
      }
    } else if (existingConv) {
      convId = existingConv.id;
    }

    // 4. Sample Messages in Conversation
    if (convId) {
      const { data: existingMsgs } = await supabase
        .from("crm_whatsapp_messages")
        .select("id")
        .eq("conversation_id", convId)
        .limit(1);

      if (!existingMsgs || existingMsgs.length === 0) {
        await supabase.from("crm_whatsapp_messages").insert([
          {
            organization_id: orgId,
            conversation_id: convId,
            sender_type: "contact",
            direction: "inbound",
            message_type: "text",
            content: "Olá! Gostaria de entender mais sobre os planos corporativos do CRM AlienMatrix.",
            delivery_status: "read",
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          },
          {
            organization_id: orgId,
            conversation_id: convId,
            sender_type: "ai",
            direction: "outbound",
            message_type: "text",
            content: "Olá Carlos! Muito obrigado pelo contato. Nosso sistema conta com agentes de IA nativos e automação WhatsApp para sua equipe.",
            delivery_status: "read",
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 20).toISOString(),
          },
          {
            organization_id: orgId,
            conversation_id: convId,
            sender_type: "agent",
            direction: "outbound",
            message_type: "invoice",
            content: "📄 Fatura / Proposta Comercial #INV-1092\nValor: USD $2,500.00\nVencimento: 5 dias\nLink PDF: https://app.alienmatrix.com/app/crm/invoices",
            delivery_status: "read",
            created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          },
          {
            organization_id: orgId,
            conversation_id: convId,
            sender_type: "contact",
            direction: "inbound",
            message_type: "text",
            content: "Perfeito, acabei de aprovar a proposta comercial! Como procedemos?",
            delivery_status: "delivered",
            created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
          },
        ]);
        console.log("✓ Inserted sample conversation messages");
      }
    }

    // 5. Broadcast Campaign
    const { data: existingBcast } = await supabase
      .from("crm_whatsapp_broadcasts")
      .select("id")
      .eq("organization_id", orgId)
      .eq("name", "Campanha Q4 — Condição Exclusiva")
      .maybeSingle();

    if (!existingBcast) {
      await supabase.from("crm_whatsapp_broadcasts").insert({
        organization_id: orgId,
        whatsapp_number_id: primaryNumberId,
        name: "Campanha Q4 — Condição Exclusiva",
        template_name: "oferta_exclusiva_q4",
        message_body: "Olá! Liberamos condições especiais para fechamento de projetos de CRM neste trimestre. Responda 'QUERO' para detalhes.",
        target_segment: { status: "open", tags: ["VIP"] },
        status: "completed",
        total_recipients: 45,
        sent_count: 45,
        delivered_count: 44,
        read_count: 36,
        throttle_delay_seconds: 5,
      });
      console.log("✓ Inserted broadcast campaign");
    }

    // 6. Chatbot
    const { data: existingBot } = await supabase
      .from("crm_whatsapp_chatbots")
      .select("id")
      .eq("organization_id", orgId)
      .eq("name", "Menu Comercial & Atendimento")
      .maybeSingle();

    if (!existingBot) {
      await supabase.from("crm_whatsapp_chatbots").insert({
        organization_id: orgId,
        whatsapp_number_id: primaryNumberId,
        name: "Menu Comercial & Atendimento",
        keywords: ["preco", "planos", "demo", "comprar"],
        flow_type: "keyword",
        response_text: "Olá! Nossos planos começam a partir de USD $49/mês com agentes de IA e WhatsApp ilimitado. Deseja falar com um consultor humano?",
        fallback_mode: "ai_agent",
        is_active: true,
      });
      console.log("✓ Inserted chatbot");
    }

    // 7. Click-to-WhatsApp Link
    const { data: existingLink } = await supabase
      .from("crm_whatsapp_links")
      .select("id")
      .eq("organization_id", orgId)
      .eq("slug", `insta-promo-${orgId.slice(0, 4)}`)
      .maybeSingle();

    if (!existingLink) {
      await supabase.from("crm_whatsapp_links").insert({
        organization_id: orgId,
        whatsapp_number_id: primaryNumberId,
        title: "Campanha Instagram Ads Q4",
        slug: `insta-promo-${orgId.slice(0, 4)}`,
        prefilled_text: "Olá! Vi o anúncio no Instagram e gostaria de uma demonstração do AlienMatrix CRM.",
        utm_source: "instagram_ads",
        utm_medium: "cpc",
        utm_campaign: "reels_conversion_q4",
        clicks_count: 142,
        leads_generated_count: 38,
      });
      console.log("✓ Inserted Click-to-WhatsApp link");
    }

    // 8. Tenant Guardrails (All 7 enabled)
    await supabase.from("crm_tenant_guardrails").upsert(
      {
        organization_id: orgId,
        stop_optout_enabled: true,
        lgpd_enabled: true,
        anti_ban_pacing_enabled: true,
        messaging_window_enabled: true,
        spinning_enabled: true,
        promise_semantic_enabled: true,
        disclosure_enabled: true,
        max_hourly_sends: 60,
        emergency_killswitch: false,
        custom_blocked_words: ["grátis garantido", "100% de lucro sem risco", "dinheiro fácil"],
      },
      { onConflict: "organization_id" }
    );
    console.log("✓ Seeded the 7 pre-send guardrails configuration");
  }

  console.log("Phase 5 WhatsApp Flagship seeding completed successfully!");
}

seedPhase5().catch(console.error);
