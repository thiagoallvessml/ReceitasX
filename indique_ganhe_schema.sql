-- ================================================================
-- TABELAS PARA O PROGRAMA "INDIQUE E GANHE" - ReceitasX
-- Execute no Supabase SQL Editor
-- ================================================================

-- ── 1. AFILIADOS ────────────────────────────────────────────────
-- Cada usuário autenticado pode ser afiliado.
-- O campo `codigo` é o código único usado no link de indicação.
CREATE TABLE IF NOT EXISTS afiliados (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  codigo          TEXT UNIQUE NOT NULL,
  total_ganhos    NUMERIC(10,2) DEFAULT 0,
  total_vendas    INTEGER DEFAULT 0,
  total_cliques   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE afiliados ENABLE ROW LEVEL SECURITY;
-- Afiliado vê apenas seus próprios dados
CREATE POLICY "afiliados_self" ON afiliados FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Checkout precisa ler o afiliado pelo código (anon)
CREATE POLICY "afiliados_read_by_codigo" ON afiliados FOR SELECT USING (true);

-- ── 2. INDICAÇÕES ────────────────────────────────────────────────
-- Registra cada indicação feita por um afiliado.
CREATE TABLE IF NOT EXISTS indicacoes (
  id              BIGSERIAL PRIMARY KEY,
  afiliado_id     BIGINT NOT NULL REFERENCES afiliados(id) ON DELETE CASCADE,
  indicado_email  TEXT NOT NULL,
  converteu       BOOLEAN DEFAULT FALSE,
  valor_pago      NUMERIC(10,2),
  comissao        NUMERIC(10,2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE indicacoes ENABLE ROW LEVEL SECURITY;
-- Afiliado vê somente suas indicações
CREATE POLICY "indicacoes_self" ON indicacoes FOR SELECT
  USING (afiliado_id IN (SELECT id FROM afiliados WHERE user_id = auth.uid()));
-- Checkout pode inserir indicações (anon/autenticado)
CREATE POLICY "indicacoes_insert" ON indicacoes FOR INSERT WITH CHECK (true);

-- ── 3. SAQUES DE AFILIADOS ───────────────────────────────────────
-- Solicitações de saque feitas pelos afiliados.
CREATE TABLE IF NOT EXISTS saques_afiliado (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  valor       NUMERIC(10,2) NOT NULL,
  pix_chave   TEXT NOT NULL,
  pix_tipo    TEXT NOT NULL DEFAULT 'cpf',
  status      TEXT NOT NULL DEFAULT 'pendente', -- pendente, pago, cancelado
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE saques_afiliado ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saques_self" ON saques_afiliado FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 4. RPC: incrementar stats do afiliado ────────────────────────
-- Chamada pelo checkout após conversão.
CREATE OR REPLACE FUNCTION incrementar_venda_afiliado(
  p_afiliado_id BIGINT,
  p_valor       NUMERIC
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE afiliados
  SET
    total_ganhos  = total_ganhos + (p_valor * 0.10),
    total_vendas  = total_vendas + 1
  WHERE id = p_afiliado_id;
END;
$$;

-- ── 5. RPC: registrar clique no link de afiliado ─────────────────
CREATE OR REPLACE FUNCTION registrar_clique_afiliado(p_codigo TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE afiliados SET total_cliques = total_cliques + 1 WHERE codigo = p_codigo;
END;
$$;
