-- =============================================================================
-- DeskcommCRM — Test & Demo Seed Data
-- =============================================================================
-- Este script insere dados determinísticos para teste e demonstração do CRM:
-- 1. Organização de teste ('E2E Test Org')
-- 2. Pipeline de Vendas ('CRM Vivo — Clínica') com 6 estágios
-- 3. Contatos de exemplo (com telefone, email, tags)
-- 4. Leads de exemplo em diferentes estágios, valores e tags
-- 5. Agente de IA padrão ('Lia — Atendimento e Vendas')
-- =============================================================================

DO $$
DECLARE
    v_org_id uuid := '00000000-0000-0000-0000-000000000001';
    v_pipeline_id uuid := '00000000-0000-0000-0000-000000000010';
    v_stage_contato uuid := '00000000-0000-0000-0000-000000000101';
    v_stage_avaliacao uuid := '00000000-0000-0000-0000-000000000102';
    v_stage_proposta uuid := '00000000-0000-0000-0000-000000000103';
    v_stage_negociacao uuid := '00000000-0000-0000-0000-000000000104';
    v_stage_fechado uuid := '00000000-0000-0000-0000-000000000105';
    v_stage_perdido uuid := '00000000-0000-0000-0000-000000000106';

    v_contact_marina uuid := '00000000-0000-0000-0000-000000000201';
    v_contact_rogerio uuid := '00000000-0000-0000-0000-000000000202';
    v_contact_bruno uuid := '00000000-0000-0000-0000-000000000203';
    v_contact_helena uuid := '00000000-0000-0000-0000-000000000204';
    v_contact_caio uuid := '00000000-0000-0000-0000-000000000205';
    v_contact_patricia uuid := '00000000-0000-0000-0000-000000000206';
    v_contact_sonia uuid := '00000000-0000-0000-0000-000000000207';
    v_contact_carlos uuid := '00000000-0000-0000-0000-000000000208';
BEGIN
    -- 1. Organização de teste
    INSERT INTO public.organizations (
        id,
        slug,
        legal_name,
        display_name,
        status,
        timezone,
        locale,
        onboarded_at
    ) VALUES (
        v_org_id,
        'e2e-test-org',
        'E2E Test Org LTDA',
        'E2E Test Org',
        'active',
        'America/Sao_Paulo',
        'pt-BR',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        legal_name = EXCLUDED.legal_name,
        display_name = EXCLUDED.display_name,
        status = EXCLUDED.status,
        onboarded_at = EXCLUDED.onboarded_at;

    -- 2. Agente de IA Padrão
    INSERT INTO public.ai_agents (
        id,
        organization_id,
        name,
        description,
        is_active,
        is_default,
        model,
        system_prompt,
        kind
    ) VALUES (
        '00000000-0000-0000-0000-000000000050',
        v_org_id,
        'Lia — Atendimento e Vendas',
        'Agente autônomo para qualificação de leads e agendamento.',
        true,
        true,
        'anthropic/claude-sonnet-4-6',
        'Você é Lia, assistente virtual de vendas e qualificação. Seja cordial, concisa e objetiva.',
        'rag_bot'
    ) ON CONFLICT (id) DO NOTHING;

    -- 3. Pipeline do CRM
    INSERT INTO public.crm_pipelines (
        id,
        organization_id,
        name,
        slug,
        description,
        is_default,
        position,
        vocabulary,
        settings
    ) VALUES (
        v_pipeline_id,
        v_org_id,
        'CRM Vivo — Clínica',
        'crm-vivo-clinica',
        'Board de demonstração com dados de teste para clínica odontológica.',
        false,
        1000,
        jsonb_build_object(
            'lead', 'Paciente',
            'lead_plural', 'Pacientes',
            'deal', 'Tratamento',
            'deal_plural', 'Tratamentos',
            'won', 'Fechado',
            'lost', 'Perdido',
            'stage', 'Etapa',
            'stage_plural', 'Etapas'
        ),
        jsonb_build_object(
            'fields', '[]'::jsonb,
            'canonical_tags', jsonb_build_array('implante'),
            'lost_reasons', '[]'::jsonb,
            'identity_resolution', jsonb_build_object('fields_in_priority_order', jsonb_build_array('cpf', 'phone_e164', 'email'))
        )
    ) ON CONFLICT (organization_id, slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description;

    -- 4. Estágios do Pipeline
    INSERT INTO public.crm_stages (id, organization_id, pipeline_id, name, slug, position, expected_duration_hours, is_won, is_lost)
    VALUES
        (v_stage_contato, v_org_id, v_pipeline_id, 'Primeiro contato', 'primeiro_contato', 1000, 24, false, false),
        (v_stage_avaliacao, v_org_id, v_pipeline_id, 'Avaliação', 'avaliacao', 2000, 48, false, false),
        (v_stage_proposta, v_org_id, v_pipeline_id, 'Proposta enviada', 'proposta', 3000, 72, false, false),
        (v_stage_negociacao, v_org_id, v_pipeline_id, 'Negociação', 'negociacao', 4000, 96, false, false),
        (v_stage_fechado, v_org_id, v_pipeline_id, 'Tratamento fechado', 'fechado', 5000, null, true, false),
        (v_stage_perdido, v_org_id, v_pipeline_id, 'Perdido', 'perdido', 6000, null, false, true)
    ON CONFLICT (pipeline_id, slug) DO NOTHING;

    -- 5. Contatos de Teste
    INSERT INTO public.contacts (id, organization_id, name, display_name, email, phone_number, tags)
    VALUES
        (v_contact_marina, v_org_id, 'Marina Costa', 'Marina Costa', 'marina.costa@exemplo.com', '+5511999991001', ARRAY['clareamento']),
        (v_contact_rogerio, v_org_id, 'Rogério Paiva', 'Rogério Paiva', 'rogerio.paiva@exemplo.com', '+5511999991002', ARRAY['primeira-consulta']),
        (v_contact_bruno, v_org_id, 'Bruno Tavares', 'Bruno Tavares', 'bruno.tavares@exemplo.com', '+5511999991003', ARRAY['protocolo']),
        (v_contact_helena, v_org_id, 'Helena Marques', 'Helena Marques', 'helena.marques@exemplo.com', '+5511999991004', ARRAY['ortodontia']),
        (v_contact_caio, v_org_id, 'Caio Ribeiro', 'Caio Ribeiro', 'caio.ribeiro@exemplo.com', '+5511999991005', ARRAY['urgencia']),
        (v_contact_patricia, v_org_id, 'Patrícia Nunes', 'Patrícia Nunes', 'patricia.nunes@exemplo.com', '+5511999991006', ARRAY['protese']),
        (v_contact_sonia, v_org_id, 'Sônia Vasconcelos', 'Sônia Vasconcelos', 'sonia.vasconcelos@exemplo.com', '+5511999991007', ARRAY['implante']),
        (v_contact_carlos, v_org_id, 'Carlos Santos', 'Carlos Santos', 'carlos.santos@exemplo.com', '+5511999991008', ARRAY['protocolo', 'manutencao'])
    ON CONFLICT (id) DO NOTHING;

    -- 6. Leads de Teste
    INSERT INTO public.crm_leads (
        organization_id, pipeline_id, stage_id, contact_id, title, status, lost_reason, closed_at, position_in_stage, value_cents, currency, tags
    ) VALUES
        (v_org_id, v_pipeline_id, v_stage_contato, v_contact_caio, 'Caio Ribeiro — dor de dente', 'open', null, null, 1000, 45000, 'BRL', ARRAY['urgencia']),
        (v_org_id, v_pipeline_id, v_stage_contato, v_contact_marina, 'Marina Costa — clareamento', 'open', null, null, 2000, 180000, 'BRL', ARRAY['clareamento']),
        (v_org_id, v_pipeline_id, v_stage_avaliacao, v_contact_rogerio, 'Rogério Paiva — avaliação inicial', 'open', null, null, 1000, 250000, 'BRL', ARRAY['primeira-consulta']),
        (v_org_id, v_pipeline_id, v_stage_avaliacao, v_contact_patricia, 'Patrícia Nunes — prótese fixa', 'open', null, null, 2000, 780000, 'BRL', ARRAY['protese']),
        (v_org_id, v_pipeline_id, v_stage_proposta, v_contact_bruno, 'Bruno Tavares — protocolo superior', 'open', null, null, 1000, 4500000, 'BRL', ARRAY['protocolo']),
        (v_org_id, v_pipeline_id, v_stage_proposta, v_contact_sonia, 'Sônia Vasconcelos — implante unitário', 'open', null, null, 2000, 690000, 'BRL', ARRAY['implante']),
        (v_org_id, v_pipeline_id, v_stage_negociacao, v_contact_helena, 'Helena Marques — ortodontia adulto', 'open', null, null, 1000, 960000, 'BRL', ARRAY['ortodontia']),
        (v_org_id, v_pipeline_id, v_stage_negociacao, v_contact_carlos, 'Carlos — manutenção de protocolo', 'open', null, null, 2000, 2800000, 'BRL', ARRAY['protocolo', 'manutencao']),
        (v_org_id, v_pipeline_id, v_stage_fechado, v_contact_marina, 'Marina Costa — tratamento concluído', 'won', null, NOW(), 1000, 180000, 'BRL', ARRAY['clareamento']),
        (v_org_id, v_pipeline_id, v_stage_perdido, v_contact_rogerio, 'Rogério Paiva — desistência', 'lost', 'cancelled_by_customer', NOW(), 1000, 250000, 'BRL', ARRAY['primeira-consulta'])
    ON CONFLICT DO NOTHING;

END $$;
