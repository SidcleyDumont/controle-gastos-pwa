-- =============================================================================
-- Migration 008: Adicionar coluna recurring_id em transactions
-- Cole no Supabase Dashboard > SQL Editor > Run (produção e homologação)
-- =============================================================================

-- Adiciona a coluna se ainda não existir
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS recurring_id UUID
    REFERENCES public.recurring_transactions(id) ON DELETE SET NULL;

-- Índice para performance nas queries de recorrentes
CREATE INDEX IF NOT EXISTS idx_transactions_recurring_id
  ON public.transactions(recurring_id)
  WHERE recurring_id IS NOT NULL;
