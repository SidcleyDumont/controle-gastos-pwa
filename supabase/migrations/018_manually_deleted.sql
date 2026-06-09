-- Permite marcar lançamentos recorrentes como "apagado pelo usuário"
-- sem removê-los fisicamente, evitando que o generatePending os recrie.
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS manually_deleted BOOLEAN NOT NULL DEFAULT FALSE;
