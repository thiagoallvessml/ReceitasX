-- ══════════════════════════════════════════════════════════════════
-- ReceitasX · Catálogo de Insumos (Autocomplete)
-- Execute no Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- Tabela de catálogo global (sem user_id — é compartilhado por todos)
CREATE TABLE IF NOT EXISTS insumos_catalogo (
  id           BIGSERIAL PRIMARY KEY,
  nome         TEXT NOT NULL UNIQUE,   -- UNIQUE permite upsert sem duplicatas
  marca        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice trigram para busca por ilike rápida
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_insumos_catalogo_nome_trgm
  ON insumos_catalogo USING GIN (nome gin_trgm_ops);

-- RLS
ALTER TABLE insumos_catalogo ENABLE ROW LEVEL SECURITY;

-- Qualquer visitante (autenticado ou não) pode LER para o autocomplete funcionar
CREATE POLICY "catalogo_read"
  ON insumos_catalogo FOR SELECT
  USING (true);

-- Escrita somente via Service Role (script de importação)
-- Se quiser liberar para admins, adicione policies aqui

-- ══════════════════════════════════════════════════════════════════
-- FIM
-- ══════════════════════════════════════════════════════════════════
