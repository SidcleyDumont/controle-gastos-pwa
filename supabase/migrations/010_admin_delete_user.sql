-- =============================================================================
-- Migration 010: Admin — excluir usuário completamente
-- Cole no Supabase Dashboard > SQL Editor > Run (produção e homologação)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Deletar todos os dados financeiros
  DELETE FROM public.transactions          WHERE user_id = target_user_id;
  DELETE FROM public.budgets               WHERE user_id = target_user_id;
  DELETE FROM public.recurring_transactions WHERE user_id = target_user_id;
  DELETE FROM public.categories            WHERE user_id = target_user_id;
  DELETE FROM public.user_settings         WHERE user_id = target_user_id;

  -- Deletar conta de autenticação (e-mail fica livre para re-cadastro)
  BEGIN
    DELETE FROM auth.users WHERE id = target_user_id;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;
