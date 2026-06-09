-- Saldo de outros bancos (Nubank, Bradesco, Inter, etc.)
CREATE TABLE IF NOT EXISTS bank_balances (
  id        UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id   UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name TEXT          NOT NULL CHECK (char_length(bank_name) BETWEEN 1 AND 100),
  balance   NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ  DEFAULT NOW(),
  updated_at TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE bank_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bank_balances: user manages own rows"
  ON bank_balances FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_bank_balances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bank_balances_updated_at
  BEFORE UPDATE ON bank_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_bank_balances_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE bank_balances TO authenticated;
