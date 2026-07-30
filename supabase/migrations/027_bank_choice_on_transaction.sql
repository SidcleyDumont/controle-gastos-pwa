-- Migration 027: Banco a descontar agora é escolhido diretamente no lançamento,
-- não mais vinculado pela categoria — uma categoria genérica ("Outros Bancos")
-- pode ter lançamentos descontando de bancos diferentes, então o vínculo fixo
-- por categoria não fazia sentido.
--
-- transactions.bank_id (criado na migration 025) continua existindo e é quem
-- os triggers tx_bank_effect / tx_apply_bank_balance usam — só deixa de ser
-- preenchido automaticamente a partir da categoria e passa a vir direto do
-- formulário de lançamento.

DROP TRIGGER IF EXISTS trg_tx_set_bank_id ON public.transactions;
DROP FUNCTION IF EXISTS public.tx_set_bank_id();

ALTER TABLE public.categories DROP COLUMN IF EXISTS bank_id;
