-- Migration 025: Vincula categoria de despesa a um banco (Outros Bancos) e
-- desconta automaticamente o saldo quando a despesa daquela categoria for paga.
--
-- Regras:
--   - Só desconta quando a categoria da despesa tem bank_id vinculado.
--   - Só desconta quando status = 'Pago' (despesas "A pagar" não afetam o saldo).
--   - Editar valor/categoria/status ou excluir a despesa ajusta o saldo automaticamente
--     (reverte o efeito antigo e aplica o novo, via trigger — funciona mesmo se os
--     dados forem alterados fora do app).
--   - transactions.bank_id é um SNAPSHOT do vínculo da categoria no momento do
--     insert/update — se depois a categoria for religada a outro banco, lançamentos
--     antigos não são retroativamente movidos, só os novos/editados.

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS bank_id uuid REFERENCES public.bank_balances(id) ON DELETE SET NULL;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS bank_id uuid REFERENCES public.bank_balances(id) ON DELETE SET NULL;

-- Snapshota o bank_id da categoria escolhida antes de gravar a transação
CREATE OR REPLACE FUNCTION public.tx_set_bank_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.type = 'Despesa' AND NEW.category_id IS NOT NULL THEN
    SELECT bank_id INTO NEW.bank_id FROM public.categories WHERE id = NEW.category_id;
  ELSE
    NEW.bank_id := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tx_set_bank_id ON public.transactions;
CREATE TRIGGER trg_tx_set_bank_id
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.tx_set_bank_id();

-- Quanto essa linha de transação "vale" pro saldo do banco vinculado
-- (negativo = desconta; linhas apagadas/soft-deleted/não-pagas/sem banco valem 0)
CREATE OR REPLACE FUNCTION public.tx_bank_effect(t public.transactions)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN t.manually_deleted THEN 0
    WHEN t.type = 'Despesa' AND t.status = 'Pago' AND t.bank_id IS NOT NULL THEN -t.expense_value
    ELSE 0
  END;
$$;

-- Reverte o efeito antigo (update/delete) e aplica o novo (insert/update)
CREATE OR REPLACE FUNCTION public.tx_apply_bank_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    IF OLD.bank_id IS NOT NULL THEN
      UPDATE public.bank_balances SET balance = balance - public.tx_bank_effect(OLD) WHERE id = OLD.bank_id;
    END IF;
  END IF;

  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    IF NEW.bank_id IS NOT NULL THEN
      UPDATE public.bank_balances SET balance = balance + public.tx_bank_effect(NEW) WHERE id = NEW.bank_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_tx_apply_bank_balance ON public.transactions;
CREATE TRIGGER trg_tx_apply_bank_balance
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.tx_apply_bank_balance();
