-- ══════════════════════════════════════════════════════════════════
-- Fix: Admin pode SELECT em todos os produtos
-- Execute no Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "produtos_admin_read" ON produtos;
CREATE POLICY "produtos_admin_read" ON produtos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
        AND perfis.role = 'admin'
    )
  );
