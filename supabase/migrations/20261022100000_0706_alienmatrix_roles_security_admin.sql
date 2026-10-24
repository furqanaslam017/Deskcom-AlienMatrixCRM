-- manifest: **AlienMatrix Phase 3 — Roles, Security, Admin & Localization.** Adiciona papéis e permissões customizadas granulares (crm_custom_roles, crm_role_assignments), configurações de segurança e SSO corporativo (crm_security_settings), lixeira e recuperação de dados excluídos (crm_soft_deletes), e preferências avançadas de tenant com marca e suporte multilíngue inglês/urdu/árabe/português (crm_tenant_settings). RLS estrita por `fn_user_org_ids()`. Aditiva e idempotente; apêndice no `baseline.sql`.
-- ============================================================================
-- 0706 — ALIENMATRIX PHASE 3: ROLES, SECURITY, ADMIN & LOCALIZATION
-- ============================================================================

-- 1. PAPÉIS E PERMISSÕES CUSTOMIZADAS (CUSTOM ROLES & PERMISSIONS)
create table if not exists public.crm_custom_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  permissions jsonb not null default '{}'::jsonb,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_crm_custom_roles_slug unique (organization_id, slug)
);

create index if not exists idx_crm_custom_roles_org on public.crm_custom_roles (organization_id);

-- 2. ATRIBUIÇÃO DE PAPÉIS A USUÁRIOS
create table if not exists public.crm_role_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null,
  custom_role_id uuid not null references public.crm_custom_roles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint uq_crm_role_assignments unique (organization_id, user_id, custom_role_id)
);

create index if not exists idx_crm_role_assignments_org_user on public.crm_role_assignments (organization_id, user_id);

-- 3. SEGURANÇA E SSO CORPORATIVO (SECURITY & SSO)
create table if not exists public.crm_security_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  enforce_2fa boolean not null default false,
  sso_provider text not null default 'none' check (sso_provider in ('none', 'google', 'microsoft', 'saml_oidc')),
  sso_domain text,
  sso_client_id text,
  sso_metadata_url text,
  session_timeout_minutes integer not null default 1440,
  allowed_ip_ranges text[] not null default '{}',
  updated_at timestamptz not null default now(),
  constraint uq_crm_security_settings_org unique (organization_id)
);

create index if not exists idx_crm_security_settings_org on public.crm_security_settings (organization_id);

-- 4. LIXEIRA E SOFT DELETE / RESTORE
create table if not exists public.crm_soft_deletes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  entity_type text not null, -- 'lead', 'contact', 'product', 'invoice', 'custom_record'
  entity_id uuid not null,
  entity_name text not null,
  entity_data jsonb not null default '{}'::jsonb,
  deleted_by_user_id uuid,
  deleted_at timestamptz not null default now(),
  restored_at timestamptz
);

create index if not exists idx_crm_soft_deletes_org on public.crm_soft_deletes (organization_id, entity_type);
create index if not exists idx_crm_soft_deletes_restored on public.crm_soft_deletes (organization_id, restored_at);

-- 5. PREFERÊNCIAS DE TENANT, MARCA E LOCALIZAÇÃO (TENANT SETTINGS & LOCALIZATION)
create table if not exists public.crm_tenant_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  brand_name text,
  logo_url text,
  primary_color_hex text not null default '#2563eb',
  accent_color_hex text not null default '#3b82f6',
  custom_domain text,
  timezone text not null default 'UTC',
  currency text not null default 'USD',
  language text not null default 'en' check (language in ('en', 'ur', 'ar', 'pt-BR')),
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint uq_crm_tenant_settings_org unique (organization_id)
);

create index if not exists idx_crm_tenant_settings_org on public.crm_tenant_settings (organization_id);

-- 6. ATIVAÇÃO DE ROW LEVEL SECURITY (RLS)
alter table public.crm_custom_roles enable row level security;
alter table public.crm_role_assignments enable row level security;
alter table public.crm_security_settings enable row level security;
alter table public.crm_soft_deletes enable row level security;
alter table public.crm_tenant_settings enable row level security;

-- 7. POLÍTICAS DE RLS (SELECT)
drop policy if exists "crm_custom_roles_select" on public.crm_custom_roles;
create policy "crm_custom_roles_select" on public.crm_custom_roles
  for select to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists "crm_role_assignments_select" on public.crm_role_assignments;
create policy "crm_role_assignments_select" on public.crm_role_assignments
  for select to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists "crm_security_settings_select" on public.crm_security_settings;
create policy "crm_security_settings_select" on public.crm_security_settings
  for select to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists "crm_soft_deletes_select" on public.crm_soft_deletes;
create policy "crm_soft_deletes_select" on public.crm_soft_deletes
  for select to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists "crm_tenant_settings_select" on public.crm_tenant_settings;
create policy "crm_tenant_settings_select" on public.crm_tenant_settings
  for select to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

-- 8. POLÍTICAS DE RLS (WRITE)
drop policy if exists "crm_custom_roles_write" on public.crm_custom_roles;
create policy "crm_custom_roles_write" on public.crm_custom_roles
  for all to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full())
  with check ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full());

drop policy if exists "crm_role_assignments_write" on public.crm_role_assignments;
create policy "crm_role_assignments_write" on public.crm_role_assignments
  for all to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full())
  with check ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full());

drop policy if exists "crm_security_settings_write" on public.crm_security_settings;
create policy "crm_security_settings_write" on public.crm_security_settings
  for all to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full())
  with check ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full());

drop policy if exists "crm_soft_deletes_write" on public.crm_soft_deletes;
create policy "crm_soft_deletes_write" on public.crm_soft_deletes
  for all to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full())
  with check ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full());

drop policy if exists "crm_tenant_settings_write" on public.crm_tenant_settings;
create policy "crm_tenant_settings_write" on public.crm_tenant_settings
  for all to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full())
  with check ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full());
