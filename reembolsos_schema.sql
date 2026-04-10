-- reembolsos_schema.sql

CREATE TABLE IF NOT EXISTS reembolsos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    motivo TEXT NOT NULL,
    pix_chave TEXT NOT NULL,
    pix_tipo TEXT,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluido', 'recusado')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reembolsos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reembolsos_user_select" ON reembolsos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reembolsos_user_insert" ON reembolsos FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reembolsos_admin_select" ON reembolsos FOR SELECT USING (EXISTS (SELECT 1 FROM perfis WHERE perfis.id = auth.uid() AND perfis.plano = 'admin'));
CREATE POLICY "reembolsos_admin_update" ON reembolsos FOR UPDATE USING (EXISTS (SELECT 1 FROM perfis WHERE perfis.id = auth.uid() AND perfis.plano = 'admin'));
CREATE POLICY "reembolsos_admin_insert" ON reembolsos FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM perfis WHERE perfis.id = auth.uid() AND perfis.plano = 'admin'));
CREATE POLICY "reembolsos_admin_delete" ON reembolsos FOR DELETE USING (EXISTS (SELECT 1 FROM perfis WHERE perfis.id = auth.uid() AND perfis.plano = 'admin'));
