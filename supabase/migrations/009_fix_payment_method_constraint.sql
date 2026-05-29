-- =============================================================================
-- Migration 009: Corrigir constraint de payment_method
-- Adiciona 'Conta/Pix' que estava no frontend mas faltava na constraint
-- Cole no Supabase Dashboard > SQL Editor > Run (produção e homologação)
-- =============================================================================

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS chk_tx_payment_method;

ALTER TABLE public.transactions
  ADD CONSTRAINT chk_tx_payment_method
  CHECK (
    payment_method IN ('Pix', 'Conta/Pix', 'Cartão', 'Dinheiro', 'Boleto', 'TED', 'DOC', 'Outro')
    OR payment_method IS NULL
  );
