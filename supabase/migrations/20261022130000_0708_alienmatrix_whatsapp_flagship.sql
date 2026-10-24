-- manifest: **AlienMatrix Phase 5 — WhatsApp Flagship.** Multi-número por tenant (WAHA + Meta Cloud API), monitoramento de saúde da sessão, caixa de entrada compartilhada (atribuição, notas internas, @menções, labels, SLA, quick replies), mídias ricas, campanhas de broadcast com throttling anti-ban, rastreio Click-to-WhatsApp com atribuição a negócios, chatbots de palavras-chave e configuração dos 7 guardrails por organização. RLS estrita por `fn_user_org_ids()`. Aditiva e idempotente; apêndice no `baseline.sql`.
-- ============================================================================
-- 0708 — ALIENMATRIX PHASE 5: WHATSAPP FLAGSHIP
-- ============================================================================

-- 1. WHATSAPP MULTI-NÚMEROS & GESTÃO DE SESSÕES
create table if not exists public.crm_whatsapp_numbers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  phone_number text not null,
  provider text not null default 'waha' check (provider in ('waha', 'meta_cloud')),
  status text not null default 'connected' check (status in ('connected', 'qr_ready', 'disconnected', 'starting', 'failed', 'archived')),
  qr_code_data text,
  waha_session_name text,
  meta_phone_number_id text,
  meta_waba_id text,
  meta_access_token text,
  battery_level integer default 100,
  health_status text not null default 'healthy' check (health_status in ('healthy', 'degraded', 'reconnecting')),
  auto_reconnect_enabled boolean not null default true,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_crm_whatsapp_numbers_org on public.crm_whatsapp_numbers (organization_id);
create index if not exists idx_crm_whatsapp_numbers_phone on public.crm_whatsapp_numbers (organization_id, phone_number);

-- 2. CAIXA DE ENTRADA COMPARTILHADA (SHARED TEAM INBOX CONVERSATIONS)
create table if not exists public.crm_whatsapp_conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  whatsapp_number_id uuid references public.crm_whatsapp_numbers (id) on delete set null,
  contact_id uuid references public.contacts (id) on delete set null,
  deal_id uuid references public.crm_leads (id) on delete set null,
  assigned_user_id uuid references auth.users (id) on delete set null,
  status text not null default 'open' check (status in ('open', 'pending', 'snoozed', 'closed')),
  priority text not null default 'normal' check (priority in ('urgent', 'high', 'normal', 'low')),
  sla_due_at timestamptz,
  sla_status text not null default 'ok' check (sla_status in ('ok', 'warning', 'breached')),
  snoozed_until timestamptz,
  labels jsonb not null default '[]'::jsonb,
  unread_count integer not null default 0,
  last_message_text text,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_crm_whatsapp_conv_org on public.crm_whatsapp_conversations (organization_id);
create index if not exists idx_crm_whatsapp_conv_contact on public.crm_whatsapp_conversations (organization_id, contact_id);
create index if not exists idx_crm_whatsapp_conv_deal on public.crm_whatsapp_conversations (organization_id, deal_id);
create index if not exists idx_crm_whatsapp_conv_assigned on public.crm_whatsapp_conversations (organization_id, assigned_user_id);

-- 3. MENSAGENS, MÍDIAS, REAÇÕES & COMPROVANTES DE ENTREGA
create table if not exists public.crm_whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  conversation_id uuid not null references public.crm_whatsapp_conversations (id) on delete cascade,
  sender_type text not null default 'contact' check (sender_type in ('contact', 'agent', 'ai', 'system')),
  sender_id uuid,
  direction text not null default 'inbound' check (direction in ('inbound', 'outbound')),
  message_type text not null default 'text' check (message_type in ('text', 'image', 'video', 'audio', 'document', 'location', 'contact', 'sticker', 'invoice', 'quote')),
  content text not null default '',
  media_url text,
  media_metadata jsonb not null default '{}'::jsonb,
  quoted_message_id uuid,
  reactions jsonb not null default '[]'::jsonb,
  delivery_status text not null default 'sent' check (delivery_status in ('pending', 'sent', 'delivered', 'read', 'failed')),
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_crm_whatsapp_msgs_conv on public.crm_whatsapp_messages (organization_id, conversation_id, created_at asc);

-- 4. NOTAS INTERNAS & MENÇÕES (@mentions)
create table if not exists public.crm_whatsapp_internal_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  conversation_id uuid not null references public.crm_whatsapp_conversations (id) on delete cascade,
  author_user_id uuid references auth.users (id) on delete set null,
  content text not null,
  mentioned_user_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_crm_whatsapp_notes_conv on public.crm_whatsapp_internal_notes (organization_id, conversation_id);

-- 5. RESPOSTAS RÁPIDAS & CANNED RESPONSES
create table if not exists public.crm_whatsapp_canned_responses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  shortcut text not null,
  title text not null,
  content text not null,
  category text not null default 'geral',
  created_at timestamptz not null default now(),
  constraint uq_crm_canned_shortcut unique (organization_id, shortcut)
);

create index if not exists idx_crm_whatsapp_canned_org on public.crm_whatsapp_canned_responses (organization_id);

-- 6. CAMPANHAS DE TRANSMISSÃO (BROADCASTS & ANTI-BAN THROTTLING)
create table if not exists public.crm_whatsapp_broadcasts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  whatsapp_number_id uuid references public.crm_whatsapp_numbers (id) on delete set null,
  name text not null,
  template_name text,
  message_body text not null,
  target_segment jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'running', 'completed', 'paused', 'cancelled')),
  total_recipients integer not null default 0,
  sent_count integer not null default 0,
  delivered_count integer not null default 0,
  read_count integer not null default 0,
  failed_count integer not null default 0,
  throttle_delay_seconds integer not null default 5,
  scheduled_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_crm_whatsapp_broadcasts_org on public.crm_whatsapp_broadcasts (organization_id);

-- 7. CHATBOTS & ROTEAMENTO POR PALAVRAS-CHAVE
create table if not exists public.crm_whatsapp_chatbots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  whatsapp_number_id uuid references public.crm_whatsapp_numbers (id) on delete set null,
  name text not null,
  keywords jsonb not null default '[]'::jsonb,
  flow_type text not null default 'keyword' check (flow_type in ('keyword', 'menu', 'business_hours')),
  menu_options jsonb not null default '[]'::jsonb,
  response_text text not null,
  fallback_mode text not null default 'ai_agent' check (fallback_mode in ('ai_agent', 'human_handoff', 'end')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_crm_whatsapp_chatbots_org on public.crm_whatsapp_chatbots (organization_id);

-- 8. CLICK-TO-WHATSAPP LINKS & RASTREIO DE ORIGEM
create table if not exists public.crm_whatsapp_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  whatsapp_number_id uuid references public.crm_whatsapp_numbers (id) on delete set null,
  title text not null,
  slug text not null,
  prefilled_text text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  target_pipeline_id uuid references public.crm_pipelines (id) on delete set null,
  target_stage_id uuid references public.crm_stages (id) on delete set null,
  clicks_count integer not null default 0,
  leads_generated_count integer not null default 0,
  created_at timestamptz not null default now(),
  constraint uq_crm_whatsapp_links_slug unique (organization_id, slug)
);

create index if not exists idx_crm_whatsapp_links_org on public.crm_whatsapp_links (organization_id);

-- 9. CONFIGURAÇÃO DOS 7 GUARDRAILS POR TENANT
create table if not exists public.crm_tenant_guardrails (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  stop_optout_enabled boolean not null default true,
  lgpd_enabled boolean not null default true,
  anti_ban_pacing_enabled boolean not null default true,
  messaging_window_enabled boolean not null default true,
  spinning_enabled boolean not null default true,
  promise_semantic_enabled boolean not null default true,
  disclosure_enabled boolean not null default true,
  max_hourly_sends integer not null default 60,
  emergency_killswitch boolean not null default false,
  custom_blocked_words jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- HABILITAR RLS NAS TABELAS
alter table public.crm_whatsapp_numbers enable row level security;
alter table public.crm_whatsapp_conversations enable row level security;
alter table public.crm_whatsapp_messages enable row level security;
alter table public.crm_whatsapp_internal_notes enable row level security;
alter table public.crm_whatsapp_canned_responses enable row level security;
alter table public.crm_whatsapp_broadcasts enable row level security;
alter table public.crm_whatsapp_chatbots enable row level security;
alter table public.crm_whatsapp_links enable row level security;
alter table public.crm_tenant_guardrails enable row level security;

-- POLÍTICAS RLS IDEMPOTENTES (fn_user_org_ids e platform admin)
drop policy if exists crm_wa_numbers_select on public.crm_whatsapp_numbers;
create policy crm_wa_numbers_select on public.crm_whatsapp_numbers
  for select to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists crm_wa_numbers_write on public.crm_whatsapp_numbers;
create policy crm_wa_numbers_write on public.crm_whatsapp_numbers
  for all to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists crm_wa_conv_select on public.crm_whatsapp_conversations;
create policy crm_wa_conv_select on public.crm_whatsapp_conversations
  for select to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists crm_wa_conv_write on public.crm_whatsapp_conversations;
create policy crm_wa_conv_write on public.crm_whatsapp_conversations
  for all to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists crm_wa_msgs_select on public.crm_whatsapp_messages;
create policy crm_wa_msgs_select on public.crm_whatsapp_messages
  for select to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists crm_wa_msgs_write on public.crm_whatsapp_messages;
create policy crm_wa_msgs_write on public.crm_whatsapp_messages
  for all to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists crm_wa_notes_select on public.crm_whatsapp_internal_notes;
create policy crm_wa_notes_select on public.crm_whatsapp_internal_notes
  for select to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists crm_wa_notes_write on public.crm_whatsapp_internal_notes;
create policy crm_wa_notes_write on public.crm_whatsapp_internal_notes
  for all to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists crm_wa_canned_select on public.crm_whatsapp_canned_responses;
create policy crm_wa_canned_select on public.crm_whatsapp_canned_responses
  for select to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists crm_wa_canned_write on public.crm_whatsapp_canned_responses;
create policy crm_wa_canned_write on public.crm_whatsapp_canned_responses
  for all to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists crm_wa_broadcasts_select on public.crm_whatsapp_broadcasts;
create policy crm_wa_broadcasts_select on public.crm_whatsapp_broadcasts
  for select to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists crm_wa_broadcasts_write on public.crm_whatsapp_broadcasts;
create policy crm_wa_broadcasts_write on public.crm_whatsapp_broadcasts
  for all to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists crm_wa_chatbots_select on public.crm_whatsapp_chatbots;
create policy crm_wa_chatbots_select on public.crm_whatsapp_chatbots
  for select to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists crm_wa_chatbots_write on public.crm_whatsapp_chatbots;
create policy crm_wa_chatbots_write on public.crm_whatsapp_chatbots
  for all to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists crm_wa_links_select on public.crm_whatsapp_links;
create policy crm_wa_links_select on public.crm_whatsapp_links
  for select to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists crm_wa_links_write on public.crm_whatsapp_links;
create policy crm_wa_links_write on public.crm_whatsapp_links
  for all to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists crm_guardrails_select on public.crm_tenant_guardrails;
create policy crm_guardrails_select on public.crm_tenant_guardrails
  for select to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists crm_guardrails_write on public.crm_tenant_guardrails;
create policy crm_guardrails_write on public.crm_tenant_guardrails
  for all to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());
