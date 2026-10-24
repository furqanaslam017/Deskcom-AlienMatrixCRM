-- manifest: **AlienMatrix Phase 2 — Core CRM Modules.** Adiciona catálogo de produtos nativo (crm_products, crm_price_lists), itens de negócio (crm_deal_products), faturas e orçamentos comerciais (crm_invoices, crm_invoice_items), registro de ligações e reuniões (crm_call_logs), anexos universais (crm_attachments) e trilha de conversão de leads (crm_lead_conversions). RLS estrita por `fn_user_org_ids()` e `fn_is_platform_admin()`. Aditiva e idempotente; apêndice no `baseline.sql`.
-- ============================================================================
-- 0705 — ALIENMATRIX PHASE 2: CORE CRM MODULES
-- ============================================================================

-- 1. CATÁLOGO DE PRODUTOS E SERVIÇOS (CRM PRODUCTS)
create table if not exists public.crm_products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  sku text,
  name text not null,
  description text,
  category text,
  unit_price_cents bigint not null default 0,
  currency text not null default 'USD',
  cost_price_cents bigint,
  tax_rate_percent numeric(5, 2) default 0.00,
  stock_quantity integer default 0,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_crm_products_sku unique (organization_id, sku)
);

create index if not exists idx_crm_products_org on public.crm_products (organization_id);

-- 2. TABELAS DE PREÇO (PRICE LISTS)
create table if not exists public.crm_price_lists (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  description text,
  currency text not null default 'USD',
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_crm_price_lists_org on public.crm_price_lists (organization_id);

create table if not exists public.crm_price_list_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  price_list_id uuid not null references public.crm_price_lists (id) on delete cascade,
  product_id uuid not null references public.crm_products (id) on delete cascade,
  unit_price_cents bigint not null,
  created_at timestamptz not null default now(),
  constraint uq_crm_price_list_item unique (price_list_id, product_id)
);

create index if not exists idx_crm_price_list_items_org on public.crm_price_list_items (organization_id);

-- 3. PRODUTOS ASSOCIADOS A NEGÓCIOS/LEADS (DEAL PRODUCTS)
create table if not exists public.crm_deal_products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  lead_id uuid not null references public.crm_leads (id) on delete cascade,
  product_id uuid references public.crm_products (id) on delete set null,
  product_name text not null,
  quantity numeric(10, 2) not null default 1.00,
  unit_price_cents bigint not null,
  currency text not null default 'USD',
  discount_cents bigint default 0,
  tax_rate_percent numeric(5, 2) default 0.00,
  total_cents bigint not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_crm_deal_products_lead on public.crm_deal_products (organization_id, lead_id);

-- 4. FATURAS E COBRANÇAS (CRM INVOICES & PROPOSALS)
create table if not exists public.crm_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  invoice_number text not null,
  kind text not null default 'invoice' check (kind in ('invoice', 'quote', 'proforma')),
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  lead_id uuid references public.crm_leads (id) on delete set null,
  contact_id uuid references public.contacts (id) on delete set null,
  company_id uuid references public.companies (id) on delete set null,
  title text not null,
  subtotal_cents bigint not null default 0,
  discount_cents bigint not null default 0,
  tax_cents bigint not null default 0,
  total_cents bigint not null default 0,
  currency text not null default 'USD',
  issue_date date not null default current_date,
  due_date date,
  paid_at timestamptz,
  notes text,
  payment_instructions text,
  payment_url text,
  pdf_storage_path text,
  created_by_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_crm_invoices_number unique (organization_id, invoice_number)
);

create index if not exists idx_crm_invoices_org on public.crm_invoices (organization_id);
create index if not exists idx_crm_invoices_lead on public.crm_invoices (lead_id);
create index if not exists idx_crm_invoices_contact on public.crm_invoices (contact_id);

-- 5. ITENS DA FATURA (INVOICE ITEMS)
create table if not exists public.crm_invoice_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  invoice_id uuid not null references public.crm_invoices (id) on delete cascade,
  product_id uuid references public.crm_products (id) on delete set null,
  description text not null,
  quantity numeric(10, 2) not null default 1.00,
  unit_price_cents bigint not null default 0,
  discount_cents bigint default 0,
  tax_rate_percent numeric(5, 2) default 0.00,
  total_cents bigint not null default 0,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_crm_invoice_items_invoice on public.crm_invoice_items (invoice_id);

-- 6. REGISTRO DE LIGAÇÕES, REUNIÕES E ATIVIDADES (CALL & MEETING LOGS)
create table if not exists public.crm_call_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  lead_id uuid references public.crm_leads (id) on delete set null,
  contact_id uuid references public.contacts (id) on delete set null,
  activity_type text not null default 'call' check (activity_type in ('call', 'meeting', 'demo', 'video_call', 'whatsapp_call')),
  direction text not null default 'outbound' check (direction in ('inbound', 'outbound')),
  outcome text not null default 'completed' check (outcome in ('connected', 'busy', 'no_answer', 'left_voicemail', 'completed', 'rescheduled', 'cancelled')),
  subject text not null,
  notes text,
  duration_seconds integer default 0,
  scheduled_at timestamptz,
  performed_at timestamptz not null default now(),
  performed_by_user_id uuid,
  recording_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_crm_call_logs_org on public.crm_call_logs (organization_id);
create index if not exists idx_crm_call_logs_lead on public.crm_call_logs (lead_id);
create index if not exists idx_crm_call_logs_contact on public.crm_call_logs (contact_id);

-- 7. ANEXOS UNIVERSAIS (DOCUMENTS & ATTACHMENTS)
create table if not exists public.crm_attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  entity_type text not null, -- 'lead', 'contact', 'company', 'custom_record', 'invoice'
  entity_id uuid not null,
  file_name text not null,
  file_size_bytes bigint not null,
  mime_type text not null,
  storage_path text not null,
  uploaded_by_user_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_crm_attachments_entity on public.crm_attachments (organization_id, entity_type, entity_id);

-- 8. TRILHA DE CONVERSÃO DE LEADS (LEAD CONVERSIONS)
create table if not exists public.crm_lead_conversions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  source_lead_id uuid not null references public.crm_leads (id) on delete cascade,
  target_contact_id uuid references public.contacts (id) on delete set null,
  target_company_id uuid references public.companies (id) on delete set null,
  target_deal_id uuid references public.crm_leads (id) on delete set null,
  converted_by_user_id uuid,
  notes text,
  converted_at timestamptz not null default now()
);

create index if not exists idx_crm_lead_conversions_org on public.crm_lead_conversions (organization_id);

-- 9. ATIVAÇÃO DE ROW LEVEL SECURITY (RLS)
alter table public.crm_products enable row level security;
alter table public.crm_price_lists enable row level security;
alter table public.crm_price_list_items enable row level security;
alter table public.crm_deal_products enable row level security;
alter table public.crm_invoices enable row level security;
alter table public.crm_invoice_items enable row level security;
alter table public.crm_call_logs enable row level security;
alter table public.crm_attachments enable row level security;
alter table public.crm_lead_conversions enable row level security;

-- 10. POLÍTICAS DE RLS (SELECT)
drop policy if exists "crm_products_select" on public.crm_products;
create policy "crm_products_select" on public.crm_products
  for select to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists "crm_price_lists_select" on public.crm_price_lists;
create policy "crm_price_lists_select" on public.crm_price_lists
  for select to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists "crm_price_list_items_select" on public.crm_price_list_items;
create policy "crm_price_list_items_select" on public.crm_price_list_items
  for select to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists "crm_deal_products_select" on public.crm_deal_products;
create policy "crm_deal_products_select" on public.crm_deal_products
  for select to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists "crm_invoices_select" on public.crm_invoices;
create policy "crm_invoices_select" on public.crm_invoices
  for select to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists "crm_invoice_items_select" on public.crm_invoice_items;
create policy "crm_invoice_items_select" on public.crm_invoice_items
  for select to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists "crm_call_logs_select" on public.crm_call_logs;
create policy "crm_call_logs_select" on public.crm_call_logs
  for select to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists "crm_attachments_select" on public.crm_attachments;
create policy "crm_attachments_select" on public.crm_attachments
  for select to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists "crm_lead_conversions_select" on public.crm_lead_conversions;
create policy "crm_lead_conversions_select" on public.crm_lead_conversions
  for select to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

-- 11. POLÍTICAS DE RLS (WRITE)
drop policy if exists "crm_products_write" on public.crm_products;
create policy "crm_products_write" on public.crm_products
  for all to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full())
  with check ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full());

drop policy if exists "crm_price_lists_write" on public.crm_price_lists;
create policy "crm_price_lists_write" on public.crm_price_lists
  for all to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full())
  with check ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full());

drop policy if exists "crm_price_list_items_write" on public.crm_price_list_items;
create policy "crm_price_list_items_write" on public.crm_price_list_items
  for all to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full())
  with check ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full());

drop policy if exists "crm_deal_products_write" on public.crm_deal_products;
create policy "crm_deal_products_write" on public.crm_deal_products
  for all to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full())
  with check ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full());

drop policy if exists "crm_invoices_write" on public.crm_invoices;
create policy "crm_invoices_write" on public.crm_invoices
  for all to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full())
  with check ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full());

drop policy if exists "crm_invoice_items_write" on public.crm_invoice_items;
create policy "crm_invoice_items_write" on public.crm_invoice_items
  for all to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full())
  with check ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full());

drop policy if exists "crm_call_logs_write" on public.crm_call_logs;
create policy "crm_call_logs_write" on public.crm_call_logs
  for all to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full())
  with check ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full());

drop policy if exists "crm_attachments_write" on public.crm_attachments;
create policy "crm_attachments_write" on public.crm_attachments
  for all to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full())
  with check ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full());

drop policy if exists "crm_lead_conversions_write" on public.crm_lead_conversions;
create policy "crm_lead_conversions_write" on public.crm_lead_conversions
  for all to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full())
  with check ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full());
