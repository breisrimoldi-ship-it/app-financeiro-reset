-- Migration: rename rv_contas → contas_bancarias (global), add tipo/saldo_inicial,
-- add conta_id to movimentacoes/faturas_pagamento/pagamentos_contas,
-- add conta_destino_id to movimentacoes (for transfers).
-- Run this AFTER 002_rv_contas.sql.

-- ============================================================
-- 1. Rename rv_contas → contas_bancarias
-- ============================================================
ALTER TABLE IF EXISTS rv_contas RENAME TO contas_bancarias;

-- ============================================================
-- 2. Add columns tipo (cpf/pj) and saldo_inicial
-- ============================================================
ALTER TABLE contas_bancarias
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'cpf',
  ADD COLUMN IF NOT EXISTS saldo_inicial numeric(12,2) NOT NULL DEFAULT 0;

-- Add check constraint for tipo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contas_bancarias_tipo_check'
  ) THEN
    ALTER TABLE contas_bancarias
      ADD CONSTRAINT contas_bancarias_tipo_check CHECK (tipo IN ('cpf', 'pj'));
  END IF;
END$$;

-- ============================================================
-- 3. Rename index
-- ============================================================
ALTER INDEX IF EXISTS idx_rv_contas_user_id RENAME TO idx_contas_bancarias_user_id;

-- ============================================================
-- 4. Update RLS policy
-- ============================================================
DROP POLICY IF EXISTS "Users can manage their own accounts" ON contas_bancarias;
DROP POLICY IF EXISTS "rv_contas owner" ON contas_bancarias;
CREATE POLICY "Users can manage their own accounts" ON contas_bancarias
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 5. Add conta_id to movimentacoes
-- ============================================================
ALTER TABLE movimentacoes
  ADD COLUMN IF NOT EXISTS conta_id uuid REFERENCES contas_bancarias(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_movimentacoes_conta_id ON movimentacoes(conta_id);

-- ============================================================
-- 6. Add conta_destino_id to movimentacoes (for transfers)
-- ============================================================
ALTER TABLE movimentacoes
  ADD COLUMN IF NOT EXISTS conta_destino_id uuid REFERENCES contas_bancarias(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_movimentacoes_conta_destino_id ON movimentacoes(conta_destino_id);

-- ============================================================
-- 7. Add conta_id to faturas_pagamento
-- ============================================================
ALTER TABLE faturas_pagamento
  ADD COLUMN IF NOT EXISTS conta_id uuid REFERENCES contas_bancarias(id) ON DELETE SET NULL;

-- ============================================================
-- 8. Add conta_id to pagamentos_contas
-- ============================================================
ALTER TABLE pagamentos_contas
  ADD COLUMN IF NOT EXISTS conta_id uuid REFERENCES contas_bancarias(id) ON DELETE SET NULL;

-- ============================================================
-- 9. Update FK on rv_lancamentos (origem_conta_id now refs contas_bancarias)
-- The FK was created in 002 pointing to rv_contas — the rename carries it over
-- automatically, so no action needed here.
-- ============================================================
