-- =============================================================================
-- Migration 012: Cron de e-mails de aviso de prazo de pagamento
-- Execute SOMENTE após fazer deploy da Edge Function 'send-trial-warnings'
-- =============================================================================

-- Agenda execução diária às 9h UTC (06h BRT)
SELECT cron.schedule(
  'send-trial-warnings-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://pkbnqhcgeabjfndhnuwk.supabase.co/functions/v1/send-trial-warnings',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret', true)
    ),
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Para verificar:
-- SELECT * FROM cron.job WHERE jobname = 'send-trial-warnings-daily';
