-- ══════════════════════════════════════════════════════════════════
-- ReceitasX · Consignados Schema
-- ══════════════════════════════════════════════════════════════════

-- ── 1. PARCEIROS CONSIGNADOS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS consignados_parceiros (
  id               BIGSERIAL PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_local       TEXT NOT NULL,
  nome_responsavel TEXT,
  telefone         TEXT,
  endereco         TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE consignados_parceiros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consignados_parceiros_self" ON consignados_parceiros FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 2. ESTOQUE CONSIGNADO ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consignados_estoque (
  id                  BIGSERIAL PRIMARY KEY,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parceiro_id         BIGINT NOT NULL REFERENCES consignados_parceiros(id) ON DELETE CASCADE,
  produto_id          BIGINT REFERENCES produtos(id) ON DELETE SET NULL,
  nome_produto        TEXT NOT NULL,
  quantidade          INTEGER NOT NULL DEFAULT 0,
  quantidade_restante INTEGER NOT NULL DEFAULT 0,
  preco_venda         NUMERIC(10,4) NOT NULL DEFAULT 0,
  taxa_comissao       NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE consignados_estoque ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consignados_estoque_self" ON consignados_estoque FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 3. VENDAS CONSIGNADAS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consignados_vendas (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parceiro_id     BIGINT NOT NULL REFERENCES consignados_parceiros(id) ON DELETE CASCADE,
  estoque_id      BIGINT REFERENCES consignados_estoque(id) ON DELETE SET NULL,
  nome_produto    TEXT NOT NULL,
  quantidade      INTEGER NOT NULL DEFAULT 0,
  valor_bruto     NUMERIC(10,4) NOT NULL DEFAULT 0,
  valor_liquido   NUMERIC(10,4) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE consignados_vendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consignados_vendas_self" ON consignados_vendas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
