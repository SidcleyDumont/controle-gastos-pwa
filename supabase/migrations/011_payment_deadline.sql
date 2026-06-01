-- =============================================================================
-- Migration 011: Prazo de 15 dias para pagamento da licença
-- Novos usuários têm 15 dias para pagar. Sem pagamento → conta excluída.
-- Também aplica o prazo aos usuários free existentes (15 dias a partir de hoje).
-- Cole no Supabase Dashboard > SQL Editor > Run (produção e homologação)
-- =============================================================================

-- 1. Atualiza trigger de novo usuário: 7 → 15 dias
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id, trial_expires_at)
  VALUES (NEW.id, NOW() + INTERVAL '15 days')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Aplica prazo de 15 dias a partir de HOJE para usuários free existentes
UPDATE user_settings
SET trial_expires_at = NOW() + INTERVAL '15 days'
WHERE plan = 'free'
  AND (trial_expires_at IS NULL OR trial_expires_at > NOW());

-- 3. Função de auto-exclusão de contas com prazo vencido
CREATE OR REPLACE FUNCTION public.auto_delete_expired_trials()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  expired RECORD;
BEGIN
  FOR expired IN
    SELECT user_id FROM public.user_settings
    WHERE plan = 'free'
      AND trial_expires_at IS NOT NULL
      AND trial_expires_at < NOW()
  LOOP
    DELETE FROM public.transactions          WHERE user_id = expired.user_id;
    DELETE FROM public.budgets               WHERE user_id = expired.user_id;
    DELETE FROM public.recurring_transactions WHERE user_id = expired.user_id;
    DELETE FROM public.categories            WHERE user_id = expired.user_id;
    DELETE FROM public.user_settings         WHERE user_id = expired.user_id;
    BEGIN
      DELETE FROM auth.users WHERE id = expired.user_id;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END;
$$;

-- 4. Cron diário às 3h UTC (meia-noite BRT) para excluir contas vencidas
SELECT cron.schedule(
  'auto-delete-expired-trials',
  '0 3 * * *',
  'SELECT public.auto_delete_expired_trials()'
);

-- Para verificar:
-- SELECT * FROM cron.job WHERE jobname = 'auto-delete-expired-trials';
-- SELECT user_id, plan, trial_expires_at FROM user_settings ORDER BY trial_expires_at;
