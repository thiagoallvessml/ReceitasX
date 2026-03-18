-- ================================================================
-- ReceitasX · MASTER SETUP — Afiliados + Roles + Admin Policies
-- Seguro: roda em qualquer estado do banco (cria só o que falta)
-- Execute TUDO de uma vez no Supabase Dashboard → SQL Editor
-- ================================================================

-- ── PASSO 1: Garantir coluna 'role' na tabela perfis ─────────────
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS role TEXT
  NOT NULL DEFAULT 'afiliado'
  CHECK (role IN ('admin', 'afiliado'));

-- ── PASSO 2: Função helper get_my_role() ─────────────────────────
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$ SELECT role FROM public.perfis WHERE id = auth.uid(); $$;

GRANT EXECUTE ON FUNCTION get_my_role() TO authenticated;

-- ── PASSO 3: Tabela afiliados ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS afiliados (
  id            BIGSERIAL     PRIMARY KEY,
  user_id       UUID          UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT          NOT NULL,
  codigo        TEXT          UNIQUE NOT NULL,
  total_ganhos  NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_vendas  INTEGER       NOT NULL DEFAULT 0,
  total_cliques INTEGER       NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
ALTER TABLE afiliados ENABLE ROW LEVEL SECURITY;

-- Garantir colunas obrigatórias caso a tabela já exista em versão antiga
ALTER TABLE afiliados ADD COLUMN IF NOT EXISTS user_id       UUID    REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE afiliados ADD COLUMN IF NOT EXISTS total_ganhos  NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE afiliados ADD COLUMN IF NOT EXISTS total_vendas  INTEGER       NOT NULL DEFAULT 0;
ALTER TABLE afiliados ADD COLUMN IF NOT EXISTS total_cliques INTEGER       NOT NULL DEFAULT 0;

-- Garantir unique em user_id (ignora se já existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'afiliados'::regclass AND conname = 'afiliados_user_id_key'
  ) THEN
    ALTER TABLE afiliados ADD CONSTRAINT afiliados_user_id_key UNIQUE (user_id);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Policies afiliados (drop individual com bloco seguro)
DO $$ BEGIN DROP POLICY IF EXISTS "afiliados_self"         ON afiliados; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "afiliados_admin_read"   ON afiliados; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "afiliados_public_read"  ON afiliados; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "afiliados_admin_select" ON afiliados; EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "afiliados_self"
  ON afiliados FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "afiliados_public_read"
  ON afiliados FOR SELECT USING (true);

CREATE POLICY "afiliados_admin_select"
  ON afiliados FOR SELECT USING (get_my_role() = 'admin');

-- ── PASSO 4: Tabela indicacoes ────────────────────────────────────
CREATE TABLE IF NOT EXISTS indicacoes (
  id             BIGSERIAL     PRIMARY KEY,
  afiliado_id    BIGINT        NOT NULL REFERENCES afiliados(id) ON DELETE CASCADE,
  indicado_email TEXT          NOT NULL,
  converteu      BOOLEAN       NOT NULL DEFAULT FALSE,
  valor_pago     NUMERIC(10,2),
  comissao       NUMERIC(10,2),
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
ALTER TABLE indicacoes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN DROP POLICY IF EXISTS "indicacoes_self"          ON indicacoes; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "indicacoes_self_select"   ON indicacoes; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "indicacoes_public_insert" ON indicacoes; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "indicacoes_admin_select"  ON indicacoes; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Afiliado vê só as próprias; admin vê todas
CREATE POLICY "indicacoes_self_select"
  ON indicacoes FOR SELECT
  USING (
    afiliado_id IN (SELECT id FROM afiliados WHERE user_id = auth.uid())
    OR get_my_role() = 'admin'
  );

CREATE POLICY "indicacoes_public_insert"
  ON indicacoes FOR INSERT WITH CHECK (true);

-- ── PASSO 5: Tabela saques_afiliado ───────────────────────────────
CREATE TABLE IF NOT EXISTS saques_afiliado (
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

-- Garantir colunas obrigatórias caso a tabela já exista em versão antiga
ALTER TABLE saques_afiliado ADD COLUMN IF NOT EXISTS user_id    UUID          REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE saques_afiliado ADD COLUMN IF NOT EXISTS pix_chave  TEXT;
ALTER TABLE saques_afiliado ADD COLUMN IF NOT EXISTS pix_tipo   TEXT          NOT NULL DEFAULT 'cpf';
ALTER TABLE saques_afiliado ADD COLUMN IF NOT EXISTS status     TEXT          NOT NULL DEFAULT 'pendente';
ALTER TABLE saques_afiliado ADD COLUMN IF NOT EXISTS obs        TEXT;

DO $$ BEGIN DROP POLICY IF EXISTS "saques_self"         ON saques_afiliado; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "saques_admin_select" ON saques_afiliado; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "saques_admin_update" ON saques_afiliado; EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "saques_self"
  ON saques_afiliado FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saques_admin_select"
  ON saques_afiliado FOR SELECT USING (get_my_role() = 'admin');

CREATE POLICY "saques_admin_update"
  ON saques_afiliado FOR UPDATE
  USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');

-- ── PASSO 6: RPCs ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION incrementar_venda_afiliado(
  p_afiliado_id BIGINT,
  p_valor       NUMERIC
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE afiliados
  SET total_ganhos = total_ganhos + ROUND(p_valor * 0.10, 2),
      total_vendas = total_vendas + 1
  WHERE id = p_afiliado_id;
END;
$$;

CREATE OR REPLACE FUNCTION registrar_clique_afiliado(p_codigo TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE afiliados SET total_cliques = total_cliques + 1 WHERE codigo = p_codigo;
END;
$$;

-- ── VERIFICAÇÃO FINAL ─────────────────────────────────────────────
SELECT '✓ Tabelas' AS check, string_agg(table_name, ', ') AS resultado
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('afiliados','indicacoes','saques_afiliado','perfis')

UNION ALL

SELECT '✓ Coluna role em perfis',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='perfis' AND column_name='role'
  ) THEN 'OK' ELSE 'FALTANDO' END

UNION ALL

SELECT '✓ Função get_my_role',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_my_role'
  ) THEN 'OK' ELSE 'FALTANDO' END;
