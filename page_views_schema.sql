-- page_views_schema.sql
-- Registra cada visualização de página dos usuários logados

CREATE TABLE IF NOT EXISTS page_views (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    pagina TEXT NOT NULL,
    referrer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado pode inserir (registrar sua própria view)
CREATE POLICY "pageviews_insert" ON page_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin pode ler tudo
CREATE POLICY "pageviews_admin_select" ON page_views FOR SELECT
  USING (EXISTS (SELECT 1 FROM perfis WHERE perfis.id = auth.uid() AND perfis.role = 'admin'));

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_pagina ON page_views(pagina);
