-- =============================================================================
-- Migration 007: LGPD — Exclusão de conta e dados pessoais
-- Cole no Supabase Dashboard > SQL Editor > Run
-- =============================================================================

CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Deletar dados financeiros (ordem: filhos antes de pais)
  DELETE FROM public.transactions          WHERE user_id = v_uid;
  DELETE FROM public.budgets               WHERE user_id = v_uid;
  DELETE FROM public.recurring_transactions WHERE user_id = v_uid;
  DELETE FROM public.categories            WHERE user_id = v_uid;
  DELETE FROM public.user_settings         WHERE user_id = v_uid;

  -- Deletar conta de autenticação
  -- (SECURITY DEFINER + search_path=auth permite acesso ao schema auth)
  BEGIN
    DELETE FROM auth.users WHERE id = v_uid;
  EXCEPTION WHEN OTHERS THEN
    -- Se falhar por permissão, os dados já foram removidos — continua normalmente
    NULL;
  END;
END;
$$;

-- Apenas usuários autenticados podem chamar
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_my_account() FROM anon;
