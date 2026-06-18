-- Migration 019: Protege conta administradora de exclusão acidental
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  target_email TEXT;
BEGIN
  SELECT email INTO target_email FROM auth.users WHERE id = target_user_id;

  IF target_email = current_setting('app.settings.admin_email', true) OR target_email = 'sidejoao89@gmail.com' THEN
    RAISE EXCEPTION 'Não é permitido excluir a conta administradora.';
  END IF;

  DELETE FROM public.transactions            WHERE user_id = target_user_id;
  DELETE FROM public.budgets                 WHERE user_id = target_user_id;
  DELETE FROM public.recurring_transactions  WHERE user_id = target_user_id;
  DELETE FROM public.categories              WHERE user_id = target_user_id;
  DELETE FROM public.user_settings           WHERE user_id = target_user_id;

  BEGIN
    DELETE FROM auth.users WHERE id = target_user_id;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;
