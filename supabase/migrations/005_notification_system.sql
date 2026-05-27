-- =============================================================================
-- Migration 005 — Sistema de notificações por email
-- Execute no Supabase SQL Editor (produção e staging)
-- =============================================================================

-- Tabela para rastrear notificações enviadas (evita duplicatas)
CREATE TABLE IF NOT EXISTS user_notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL,         -- 'welcome', 'plan_expiry', 'monthly_summary'
  reference_id text DEFAULT NULL,  -- identificador único por instância
  sent_at timestamptz DEFAULT now(),
  UNIQUE(user_id, type, reference_id)
);

CREATE INDEX IF NOT EXISTS idx_user_notif_lookup ON user_notifications(user_id, type);

ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
GRANT ALL ON user_notifications TO service_role;

-- Cron: vencimento do plano Pro (diário 10h UTC / 07h BRT)
SELECT cron.schedule(
  'check-plan-expiry-daily',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://pkbnqhcgeabjfndhnuwk.supabase.co/functions/v1/check-plan-expiry',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret', true)
    ),
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Cron: email de boas-vindas (diário 10h30 UTC)
SELECT cron.schedule(
  'send-welcome-email-daily',
  '30 10 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://pkbnqhcgeabjfndhnuwk.supabase.co/functions/v1/send-welcome-email',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret', true)
    ),
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Cron: resumo mensal (dia 1 de cada mês às 09h UTC / 06h BRT)
SELECT cron.schedule(
  'send-monthly-summary',
  '0 9 1 * *',
  $$
  SELECT net.http_post(
    url     := 'https://pkbnqhcgeabjfndhnuwk.supabase.co/functions/v1/send-monthly-summary',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret', true)
    ),
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Verificar crons criados:
-- SELECT jobname, schedule, active FROM cron.job ORDER BY jobname;
