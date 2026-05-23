-- =============================================================================
-- Migration 001: Constraints de segurança nas tabelas
-- Como aplicar: Cole este SQL no Supabase Dashboard > SQL Editor > Run
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TABELA: transactions
-- -----------------------------------------------------------------------------

-- Valores monetários não podem ser negativos
ALTER TABLE transactions
  ADD CONSTRAINT chk_tx_original_value_positive
    CHECK (original_value >= 0),
  ADD CONSTRAINT chk_tx_income_value_positive
    CHECK (income_value >= 0),
  ADD CONSTRAINT chk_tx_expense_value_positive
    CHECK (expense_value >= 0);

-- Enums válidos para campos críticos
ALTER TABLE transactions
  ADD CONSTRAINT chk_tx_type
    CHECK (type IN ('Receita', 'Despesa')),
  ADD CONSTRAINT chk_tx_period
    CHECK (period IN ('Quinzena', 'Final do Mês')),
  ADD CONSTRAINT chk_tx_status
    CHECK (status IN ('Pago', 'A pagar', 'Recebido', 'Pendente')),
  ADD CONSTRAINT chk_tx_payment_method
    CHECK (payment_method IN ('Pix', 'Cartão', 'Dinheiro', 'Boleto', 'TED', 'DOC', 'Outro') OR payment_method IS NULL);

-- Limite de tamanho em campos de texto livre
ALTER TABLE transactions
  ADD CONSTRAINT chk_tx_description_length
    CHECK (char_length(description) BETWEEN 1 AND 200),
  ADD CONSTRAINT chk_tx_origin_length
    CHECK (origin IS NULL OR char_length(origin) <= 100);

-- Mês e ano devem ser valores razoáveis
ALTER TABLE transactions
  ADD CONSTRAINT chk_tx_month_range
    CHECK (month BETWEEN 1 AND 12),
  ADD CONSTRAINT chk_tx_year_range
    CHECK (year BETWEEN 2000 AND 2100);

-- Consistência: se type = Receita, expense_value deve ser 0 (e vice-versa)
ALTER TABLE transactions
  ADD CONSTRAINT chk_tx_value_consistency
    CHECK (
      (type = 'Receita' AND expense_value = 0 AND income_value >= 0) OR
      (type = 'Despesa' AND income_value = 0 AND expense_value >= 0)
    );

-- -----------------------------------------------------------------------------
-- TABELA: budgets
-- -----------------------------------------------------------------------------

ALTER TABLE budgets
  ADD CONSTRAINT chk_budget_amount_positive
    CHECK (amount > 0),
  ADD CONSTRAINT chk_budget_period
    CHECK (period IN ('Mensal', 'Quinzenal'));

-- -----------------------------------------------------------------------------
-- TABELA: recurring_transactions
-- -----------------------------------------------------------------------------

ALTER TABLE recurring_transactions
  ADD CONSTRAINT chk_rec_amount_positive
    CHECK (amount > 0),
  ADD CONSTRAINT chk_rec_type
    CHECK (type IN ('Receita', 'Despesa')),
  ADD CONSTRAINT chk_rec_frequency
    CHECK (frequency IN ('Mensal', 'Bimestral', 'Trimestral', 'Anual')),
  ADD CONSTRAINT chk_rec_period
    CHECK (period IN ('Quinzena', 'Final do Mês')),
  ADD CONSTRAINT chk_rec_day_of_month
    CHECK (day_of_month BETWEEN 1 AND 28),
  ADD CONSTRAINT chk_rec_start_month
    CHECK (start_month BETWEEN 1 AND 12),
  ADD CONSTRAINT chk_rec_start_year
    CHECK (start_year BETWEEN 2000 AND 2100),
  ADD CONSTRAINT chk_rec_description_length
    CHECK (char_length(description) BETWEEN 1 AND 200);

-- -----------------------------------------------------------------------------
-- TABELA: categories
-- -----------------------------------------------------------------------------

ALTER TABLE categories
  ADD CONSTRAINT chk_cat_type
    CHECK (type IN ('Receita', 'Despesa')),
  ADD CONSTRAINT chk_cat_name_length
    CHECK (char_length(name) BETWEEN 1 AND 100),
  ADD CONSTRAINT chk_cat_usage_length
    CHECK (usage IS NULL OR char_length(usage) <= 50),
  ADD CONSTRAINT chk_cat_notes_length
    CHECK (notes IS NULL OR char_length(notes) <= 300);

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY — confirmar que está ativo em todas as tabelas
-- (Se já estiver ativo, esses comandos são idempotentes)
-- -----------------------------------------------------------------------------

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

-- Verificar políticas existentes (só visualização — não cria duplicata)
-- SELECT schemaname, tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
