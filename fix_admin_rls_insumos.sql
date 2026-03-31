-- ══════════════════════════════════════════════════════════════════
-- Fix: Admin pode SELECT em todos os insumos de qualquer usuário
-- Execute no Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- Policy: admin pode SELECT em insumos de qualquer usuário
DROP POLICY IF EXISTS "insumos_admin_read" ON insumos;
CREATE POLICY "insumos_admin_read" ON insumos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
        AND perfis.role = 'admin'
    )
  );

-- ══════════════════════════════════════════════════════════════════
-- Verificação: listar políticas ativas na tabela insumos
-- ══════════════════════════════════════════════════════════════════
-- SELECT schemaname, tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'insumos'
-- ORDER BY policyname;
