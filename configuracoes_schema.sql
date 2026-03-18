-- ================================================================
-- ReceitasX · Tabela de configurações do sistema
-- Execute no Supabase Dashboard → SQL Editor
-- ================================================================

CREATE TABLE IF NOT EXISTS configuracoes (
  chave      TEXT PRIMARY KEY,
  valor      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- Apenas admin pode ler e escrever
DROP POLICY IF EXISTS "cfg_admin_all" ON configuracoes;
CREATE POLICY "cfg_admin_all"
  ON configuracoes FOR ALL
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- Qualquer autenticado pode LER (para usar os valores no frontend)
DROP POLICY IF EXISTS "cfg_read_auth" ON configuracoes;
CREATE POLICY "cfg_read_auth"
  ON configuracoes FOR SELECT
  USING (auth.role() = 'authenticated');

-- Inserir valores padrão
INSERT INTO configuracoes (chave, valor) VALUES
  ('comissao_pct',  '10'),
  ('saque_minimo',  '50'),
  ('valor_plano',   '46.90')
ON CONFLICT (chave) DO NOTHING;

-- Verificar
SELECT chave, valor FROM configuracoes ORDER BY chave;
