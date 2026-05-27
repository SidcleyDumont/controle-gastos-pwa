-- =============================================================================
-- Migration 006 — Sistema de trial de 7 dias
-- Execute no Supabase SQL Editor (staging primeiro, depois produção)
-- =============================================================================

-- 1. Adiciona coluna trial_expires_at na user_settings
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS trial_expires_at timestamptz DEFAULT NULL;

-- 2. Atualiza handle_new_user para definir trial ao criar conta
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id, trial_expires_at)
  VALUES (NEW.id, NOW() + INTERVAL '7 days')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Garante que o trigger existe (recria se necessário)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 4. Define trial para usuários existentes que ainda não têm
--    (7 dias a partir de hoje — dá tempo de experimentar)
UPDATE user_settings
SET trial_expires_at = NOW() + INTERVAL '7 days'
WHERE trial_expires_at IS NULL
  AND plan != 'pro';

-- Verificar:
-- SELECT user_id, plan, trial_expires_at FROM user_settings ORDER BY created_at DESC;
