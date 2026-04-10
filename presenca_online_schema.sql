-- ══════════════════════════════════════════════════════════════════
-- ReceitasX · Presença Online (Heartbeat)
-- Execute no Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- 1. Tabela de presença
CREATE TABLE IF NOT EXISTS presenca_online (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pagina      TEXT
);

ALTER TABLE presenca_online ENABLE ROW LEVEL SECURITY;

-- 2. Usuário pode inserir/atualizar apenas sua própria presença
CREATE POLICY "presenca_self_upsert" ON presenca_online
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Admin pode ler todas as presenças
CREATE POLICY "presenca_admin_read" ON presenca_online
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
        AND perfis.role = 'admin'
    )
  );

-- 4. Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_presenca_last_seen ON presenca_online(last_seen DESC);
