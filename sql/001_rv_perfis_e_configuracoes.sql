-- Migration: create rv_perfis and rv_configuracoes tables
-- Run this BEFORE deploying the new perfis/configuracoes pages.

-- ============================================================
-- rv_perfis — profiles for variable income (e.g. motorista, confeitaria)
-- ============================================================
create table if not exists rv_perfis (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  nome        text not null,
  descricao   text,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists idx_rv_perfis_user_id on rv_perfis(user_id);

alter table rv_perfis enable row level security;

create policy "Users can manage their own profiles"
  on rv_perfis
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- rv_configuracoes — per-user preferences for the RV module
-- ============================================================
create table if not exists rv_configuracoes (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  perfil_padrao_id  uuid references rv_perfis(id) on delete set null,
  horas_padrao      text,
  meta_mensal       numeric(12,2),
  moeda             text not null default 'BRL',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint rv_configuracoes_user_id_unique unique (user_id)
);

create index if not exists idx_rv_configuracoes_user_id on rv_configuracoes(user_id);

alter table rv_configuracoes enable row level security;

create policy "Users can manage their own settings"
  on rv_configuracoes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
