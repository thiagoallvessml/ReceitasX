-- ══════════════════════════════════════════════════════════════════
-- Fix: Admin pode SELECT em todas as receitas (e perfis)
-- Execute no Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- 1. Garante que a coluna 'role' existe na tabela perfis
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 2. Policy: admin pode SELECT em receitas de qualquer usuário
DROP POLICY IF EXISTS "receitas_admin_read" ON receitas;
CREATE POLICY "receitas_admin_read" ON receitas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
        AND perfis.role = 'admin'
    )
  );

-- 3. Policy: admin pode SELECT em todas as perfis (já pode, mas garantindo)
DROP POLICY IF EXISTS "perfis_admin_read" ON perfis;
CREATE POLICY "perfis_admin_read" ON perfis
  FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM perfis p2
      WHERE p2.id = auth.uid()
        AND p2.role = 'admin'
    )
  );

-- ══════════════════════════════════════════════════════════════════
-- Verificação: listar políticas ativas nas tabelas
-- ══════════════════════════════════════════════════════════════════
-- SELECT schemaname, tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('receitas', 'perfis')
-- ORDER BY tablename, policyname;
