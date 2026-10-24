-- manifest: **AlienMatrix Phase 1 — Motor genérico de Custom Objects, Custom Fields, Relações, Views e Templates de Indústria.** Permite que qualquer organização modele o CRM para seu segmento de mercado (imobiliária: Imóveis/Lotes; escola: Alunos/Cursos; clínica: Pacientes/Prontuários; agência: Projetos/Contratos; varejo: Pedidos/Produtos). Tabelas tenant-aware com RLS estrita por `fn_user_org_ids()` e `fn_is_platform_admin()`. Aditiva e idempotente; apêndice no `baseline.sql`.
-- ============================================================================
-- 0704 — ALIENMATRIX PHASE 1: GENERIC CUSTOM OBJECTS ENGINE
-- ============================================================================

-- 1. TABELA DE OBJETOS CUSTOMIZADOS (CUSTOM OBJECTS)
create table if not exists public.custom_objects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  slug text not null,
  name text not null,
  singular_name text not null,
  plural_name text not null,
  description text,
  icon text not null default 'Cube',
  is_system boolean not null default false,
  primary_field_slug text not null default 'name',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_custom_objects_org_slug unique (organization_id, slug)
);

create index if not exists idx_custom_objects_org on public.custom_objects (organization_id);

-- 2. TABELA DE CAMPOS CUSTOMIZADOS (CUSTOM FIELDS)
create table if not exists public.custom_fields (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  object_id uuid not null references public.custom_objects (id) on delete cascade,
  slug text not null,
  label text not null,
  field_type text not null check (
    field_type in (
      'text', 'long_text', 'number', 'currency', 'date', 'datetime',
      'boolean', 'select', 'multi_select', 'email', 'phone', 'url',
      'file', 'relation', 'user'
    )
  ),
  description text,
  is_required boolean not null default false,
  is_unique boolean not null default false,
  default_value jsonb,
  options jsonb not null default '[]'::jsonb,
  relation_target_object_id uuid references public.custom_objects (id) on delete set null,
  validation_rules jsonb not null default '{}'::jsonb,
  position numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_custom_fields_object_slug unique (object_id, slug)
);

create index if not exists idx_custom_fields_org_obj on public.custom_fields (organization_id, object_id);

-- 3. TABELA DE REGISTROS CUSTOMIZADOS (CUSTOM RECORDS)
create table if not exists public.custom_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  object_id uuid not null references public.custom_objects (id) on delete cascade,
  title text not null,
  values jsonb not null default '{}'::jsonb,
  created_by_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_custom_records_org_obj on public.custom_records (organization_id, object_id);
create index if not exists idx_custom_records_values on public.custom_records using gin (values);

-- 4. TABELA DE RELAÇÕES ENTRE OBJETOS (CUSTOM OBJECT RELATIONS)
create table if not exists public.custom_object_relations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  source_object_id uuid not null references public.custom_objects (id) on delete cascade,
  target_object_id uuid not null references public.custom_objects (id) on delete cascade,
  relation_type text not null check (relation_type in ('one_to_many', 'many_to_many', 'many_to_one')),
  slug text not null,
  label text not null,
  reverse_label text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_custom_obj_rel_source_slug unique (source_object_id, slug)
);

create index if not exists idx_custom_obj_rel_org on public.custom_object_relations (organization_id);

-- 5. TABELA DE VÍNCULOS ENTRE REGISTROS (CUSTOM RECORD RELATIONS)
create table if not exists public.custom_record_relations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  relation_id uuid not null references public.custom_object_relations (id) on delete cascade,
  source_record_id uuid not null references public.custom_records (id) on delete cascade,
  target_record_id uuid not null references public.custom_records (id) on delete cascade,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint uq_custom_rec_rel unique (relation_id, source_record_id, target_record_id)
);

create index if not exists idx_custom_rec_rel_source on public.custom_record_relations (source_record_id);
create index if not exists idx_custom_rec_rel_target on public.custom_record_relations (target_record_id);

-- 6. TABELA DE VISÕES SALVAS (CUSTOM VIEWS — TABLE, KANBAN, LIST)
create table if not exists public.custom_views (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  object_id uuid not null references public.custom_objects (id) on delete cascade,
  user_id uuid,
  name text not null,
  view_type text not null check (view_type in ('table', 'kanban', 'list')),
  config jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  position numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_custom_views_org_obj on public.custom_views (organization_id, object_id);

-- 7. ATIVAÇÃO DE ROW LEVEL SECURITY (RLS)
alter table public.custom_objects enable row level security;
alter table public.custom_fields enable row level security;
alter table public.custom_records enable row level security;
alter table public.custom_object_relations enable row level security;
alter table public.custom_record_relations enable row level security;
alter table public.custom_views enable row level security;

-- 8. POLÍTICAS DE RLS (SELECT)
drop policy if exists "custom_objects_select" on public.custom_objects;
create policy "custom_objects_select" on public.custom_objects
  for select to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists "custom_fields_select" on public.custom_fields;
create policy "custom_fields_select" on public.custom_fields
  for select to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists "custom_records_select" on public.custom_records;
create policy "custom_records_select" on public.custom_records
  for select to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists "custom_object_relations_select" on public.custom_object_relations;
create policy "custom_object_relations_select" on public.custom_object_relations
  for select to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists "custom_record_relations_select" on public.custom_record_relations;
create policy "custom_record_relations_select" on public.custom_record_relations
  for select to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

drop policy if exists "custom_views_select" on public.custom_views;
create policy "custom_views_select" on public.custom_views
  for select to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin());

-- 9. POLÍTICAS DE RLS (WRITE: INSERT, UPDATE, DELETE)
drop policy if exists "custom_objects_write" on public.custom_objects;
create policy "custom_objects_write" on public.custom_objects
  for all to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full())
  with check ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full());

drop policy if exists "custom_fields_write" on public.custom_fields;
create policy "custom_fields_write" on public.custom_fields
  for all to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full())
  with check ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full());

drop policy if exists "custom_records_write" on public.custom_records;
create policy "custom_records_write" on public.custom_records
  for all to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full())
  with check ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full());

drop policy if exists "custom_object_relations_write" on public.custom_object_relations;
create policy "custom_object_relations_write" on public.custom_object_relations
  for all to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full())
  with check ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full());

drop policy if exists "custom_record_relations_write" on public.custom_record_relations;
create policy "custom_record_relations_write" on public.custom_record_relations
  for all to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full())
  with check ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full());

drop policy if exists "custom_views_write" on public.custom_views;
create policy "custom_views_write" on public.custom_views
  for all to authenticated
  using ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full())
  with check ((organization_id in (select public.fn_user_org_ids())) or public.fn_is_platform_admin_full());
