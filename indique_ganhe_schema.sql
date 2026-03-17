-- ================================================================
-- PROGRAMA "INDIQUE E GANHE" - ReceitasX
-- VERSÃO FINAL SEGURA: trata tabelas que ainda não existem
-- Execute no Supabase SQL Editor
-- ================================================================

-- ── Remove policies antigas com segurança (ignora se tabela não existe) ──
DO $$ BEGIN
  DROP POLICY IF EXISTS "afiliados_self"           ON afiliados;
  DROP POLICY IF EXISTS "afiliados_read_by_codigo" ON afiliados;
  DROP POLICY IF EXISTS "afiliados_public_read"    ON afiliados;
  DROP POLICY IF EXISTS "afiliados_insert_self"    ON afiliados;
EXCEPTION WHEN undefined_table THEN NULL;
END; $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "indicacoes_self"          ON indicacoes;
  DROP POLICY IF EXISTS "indicacoes_insert"        ON indicacoes;
  DROP POLICY IF EXISTS "indicacoes_self_select"   ON indicacoes;
  DROP POLICY IF EXISTS "indicacoes_public_insert" ON indicacoes;
EXCEPTION WHEN undefined_table THEN NULL;
END; $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "saques_self"              ON saques_afiliado;
EXCEPTION WHEN undefined_table THEN NULL;
END; $$;

-- ── Remove tabelas (CASCADE para remover dependências) ──────────
DROP TABLE IF EXISTS saques_afiliado CASCADE;
DROP TABLE IF EXISTS indicacoes      CASCADE;
DROP TABLE IF EXISTS afiliados       CASCADE;

-- ── 1. AFILIADOS ─────────────────────────────────────────────────
CREATE TABLE afiliados (
  id              BIGSERIAL     PRIMARY KEY,
  user_id         UUID          UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT          NOT NULL,
  codigo          TEXT          UNIQUE NOT NULL,
  total_ganhos    NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_vendas    INTEGER       NOT NULL DEFAULT 0,
  total_cliques   INTEGER       NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE afiliados ENABLE ROW LEVEL SECURITY;

-- Dono lê e edita os próprios dados
CREATE POLICY "afiliados_self"
  ON afiliados FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Qualquer um pode ler (checkout anônimo verifica código)
CREATE POLICY "afiliados_public_read"
  ON afiliados FOR SELECT
  USING (true);

-- ── 2. INDICAÇÕES ────────────────────────────────────────────────
CREATE TABLE indicacoes (
  id              BIGSERIAL     PRIMARY KEY,
  afiliado_id     BIGINT        NOT NULL REFERENCES afiliados(id) ON DELETE CASCADE,
  indicado_email  TEXT          NOT NULL,
  converteu       BOOLEAN       NOT NULL DEFAULT FALSE,
  valor_pago      NUMERIC(10,2),
  comissao        NUMERIC(10,2),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE indicacoes ENABLE ROW LEVEL SECURITY;

-- Afiliado lê somente as próprias indicações
CREATE POLICY "indicacoes_self_select"
  ON indicacoes FOR SELECT
  USING (
    afiliado_id IN (
      SELECT id FROM afiliados WHERE user_id = auth.uid()
    )
  );

-- Qualquer um pode registrar uma indicação (checkout anônimo)
CREATE POLICY "indicacoes_public_insert"
  ON indicacoes FOR INSERT
  WITH CHECK (true);

-- ── 3. SAQUES ────────────────────────────────────────────────────
CREATE TABLE saques_afiliado (
  id          BIGSERIAL     PRIMARY KEY,
  user_id     UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT          NOT NULL,
  valor       NUMERIC(10,2) NOT NULL,
  pix_chave   TEXT          NOT NULL,
  pix_tipo    TEXT          NOT NULL DEFAULT 'cpf',
  status      TEXT          NOT NULL DEFAULT 'pendente',
  obs         TEXT,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE saques_afiliado ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saques_self"
  ON saques_afiliado FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 4. RPC: incrementar stats do afiliado ────────────────────────
CREATE OR REPLACE FUNCTION incrementar_venda_afiliado(
  p_afiliado_id BIGINT,
  p_valor       NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE afiliados
  SET
    total_ganhos = total_ganhos + ROUND(p_valor * 0.10, 2),
    total_vendas = total_vendas + 1
  WHERE id = p_afiliado_id;
END;
$$;

-- ── 5. RPC: registrar clique no link ─────────────────────────────
CREATE OR REPLACE FUNCTION registrar_clique_afiliado(p_codigo TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE afiliados
  SET total_cliques = total_cliques + 1
  WHERE codigo = p_codigo;
END;
$$;
