-- ══════════════════════════════════════════════════════════════════
-- ReceitasX · Admin: Gerenciar Cupons
-- Execute no Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- Admin pode fazer tudo com cupons
DROP POLICY IF EXISTS "cupons_admin_all" ON cupons;
CREATE POLICY "cupons_admin_all" ON cupons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
        AND perfis.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
        AND perfis.role = 'admin'
    )
  );
