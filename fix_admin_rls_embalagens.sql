-- ══════════════════════════════════════════════════════════════════
-- Fix: Admin pode SELECT em todas as embalagens de qualquer usuário
-- Execute no Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- Policy: admin pode SELECT em embalagens de qualquer usuário
DROP POLICY IF EXISTS "embalagens_admin_read" ON embalagens;
CREATE POLICY "embalagens_admin_read" ON embalagens
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
        AND perfis.role = 'admin'
    )
  );

-- ══════════════════════════════════════════════════════════════════
-- Verificação: listar políticas ativas na tabela embalagens
-- ══════════════════════════════════════════════════════════════════
-- SELECT schemaname, tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'embalagens'
-- ORDER BY policyname;
