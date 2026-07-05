-- Migration 020: Bloqueia autoexclusão da conta administradora (LGPD self-delete)
-- A migration 019 só protege exclusão via painel admin; delete_my_account() (Configurações)
-- não tinha nenhuma verificação e permitia o próprio admin apagar a conta.
CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;

  IF v_email = current_setting('app.settings.admin_email', true) OR v_email = 'sidejoao89@gmail.com' THEN
    RAISE EXCEPTION 'Não é permitido excluir a conta administradora.';
  END IF;

  DELETE FROM public.transactions            WHERE user_id = v_uid;
  DELETE FROM public.budgets                 WHERE user_id = v_uid;
  DELETE FROM public.recurring_transactions  WHERE user_id = v_uid;
  DELETE FROM public.categories              WHERE user_id = v_uid;
  DELETE FROM public.user_settings           WHERE user_id = v_uid;

  BEGIN
    DELETE FROM auth.users WHERE id = v_uid;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_my_account() FROM anon;
