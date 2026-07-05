-- Migration 021: admin_list_users nunca mostra prazo/trial para a conta administradora
-- O admin tem acesso vitalício (forçado no frontend via isAdmin em PlanContext),
-- mas o painel /admin listava o valor cru de user_settings, mostrando "Free" e
-- "Prazo Pagamento" com contagem regressiva para o próprio admin.
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id               uuid,
  email            text,
  created_at       timestamptz,
  plan             text,
  plan_activated_at timestamptz,
  plan_expires_at  timestamptz,
  trial_expires_at timestamptz,
  is_banned        boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_admin_email text := COALESCE(current_setting('app.settings.admin_email', true), 'sidejoao89@gmail.com');
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    u.created_at,
    CASE WHEN u.email = v_admin_email THEN 'pro' ELSE COALESCE(s.plan, 'free') END::text AS plan,
    s.plan_activated_at,
    CASE WHEN u.email = v_admin_email THEN NULL ELSE s.plan_expires_at END  AS plan_expires_at,
    CASE WHEN u.email = v_admin_email THEN NULL ELSE s.trial_expires_at END AS trial_expires_at,
    COALESCE(u.banned_until > NOW(), false) AS is_banned
  FROM auth.users u
  LEFT JOIN public.user_settings s ON s.user_id = u.id
  ORDER BY u.created_at DESC;
END;
$$;
