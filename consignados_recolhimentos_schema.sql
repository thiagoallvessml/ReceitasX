-- ── HISTÓRICO DE RECOLHIMENTOS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS consignados_recolhimentos (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parceiro_id     BIGINT NOT NULL REFERENCES consignados_parceiros(id) ON DELETE CASCADE,
  estoque_id      BIGINT REFERENCES consignados_estoque(id) ON DELETE SET NULL,
  nome_produto    TEXT NOT NULL,
  quantidade      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE consignados_recolhimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consignados_recolhimentos_self" ON consignados_recolhimentos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
