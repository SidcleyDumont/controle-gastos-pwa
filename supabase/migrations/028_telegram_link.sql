-- Migration 028: Vínculo entre conta do app e chat do Telegram, pra permitir
-- lançar despesas/receitas mandando mensagem pro bot.
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS telegram_chat_id  bigint UNIQUE,
  ADD COLUMN IF NOT EXISTS telegram_link_code text   UNIQUE;
