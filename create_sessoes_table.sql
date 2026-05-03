-- ══════════════════════════════════════════════════════════════════
-- ReceitasX · Sessões de Usuário (Log de Acessos)
-- Execute no Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- 1. Tabela de sessões
CREATE TABLE IF NOT EXISTS sessoes_usuario (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inicio       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fim          TIMESTAMPTZ,
  duracao_seg  INT,
  pagina_entrada TEXT,
  user_agent   TEXT
);

ALTER TABLE sessoes_usuario ENABLE ROW LEVEL SECURITY;

-- 2. Usuário pode inserir/atualizar apenas suas próprias sessões
CREATE POLICY "sessao_self_insert" ON sessoes_usuario
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sessao_self_update" ON sessoes_usuario
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Admin pode ler todas as sessões
CREATE POLICY "sessao_admin_read" ON sessoes_usuario
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
        AND perfis.role = 'admin'
    )
  );

-- 4. Índices para consultas rápidas por data
CREATE INDEX IF NOT EXISTS idx_sessoes_user_id ON sessoes_usuario(user_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_inicio ON sessoes_usuario(inicio DESC);
CREATE INDEX IF NOT EXISTS idx_sessoes_inicio_date ON sessoes_usuario((inicio::date));
