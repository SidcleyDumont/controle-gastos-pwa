-- Execute este SQL no Supabase SQL Editor (https://supabase.com/dashboard)
-- Migração: Tabela de orçamentos por categoria

create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id uuid references categories(id) on delete cascade,
  period text not null default 'Mensal' check (period in ('Mensal', 'Quinzenal')),
  amount numeric(12,2) not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, category_id, period)
);

alter table budgets enable row level security;

create policy "Users see own budgets" on budgets for all using (auth.uid() = user_id);

create index if not exists idx_budgets_user on budgets(user_id);
create index if not exists idx_budgets_category on budgets(category_id);
