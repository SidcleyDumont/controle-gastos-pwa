-- Execute este SQL no Supabase SQL Editor (https://supabase.com/dashboard)

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('Receita', 'Despesa')),
  name text not null,
  usage text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  month integer not null,
  year integer not null,
  period text not null check (period in ('Quinzena', 'Final do Mês')),
  type text not null check (type in ('Receita', 'Despesa')),
  description text not null,
  category_id uuid references categories(id) on delete set null,
  original_value numeric(12,2) not null default 0,
  income_value numeric(12,2) not null default 0,
  expense_value numeric(12,2) not null default 0,
  status text not null default 'A pagar' check (status in ('Pago', 'A pagar', 'Recebido', 'Pendente')),
  payment_method text default 'Pix',
  origin text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row Level Security
alter table categories enable row level security;
alter table transactions enable row level security;

create policy "Users see own categories" on categories for all using (auth.uid() = user_id);
create policy "Users see own transactions" on transactions for all using (auth.uid() = user_id);

-- Indexes
create index if not exists idx_transactions_user_month on transactions(user_id, month, year);
create index if not exists idx_transactions_user_date on transactions(user_id, date);
create index if not exists idx_categories_user on categories(user_id);
