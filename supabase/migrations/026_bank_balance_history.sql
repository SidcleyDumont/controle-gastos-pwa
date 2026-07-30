-- Migration 026: Histórico de alterações de saldo por banco
-- Registra automaticamente toda mudança em bank_balances.balance — seja pelo
-- desconto automático de despesas vinculadas (migration 025) ou por edição
-- manual do saldo pelo usuário — com o valor antes/depois e o motivo.

CREATE TABLE IF NOT EXISTS public.bank_balance_history (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_id        uuid NOT NULL REFERENCES public.bank_balances(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  balance_before numeric(12,2) NOT NULL,
  balance_after  numeric(12,2) NOT NULL,
  change_amount  numeric(12,2) NOT NULL,
  reason         text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bank_balance_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bank_balance_history: user reads own rows"
  ON public.bank_balance_history FOR SELECT
  USING (auth.uid() = user_id);

-- Só leitura pro usuário — inserção é sempre via trigger (SECURITY DEFINER)
GRANT SELECT ON public.bank_balance_history TO authenticated;

-- Loga toda alteração de saldo, venha de onde vier
CREATE OR REPLACE FUNCTION public.log_bank_balance_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reason text;
  v_tx_id  uuid;
BEGIN
  IF NEW.balance = OLD.balance THEN
    RETURN NEW;
  END IF;

  v_reason := current_setting('app.tx_reason', true);
  v_tx_id  := NULLIF(current_setting('app.tx_id', true), '')::uuid;

  INSERT INTO public.bank_balance_history
    (user_id, bank_id, transaction_id, balance_before, balance_after, change_amount, reason)
  VALUES
    (NEW.user_id, NEW.id, v_tx_id, OLD.balance, NEW.balance, NEW.balance - OLD.balance,
     COALESCE(v_reason, 'Ajuste manual do saldo'));

  -- Limpa pra não vazar pro próximo UPDATE dentro da mesma transação
  PERFORM set_config('app.tx_reason', '', true);
  PERFORM set_config('app.tx_id', '', true);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_bank_balance_change ON public.bank_balances;
CREATE TRIGGER trg_log_bank_balance_change
  AFTER UPDATE ON public.bank_balances
  FOR EACH ROW EXECUTE FUNCTION public.log_bank_balance_change();

-- Atualiza tx_apply_bank_balance (migration 025) pra registrar motivo + transação
-- antes de alterar o saldo, assim o histórico sabe qual lançamento causou a mudança
CREATE OR REPLACE FUNCTION public.tx_apply_bank_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    IF OLD.bank_id IS NOT NULL THEN
      PERFORM set_config('app.tx_reason', 'Lançamento: ' || OLD.description, true);
      PERFORM set_config('app.tx_id', OLD.id::text, true);
      UPDATE public.bank_balances SET balance = balance - public.tx_bank_effect(OLD) WHERE id = OLD.bank_id;
    END IF;
  END IF;

  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    IF NEW.bank_id IS NOT NULL THEN
      PERFORM set_config('app.tx_reason', 'Lançamento: ' || NEW.description, true);
      PERFORM set_config('app.tx_id', NEW.id::text, true);
      UPDATE public.bank_balances SET balance = balance + public.tx_bank_effect(NEW) WHERE id = NEW.bank_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;
