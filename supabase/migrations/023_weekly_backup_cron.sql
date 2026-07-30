-- Migration 023: Cron semanal de backup — exporta todas as tabelas em CSV
-- e envia por e-mail para o admin, todo domingo às 6h UTC (03h BRT).
SELECT cron.schedule(
  'backup-data-weekly',
  '0 6 * * 0',
  $$
  SELECT net.http_post(
    url     := 'https://pkbnqhcgeabjfndhnuwk.supabase.co/functions/v1/backup-data',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret', true)
    ),
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Para verificar o cron:
-- SELECT * FROM cron.job WHERE jobname = 'backup-data-weekly';
