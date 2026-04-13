-- Migration: create rv_contas table and add origem_conta_id to rv_lancamentos
-- Run this BEFORE deploying the new contas page and aporte modal.

-- ============================================================
-- rv_contas — bank/personal accounts used as origin for aportes
-- ============================================================
create table if not exists rv_contas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  nome        text not null,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists idx_rv_contas_user_id on rv_contas(user_id);

alter table rv_contas enable row level security;

create policy "Users can manage their own accounts"
  on rv_contas
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- rv_lancamentos — add origem_conta_id column for aporte source
-- ============================================================
alter table rv_lancamentos
  add column if not exists origem_conta_id uuid references rv_contas(id) on delete set null;

create index if not exists idx_rv_lancamentos_origem_conta_id
  on rv_lancamentos(origem_conta_id);
