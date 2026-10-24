-- manifest: 0709_alienmatrix_ai_layer_upgrade
-- AlienMatrix Phase 6: AI Layer Upgrade
-- Multi-model tenant settings, agent personas, RAG knowledge items, AI insights & lead scoring, usage budget logs, and intelligent human handoff.

-- 1. Tenant AI Settings & Multi-Provider Keys
create table if not exists public.crm_tenant_ai_settings (
  organization_id uuid not null references public.organizations(id) on delete cascade primary key,
  active_provider text not null default 'anthropic',
  primary_model text not null default 'claude-3-5-sonnet-20241022',
  fast_model text not null default 'claude-3-5-haiku-20241022',
  embedding_provider text not null default 'openai',
  api_keys jsonb not null default '{}'::jsonb,
  monthly_token_budget bigint not null default 1000000,
  monthly_cost_limit_cents integer not null default 5000,
  budget_alert_threshold_percent integer not null default 80,
  hard_stop_on_budget boolean not null default true,
  lead_scoring_enabled boolean not null default true,
  sentiment_analysis_enabled boolean not null default true,
  auto_fill_fields_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Agent Personas
create table if not exists public.crm_agent_personas (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  role_title text not null default 'Consultor Comercial',
  tone text not null default 'professional_friendly',
  language text not null default 'pt-BR',
  system_prompt text not null,
  first_message_greeting text,
  fallback_behavior text not null default 'handoff',
  is_active boolean not null default true,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. RAG Knowledge Items (Docs, FAQs, URLs, Policies)
create table if not exists public.crm_knowledge_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  type text not null default 'doc',
  source_url text,
  content text not null,
  tags text[] not null default '{}'::text[],
  status text not null default 'ready',
  token_count integer not null default 0,
  chunk_count integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. AI Insights, Scoring & Conversation Summaries
create table if not exists public.crm_ai_insights (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  target_type text not null default 'conversation',
  target_id uuid not null,
  lead_score integer not null default 50,
  score_reasons jsonb not null default '[]'::jsonb,
  sentiment text not null default 'neutral',
  sentiment_score numeric(4,2) not null default 0.00,
  summary text,
  next_best_actions jsonb not null default '[]'::jsonb,
  extracted_fields jsonb not null default '{}'::jsonb,
  fields_applied boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. AI Usage Tracking & Budget Logs
create table if not exists public.crm_ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  model text not null,
  provider text not null,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  total_tokens integer not null default 0,
  cost_cents integer not null default 0,
  operation_type text not null default 'inbound_turn',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 6. Intelligent Human Handoff Logs with AI Summary
create table if not exists public.crm_ai_handoff_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid references public.crm_whatsapp_conversations(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  lead_id uuid references public.crm_leads(id) on delete set null,
  trigger_reason text not null default 'sentiment_frustrated',
  ai_summary text not null,
  lead_sentiment text not null default 'neutral',
  urgency text not null default 'medium',
  suggested_action text,
  assigned_to_user_id uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_crm_agent_personas_org on public.crm_agent_personas(organization_id);
create index if not exists idx_crm_knowledge_items_org on public.crm_knowledge_items(organization_id);
create index if not exists idx_crm_ai_insights_org_target on public.crm_ai_insights(organization_id, target_type, target_id);
create index if not exists idx_crm_ai_usage_logs_org_created on public.crm_ai_usage_logs(organization_id, created_at desc);
create index if not exists idx_crm_ai_handoff_logs_org_status on public.crm_ai_handoff_logs(organization_id, status);

-- Enable RLS
alter table public.crm_tenant_ai_settings enable row level security;
alter table public.crm_agent_personas enable row level security;
alter table public.crm_knowledge_items enable row level security;
alter table public.crm_ai_insights enable row level security;
alter table public.crm_ai_usage_logs enable row level security;
alter table public.crm_ai_handoff_logs enable row level security;

-- Policies for crm_tenant_ai_settings
drop policy if exists "tenant_ai_settings_isolation" on public.crm_tenant_ai_settings;
create policy "tenant_ai_settings_isolation" on public.crm_tenant_ai_settings
  for all using (
    organization_id in (select public.fn_user_org_ids()) or public.fn_is_platform_admin()
  );

-- Policies for crm_agent_personas
drop policy if exists "agent_personas_isolation" on public.crm_agent_personas;
create policy "agent_personas_isolation" on public.crm_agent_personas
  for all using (
    organization_id in (select public.fn_user_org_ids()) or public.fn_is_platform_admin()
  );

-- Policies for crm_knowledge_items
drop policy if exists "knowledge_items_isolation" on public.crm_knowledge_items;
create policy "knowledge_items_isolation" on public.crm_knowledge_items
  for all using (
    organization_id in (select public.fn_user_org_ids()) or public.fn_is_platform_admin()
  );

-- Policies for crm_ai_insights
drop policy if exists "ai_insights_isolation" on public.crm_ai_insights;
create policy "ai_insights_isolation" on public.crm_ai_insights
  for all using (
    organization_id in (select public.fn_user_org_ids()) or public.fn_is_platform_admin()
  );

-- Policies for crm_ai_usage_logs
drop policy if exists "ai_usage_logs_isolation" on public.crm_ai_usage_logs;
create policy "ai_usage_logs_isolation" on public.crm_ai_usage_logs
  for all using (
    organization_id in (select public.fn_user_org_ids()) or public.fn_is_platform_admin()
  );

-- Policies for crm_ai_handoff_logs
drop policy if exists "ai_handoff_logs_isolation" on public.crm_ai_handoff_logs;
create policy "ai_handoff_logs_isolation" on public.crm_ai_handoff_logs
  for all using (
    organization_id in (select public.fn_user_org_ids()) or public.fn_is_platform_admin()
  );
