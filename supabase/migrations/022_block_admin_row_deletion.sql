-- Migration 022: Bloqueia a exclusão da conta administradora em nível de banco
-- As proteções anteriores (019, 020) só cobrem exclusão feita através das nossas
-- funções (admin_delete_user, delete_my_account). Elas não impedem exclusão feita
-- direto no painel do Supabase (Authentication > Users > Delete) ou via API com a
-- service_role key, que apagam auth.users diretamente sem passar pelo nosso código.
-- Este trigger roda dentro do próprio Postgres e intercepta QUALQUER DELETE na
-- linha do admin, seja qual for a origem.
CREATE OR REPLACE FUNCTION public.prevent_admin_user_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.email = COALESCE(current_setting('app.settings.admin_email', true), 'sidejoao89@gmail.com') THEN
    RAISE EXCEPTION 'Não é permitido excluir a conta administradora (proteção de banco).';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_admin_user_deletion ON auth.users;
CREATE TRIGGER trg_prevent_admin_user_deletion
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_admin_user_deletion();
