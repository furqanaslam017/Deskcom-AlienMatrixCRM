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

    const { rows: orgs } = await client.query(
      "SELECT id, display_name FROM public.organizations WHERE id IN ('00000000-0000-0000-0000-000000000001', '27728f33-73f5-4ebf-a23d-a2a0fbc855d2')"
    );

    for (const org of orgs) {
      console.log(`Seeding Phase 6 AI data for ${org.display_name} (${org.id})...`);

      // 1. Tenant AI Settings
      await client.query(
        `INSERT INTO public.crm_tenant_ai_settings (
          organization_id, active_provider, primary_model, fast_model, embedding_provider,
          api_keys, monthly_token_budget, monthly_cost_limit_cents, budget_alert_threshold_percent,
          hard_stop_on_budget, lead_scoring_enabled, sentiment_analysis_enabled, auto_fill_fields_enabled
        ) VALUES (
          $1, 'anthropic', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'openai',
          '{"anthropic": "sk-ant-api03-alienmatrixdemo-live", "openai": "sk-proj-alienmatrixdemo-key"}'::jsonb,
          2500000, 10000, 80, true, true, true, true
        ) ON CONFLICT (organization_id) DO UPDATE SET
          primary_model = EXCLUDED.primary_model,
          monthly_token_budget = EXCLUDED.monthly_token_budget;`,
        [org.id]
      );

      // 2. Agent Personas
      await client.query(
        `INSERT INTO public.crm_agent_personas (
          organization_id, name, role_title, tone, language, system_prompt,
          first_message_greeting, fallback_behavior, is_active, is_default
        ) VALUES 
        ($1, 'Maya - Consultora Imobiliária Sênior', 'Especialista em Vendas de Alto Padrão', 'professional_friendly', 'pt-BR',
         'Você é Maya, consultora sênior da imobiliária. Seu objetivo é qualificar compradores para lançamentos e agendar visitas nos plantões. Seja cordial, conheça metragem, vagas e valores.',
         'Olá! Sou a Maya, consultora imobiliária. Como posso ajudar a encontrar o seu imóvel ideal hoje?', 'handoff', true, true),
        ($1, 'Alex - AlienMatrix Global Sales', 'Enterprise Account Executive', 'assertive_sales', 'en',
         'You are Alex, an Enterprise AE for AlienMatrix CRM. Focus on qualification: team size, current CRM pain points, and lead volume.',
         'Hi! I am Alex from AlienMatrix CRM. How many sales reps are on your team currently?', 'book_call', true, false)
        ON CONFLICT DO NOTHING;`,
        [org.id]
      );

      // 3. Knowledge Items
      await client.query(
        `INSERT INTO public.crm_knowledge_items (
          organization_id, title, type, source_url, content, tags, status, token_count, chunk_count
        ) VALUES
        ($1, 'Catálogo Residencial Alpha Park & Tabela de Preços', 'doc', null,
         'Empreendimento Residencial Alpha Park: Aptos de 3 e 4 suítes, 142m² a 210m², 2 a 3 vagas. Valores a partir de R$ 890.000,00. Entrada parcelada em 36x direto com a construtora sem juros.',
         ARRAY['imoveis', 'alpha_park', 'precos', 'lancamento'], 'ready', 85, 1),
        ($1, 'FAQ Financiamento Bancário e FGTS', 'faq', null,
         'Pergunta: Posso usar o FGTS na entrada do financiamento? Resposta: Sim! O FGTS pode ser utilizado para compor a entrada ou abater parcelas futuras pela Caixa Econômica e bancos privados conveniados.',
         ARRAY['faq', 'fgts', 'financiamento', 'bancos'], 'ready', 65, 1),
        ($1, 'Política de Privacidade e Proteção de Dados LGPD', 'policy', 'https://alienmatrix.io/privacy',
         'Todos os dados coletados neste canal são armazenados de forma criptografada sob conformidade com a LGPD (Lei 13.709/2018). O titular pode solicitar exclusão a qualquer momento digitando PARAR.',
         ARRAY['lgpd', 'privacidade', 'compliance'], 'ready', 72, 1)
        ON CONFLICT DO NOTHING;`,
        [org.id]
      );

      // 4. AI Insights & Scoring
      const { rows: convs } = await client.query(
        "SELECT id FROM public.crm_whatsapp_conversations WHERE organization_id = $1 LIMIT 1",
        [org.id]
      );
      const convId = convs[0]?.id;

      if (convId) {
        await client.query(
          `INSERT INTO public.crm_ai_insights (
            organization_id, target_type, target_id, lead_score, score_reasons,
            sentiment, sentiment_score, summary, next_best_actions, extracted_fields, fields_applied
          ) VALUES (
            $1, 'conversation', $2, 88,
            '[{"factor": "pricing_interest", "delta": 15, "note": "Perguntou sobre condições do Alpha Park"}, {"factor": "purchase_intent", "delta": 20, "note": "Tem R$ 300k de entrada aprovada"}]'::jsonb,
            'positive', 0.82,
            'Cliente altamente qualificado com score 88/100. Busca unidade de 3 suítes no Alpha Park. Tem FGTS liberado e quer proposta formal.',
            '[{"title": "Enviar Proposta Comercial em PDF", "priority": "high", "action_type": "send_quote"}, {"title": "Agendar visita ao decorado sábado 14h", "priority": "medium", "action_type": "book_meeting"}]'::jsonb,
            '{"email": "comprador.qualificado@gmail.com", "phone": "11988887777", "budget": 950000}'::jsonb,
            false
          ) ON CONFLICT DO NOTHING;`,
          [org.id, convId]
        );

        // 5. Intelligent Human Handoff Log
        await client.query(
          `INSERT INTO public.crm_ai_handoff_logs (
            organization_id, conversation_id, trigger_reason, ai_summary,
            lead_sentiment, urgency, suggested_action, status
          ) VALUES (
            $1, $2, 'high_value_deal',
            'Cliente solicitou desconto especial para fechamento à vista de R$ 900.000. Negociação avançada pronta para fechamento pelo gerente comercial.',
            'positive', 'high', 'Assumir conversa imediatamente e formalizar minuta contratual com 3% de desconto à vista.',
            'pending'
          ) ON CONFLICT DO NOTHING;`,
          [org.id, convId]
        );
      }

      // 6. Usage Logs
      await client.query(
        `INSERT INTO public.crm_ai_usage_logs (
          organization_id, model, provider, prompt_tokens, completion_tokens, total_tokens, cost_cents, operation_type
        ) VALUES 
        ($1, 'claude-3-5-sonnet-20241022', 'anthropic', 1250, 320, 1570, 2, 'inbound_turn'),
        ($1, 'claude-3-5-sonnet-20241022', 'anthropic', 1800, 450, 2250, 3, 'inbound_turn'),
        ($1, 'claude-3-5-haiku-20241022', 'anthropic', 950, 150, 1100, 1, 'lead_score'),
        ($1, 'gpt-4o', 'openai', 2100, 600, 2700, 3, 'sentiment_summary')
        ON CONFLICT DO NOTHING;`,
        [org.id]
      );
    }

    console.log("✅ Seed data for Phase 6 applied successfully!");
  } catch (err) {
    console.error("❌ Failed to seed Phase 6 data:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
