-- =============================================================================
-- Migration 014: Função para verificar se e-mail já está cadastrado
-- Necessária para bloquear duplicidade de e-mail no signup
-- Cole no Supabase Dashboard > SQL Editor > Run (produção e homologação)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.check_email_exists(check_email TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE LOWER(email) = LOWER(TRIM(check_email))
  );
END;
$$;

-- Permite que usuários não autenticados (anon) chamem a função
-- necessário pois o signup acontece antes de estar logado
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO anon, authenticated;
