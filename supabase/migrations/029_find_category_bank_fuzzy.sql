-- Migration 029: Busca de categoria/banco por nome ignorando acentuação e
-- priorizando o match mais próximo (exato > começa com > contém).
-- Usado pelo bot do Telegram pra interpretar as tags #categoria e @banco
-- mesmo quando digitadas sem acento (ex: "alimentacao" -> "Alimentação").

CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION public.find_category(p_user_id uuid, p_type text, p_search text)
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.categories
  WHERE user_id = p_user_id
    AND type = p_type
    AND unaccent(lower(name)) LIKE '%' || unaccent(lower(p_search)) || '%'
  ORDER BY
    CASE
      WHEN unaccent(lower(name)) = unaccent(lower(p_search))        THEN 0
      WHEN unaccent(lower(name)) LIKE unaccent(lower(p_search)) || '%' THEN 1
      ELSE 2
    END,
    length(name) ASC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.find_bank(p_user_id uuid, p_search text)
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.bank_balances
  WHERE user_id = p_user_id
    AND unaccent(lower(bank_name)) LIKE '%' || unaccent(lower(p_search)) || '%'
  ORDER BY
    CASE
      WHEN unaccent(lower(bank_name)) = unaccent(lower(p_search))        THEN 0
      WHEN unaccent(lower(bank_name)) LIKE unaccent(lower(p_search)) || '%' THEN 1
      ELSE 2
    END,
    length(bank_name) ASC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.find_category(uuid, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.find_bank(uuid, text) TO authenticated, service_role;
