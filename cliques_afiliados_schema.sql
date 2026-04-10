-- cliques_afiliados_schema.sql
-- Tabela para registrar cada clique individual nos links de afiliados

CREATE TABLE IF NOT EXISTS cliques_afiliados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    afiliado_codigo TEXT NOT NULL,
    pagina_destino TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_hint TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cliques_afiliados ENABLE ROW LEVEL SECURITY;

-- Admin pode ver tudo
CREATE POLICY "cliques_admin_select" ON cliques_afiliados FOR SELECT
  USING (EXISTS (SELECT 1 FROM perfis WHERE perfis.id = auth.uid() AND perfis.plano = 'admin'));

-- Qualquer um pode inserir (visitante anônimo clicando no link)
CREATE POLICY "cliques_anon_insert" ON cliques_afiliados FOR INSERT
  WITH CHECK (true);

-- Permitir acesso anon para insert
GRANT INSERT ON cliques_afiliados TO anon;
GRANT SELECT ON cliques_afiliados TO authenticated;
