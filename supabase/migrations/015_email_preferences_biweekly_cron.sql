-- =============================================================================
-- Migration 015: Preferências de e-mail + Cron quinzenal
-- Cole no Supabase Dashboard > SQL Editor > Run (produção e homologação)
-- =============================================================================

-- 1. Adicionar colunas de preferência de e-mail em user_settings
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS email_biweekly boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_monthly  boolean NOT NULL DEFAULT true;

-- 2. Cron quinzenal — executa toda segunda-feira às 8h UTC (05h BRT)
-- Envia resumo com lançamentos dos próximos 15 dias
SELECT cron.schedule(
  'send-biweekly-summary',
  '0 8 * * 1',
  $$
  SELECT net.http_post(
    url     := 'https://pkbnqhcgeabjfndhnuwk.supabase.co/functions/v1/send-biweekly-summary',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret', true)
    ),
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);

-- 3. Cron mensal — executa no dia 5 de cada mês às 8h UTC (05h BRT)
-- Envia resumo do mês anterior com comparativo
SELECT cron.schedule(
  'send-monthly-summary',
  '0 8 5 * *',
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

-- Para verificar os crons:
-- SELECT * FROM cron.job WHERE jobname IN ('send-biweekly-summary', 'send-monthly-summary');
