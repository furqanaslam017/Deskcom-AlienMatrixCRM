-- manifest: 0710_alienmatrix_analytics_and_billing
-- AlienMatrix Phase 7: Analytics, Dashboards and Billing
-- Pipeline forecast, conversion funnels, custom reports, scheduled deliveries, billing plan tiers and subscription management.

-- 1. Analytics Reports
create table if not exists public.crm_analytics_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  report_type text not null default 'sales_funnel',
  parameters jsonb not null default '{}'::jsonb,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Scheduled Reports
create table if not exists public.crm_scheduled_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  report_id uuid references public.crm_analytics_reports(id) on delete cascade,
  frequency text not null default 'weekly',
  recipient_emails text[] not null default '{}'::text[],
  format text not null default 'pdf',
  is_active boolean not null default true,
  last_sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- 3. Billing Plans (Catalog)
create table if not exists public.crm_billing_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  price_monthly_cents integer not null default 0,
  price_yearly_cents integer not null default 0,
  currency text not null default 'BRL',
  max_seats integer not null default 5,
  max_whatsapp_numbers integer not null default 2,
  monthly_ai_tokens bigint not null default 2000000,
  max_custom_objects integer not null default 10,
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 4. Tenant Subscriptions
create table if not exists public.crm_tenant_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade unique,
  plan_id uuid references public.crm_billing_plans(id) on delete restrict,
  status text not null default 'trialing',
  payment_provider text not null default 'stripe',
  billing_cycle text not null default 'monthly',
  trial_ends_at timestamptz,
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null default (now() + interval '30 days'),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for fast query performance
create index if not exists idx_crm_analytics_reports_org on public.crm_analytics_reports(organization_id);
create index if not exists idx_crm_scheduled_reports_org on public.crm_scheduled_reports(organization_id);
create index if not exists idx_crm_tenant_subscriptions_org on public.crm_tenant_subscriptions(organization_id);

-- Enable RLS
alter table public.crm_analytics_reports enable row level security;
alter table public.crm_scheduled_reports enable row level security;
alter table public.crm_billing_plans enable row level security;
alter table public.crm_tenant_subscriptions enable row level security;

-- Policies for crm_analytics_reports
drop policy if exists "analytics_reports_isolation" on public.crm_analytics_reports;
create policy "analytics_reports_isolation" on public.crm_analytics_reports
  for all using (
    organization_id in (select public.fn_user_org_ids()) or public.fn_is_platform_admin()
  );

-- Policies for crm_scheduled_reports
drop policy if exists "scheduled_reports_isolation" on public.crm_scheduled_reports;
create policy "scheduled_reports_isolation" on public.crm_scheduled_reports
  for all using (
    organization_id in (select public.fn_user_org_ids()) or public.fn_is_platform_admin()
  );

-- Policies for crm_billing_plans (viewable by all authenticated users, editable by platform admin)
drop policy if exists "billing_plans_select" on public.crm_billing_plans;
create policy "billing_plans_select" on public.crm_billing_plans
  for select using (auth.role() = 'authenticated');

drop policy if exists "billing_plans_platform_admin" on public.crm_billing_plans;
create policy "billing_plans_platform_admin" on public.crm_billing_plans
  for all using (public.fn_is_platform_admin());

-- Policies for crm_tenant_subscriptions
drop policy if exists "tenant_subscriptions_isolation" on public.crm_tenant_subscriptions;
create policy "tenant_subscriptions_isolation" on public.crm_tenant_subscriptions
  for all using (
    organization_id in (select public.fn_user_org_ids()) or public.fn_is_platform_admin()
  );
