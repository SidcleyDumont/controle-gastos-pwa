-- =============================================================================
-- Migration 013: Atualizar admin_list_users para incluir trial_expires_at
-- Cole no Supabase Dashboard > SQL Editor > Run (produção e homologação)
-- =============================================================================

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
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    u.created_at,
    COALESCE(s.plan, 'free')::text          AS plan,
    s.plan_activated_at,
    s.plan_expires_at,
    s.trial_expires_at,
    COALESCE(u.banned_until > NOW(), false) AS is_banned
  FROM auth.users u
  LEFT JOIN public.user_settings s ON s.user_id = u.id
  ORDER BY u.created_at DESC;
END;
$$;
