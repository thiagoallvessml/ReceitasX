-- update_cupons_admin.sql
-- Adiciona suporte a data de expiração e vinculação de afiliado aos cupons

ALTER TABLE cupons ADD COLUMN IF NOT EXISTS data_expiracao TIMESTAMPTZ;
ALTER TABLE cupons ADD COLUMN IF NOT EXISTS afiliado_id BIGINT REFERENCES afiliados(id) ON DELETE SET NULL;

-- Atualiza policy de leitura caso não estivesse permitindo ler tudo no admin (o select é público se ativo=true)
-- O admin, na vdd, deve conseguir ler TUDO, mas o RLS de cupons está: CREATE POLICY "cupons_read" ON cupons FOR SELECT USING (ativo = TRUE);
-- Vamos adicionar uma policy para admins lerem tudo ou bypassar
DO $$ BEGIN
  CREATE POLICY "cupons_admin_all" ON cupons FOR ALL USING (
    EXISTS (SELECT 1 FROM perfis WHERE perfis.id = auth.uid() AND perfis.plano = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM perfis WHERE perfis.id = auth.uid() AND perfis.plano = 'admin')
  );
EXCEPTION WHEN undefined_object OR duplicate_object THEN NULL;
END; $$;
