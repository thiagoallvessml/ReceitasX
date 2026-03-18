-- ================================================================
-- ReceitasX · Configurações do sistema (linha única)
-- Execute no Supabase Dashboard → SQL Editor
-- ================================================================

-- Usar tabela config simples com uma única linha (sem key-value)
CREATE TABLE IF NOT EXISTS config_afiliados (
  id            INTEGER PRIMARY KEY DEFAULT 1,
  comissao_pct  NUMERIC(5,2)  NOT NULL DEFAULT 10,
  saque_minimo  NUMERIC(10,2) NOT NULL DEFAULT 50,
  valor_plano   NUMERIC(10,2) NOT NULL DEFAULT 46.90,
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CHECK (id = 1)  -- garante sempre 1 linha
);

ALTER TABLE config_afiliados ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado pode ler
DROP POLICY IF EXISTS "cfg_af_read" ON config_afiliados;
CREATE POLICY "cfg_af_read"
  ON config_afiliados FOR SELECT
  USING (auth.role() = 'authenticated');

-- Só admin pode atualizar
DROP POLICY IF EXISTS "cfg_af_update" ON config_afiliados;
CREATE POLICY "cfg_af_update"
  ON config_afiliados FOR ALL
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- Inserir linha padrão
INSERT INTO config_afiliados (id, comissao_pct, saque_minimo, valor_plano)
VALUES (1, 10, 50, 46.90)
ON CONFLICT (id) DO NOTHING;

-- Verificar
SELECT * FROM config_afiliados;
