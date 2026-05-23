-- =============================================================================
-- Migration 004 — Cron job para alertas de vencimento
-- IMPORTANTE: Execute SOMENTE após fazer o deploy da Edge Function
-- check-due-dates no Supabase Dashboard ou via CLI
-- =============================================================================

-- Habilita as extensões necessárias (já disponíveis no Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Agenda execução diária às 10:00 UTC (07:00 BRT)
-- Substitua YOUR_CRON_SECRET pelo valor configurado nos secrets da Edge Function
SELECT cron.schedule(
  'check-due-dates-daily',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://pkbnqhcgeabjfndhnuwk.supabase.co/functions/v1/check-due-dates',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret', true)
    ),
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Para verificar o agendamento criado:
-- SELECT * FROM cron.job;

-- Para remover o agendamento (se necessário):
-- SELECT cron.unschedule('check-due-dates-daily');
