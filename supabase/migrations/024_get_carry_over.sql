-- Migration 024: Calcula o saldo acumulado (carry-over) no banco em vez de no cliente
-- O Dashboard baixava TODOS os lançamentos do usuário (histórico completo, sem filtro)
-- só para somar esse valor no navegador. Isso piora a cada mês de uso acumulado.
-- Esta função replica a mesma lógica de calcularCarryOver() (utils/calculations.js)
-- via agregação no Postgres, sem trazer as linhas pro cliente.
CREATE OR REPLACE FUNCTION public.get_carry_over(p_month integer, p_year integer)
RETURNS numeric
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
STABLE
AS $$
  SELECT
    COALESCE(SUM(CASE
      WHEN type = 'Receita' AND status = 'Recebido'
        AND (year < p_year OR (year = p_year AND month < p_month))
      THEN income_value ELSE 0 END), 0)
    -
    COALESCE(SUM(CASE
      WHEN type = 'Despesa' AND status = 'Pago'
        AND debit_source IS DISTINCT FROM 'Mês Anterior'
        AND (year < p_year OR (year = p_year AND month < p_month))
      THEN expense_value ELSE 0 END), 0)
    -
    COALESCE(SUM(CASE
      WHEN type = 'Despesa' AND status = 'Pago'
        AND debit_source = 'Mês Anterior'
        AND (year < p_year OR (year = p_year AND month <= p_month))
      THEN expense_value ELSE 0 END), 0)
  FROM public.transactions
  WHERE user_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_carry_over(integer, integer) TO authenticated;
