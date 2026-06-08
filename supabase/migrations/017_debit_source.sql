-- Campo que indica de qual saldo descontar a despesa:
--   'Mês Atual'    → desconta da receita do mês vigente (padrão)
--   'Mês Anterior' → desconta do saldo acumulado de meses anteriores
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS debit_source TEXT
    NOT NULL DEFAULT 'Mês Atual'
    CHECK (debit_source IN ('Mês Atual', 'Mês Anterior'));
