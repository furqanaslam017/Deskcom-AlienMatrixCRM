-- manifest: **AlienMatrix Phase 4 — Automation & Workflows.** Adiciona motor visual de automações (crm_workflows, crm_workflow_executions), formulários públicos incorporáveis de captura de leads (crm_lead_forms) e endpoints dedicados de webhooks para Zapier/Make/n8n (crm_inbound_webhooks). RLS estrita por `fn_user_org_ids()`. Aditiva e idempotente; apêndice no `baseline.sql`.
-- ============================================================================
-- 0707 — ALIENMATRIX PHASE 4: AUTOMATION & WORKFLOWS
-- ============================================================================

-- 1. MOTOR DE WORKFLOWS E AUTOMAÇÕES (CRM WORKFLOWS)
create table if not exists public.crm_workflows (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default true,
  trigger_type text not null check (trigger_type in ('record_created', 'stage_changed', 'message_received', 'time_based', 'webhook')),
  trigger_config jsonb not null default '{}'::jsonb,
  conditions jsonb not null default '[]'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  created_by_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_crm_workflows_org on public.crm_workflows (organization_id);
create index if not exists idx_crm_workflows_trigger on public.crm_workflows (organization_id, trigger_type);

-- 2. HISTÓRICO DE EXECUÇÕES DE WORKFLOWS (EXECUTION LOGS)
create table if not exists public.crm_workflow_executions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  workflow_id uuid not null references public.crm_workflows (id) on delete cascade,
  status text not null default 'success' check (status in ('success', 'failed', 'running', 'skipped')),
  entity_type text,
  entity_id text,
  trigger_payload jsonb not null default '{}'::jsonb,
  action_results jsonb not null default '[]'::jsonb,
  error_message text,
  duration_ms integer not null default 0,
  executed_at timestamptz not null default now()
);

create index if not exists idx_crm_workflow_executions_wf on public.crm_workflow_executions (organization_id, workflow_id);
create index if not exists idx_crm_workflow_executions_date on public.crm_workflow_executions (organization_id, executed_at desc);

-- 3. FORMULÁRIOS PÚBLICOS DE CAPTURA DE LEADS (EMBEDDABLE LEAD FORMS)
create table if not exists public.crm_lead_forms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title text not null,
  slug text not null,
  description text,
  target_pipeline_id uuid references public.crm_pipelines (id) on delete set null,
  target_stage_id uuid references public.crm_stages (id) on delete set null,
  fields_config jsonb not null default '[]'::jsonb,
  primary_color_hex text not null default '#2563eb',
  success_message text not null default 'Obrigado! Entraremos em contato em breve.',
  redirect_url text,
  is_active boolean not null default true,
  submissions_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_crm_lead_forms_slug unique (organization_id, slug)
);

create index if not exists idx_crm_lead_forms_org on public.crm_lead_forms (organization_id);

-- 4. WEBHOOKS DE ENTRADA (INBOUND WEBHOOKS / ZAPIER / MAKE / N8N)
create table if not exists public.crm_inbound_webhooks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  token text not null unique,
  target_entity text not null default 'lead' check (target_entity in ('lead', 'contact', 'custom_record')),
  field_mapping jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  calls_count integer not null default 0,
  last_called_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_crm_inbound_webhooks_org on public.crm_inbound_webhooks (organization_id);
create index if not exists idx_crm_inbound_webhooks_token on public.crm_inbound_webhooks (token);

-- 5. ATIVAÇÃO DE ROW LEVEL SECURITY (RLS)
alter table public.crm_workflows enable row level security;
alter table public.crm_workflow_executions enable row level security;
alter table public.crm_lead_forms enable row level security;
alter table public.crm_inbound_webhooks enable row level security;

-- 6. POLÍTICAS DE RLS (SELECT)
drop policy if exists "crm_workflows_select" on public.crm_workflows;
create policy "crm_workflows_select" on public.crm_workflows
  for select to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists "crm_workflow_executions_select" on public.crm_workflow_executions;
create policy "crm_workflow_executions_select" on public.crm_workflow_executions
  for select to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists "crm_lead_forms_select" on public.crm_lead_forms;
create policy "crm_lead_forms_select" on public.crm_lead_forms
  for select to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists "crm_inbound_webhooks_select" on public.crm_inbound_webhooks;
create policy "crm_inbound_webhooks_select" on public.crm_inbound_webhooks
  for select to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

-- 7. POLÍTICAS DE RLS (WRITE)
drop policy if exists "crm_workflows_write" on public.crm_workflows;
create policy "crm_workflows_write" on public.crm_workflows
  for all to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full())
  with check ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full());

drop policy if exists "crm_workflow_executions_write" on public.crm_workflow_executions;
create policy "crm_workflow_executions_write" on public.crm_workflow_executions
  for all to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full())
  with check ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full());

drop policy if exists "crm_lead_forms_write" on public.crm_lead_forms;
create policy "crm_lead_forms_write" on public.crm_lead_forms
  for all to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full())
  with check ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full());

drop policy if exists "crm_inbound_webhooks_write" on public.crm_inbound_webhooks;
create policy "crm_inbound_webhooks_write" on public.crm_inbound_webhooks
  for all to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full())
  with check ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full());
