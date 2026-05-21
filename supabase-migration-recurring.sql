-- Execute este SQL no Supabase SQL Editor (https://supabase.com/dashboard)
-- Migração: Transações Recorrentes

-- 1. Tabela de templates de recorrência
create table if not exists recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  description text not null,
  type text not null check (type in ('Receita', 'Despesa')),
  category_id uuid references categories(id) on delete set null,
  amount numeric(12,2) not null default 0,
  frequency text not null default 'Mensal' check (frequency in ('Mensal', 'Bimestral', 'Trimestral', 'Anual')),
  period text not null default 'Final do Mês' check (period in ('Quinzena', 'Final do Mês')),
  day_of_month integer not null default 1 check (day_of_month between 1 and 28),
  payment_method text default 'Pix',
  origin text,
  start_month integer not null check (start_month between 1 and 12),
  start_year integer not null,
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Referência nas transactions para rastrear origem da recorrência
alter table transactions
  add column if not exists recurring_id uuid references recurring_transactions(id) on delete set null;

-- 3. RLS
alter table recurring_transactions enable row level security;
create policy "Users see own recurring" on recurring_transactions for all using (auth.uid() = user_id);

-- 4. Índices
create index if not exists idx_recurring_user on recurring_transactions(user_id);
create index if not exists idx_transactions_recurring on transactions(recurring_id);
