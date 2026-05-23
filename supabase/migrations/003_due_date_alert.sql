-- =============================================================================
-- Migration 003 — Vencimento de despesas (due_date + alert_sent)
-- Cole no Supabase SQL Editor e clique em Run
-- =============================================================================

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS due_date DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS alert_sent BOOLEAN NOT NULL DEFAULT FALSE;

-- Índice para a Edge Function encontrar vencimentos rapidamente
CREATE INDEX IF NOT EXISTS idx_transactions_due_alert
  ON transactions(due_date, alert_sent)
  WHERE due_date IS NOT NULL;

-- due_date só faz sentido em Despesas
ALTER TABLE transactions
  ADD CONSTRAINT chk_tx_due_date_despesa
  CHECK (due_date IS NULL OR type = 'Despesa');
