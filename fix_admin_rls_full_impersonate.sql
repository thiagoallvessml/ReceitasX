-- ══════════════════════════════════════════════════════════════════
-- Fix: Admin pode INSERT, UPDATE e DELETE em tabelas dos clientes
-- para funcionar o recurso "Acessar como este cliente"
-- Execute no Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────
-- INSUMOS: Admin pode inserir, editar e deletar insumos
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "insumos_admin_insert" ON insumos;
CREATE POLICY "insumos_admin_insert" ON insumos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
        AND perfis.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "insumos_admin_update" ON insumos;
CREATE POLICY "insumos_admin_update" ON insumos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
        AND perfis.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "insumos_admin_delete" ON insumos;
CREATE POLICY "insumos_admin_delete" ON insumos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
        AND perfis.role = 'admin'
    )
  );

-- ────────────────────────────────────────────────────────────
-- RECEITAS: Admin pode inserir, editar e deletar receitas
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "receitas_admin_insert" ON receitas;
CREATE POLICY "receitas_admin_insert" ON receitas
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
        AND perfis.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "receitas_admin_update" ON receitas;
CREATE POLICY "receitas_admin_update" ON receitas
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
        AND perfis.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "receitas_admin_delete" ON receitas;
CREATE POLICY "receitas_admin_delete" ON receitas
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
        AND perfis.role = 'admin'
    )
  );

-- ────────────────────────────────────────────────────────────
-- EMBALAGENS: Admin pode inserir, editar e deletar embalagens
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "embalagens_admin_insert" ON embalagens;
CREATE POLICY "embalagens_admin_insert" ON embalagens
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
        AND perfis.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "embalagens_admin_update" ON embalagens;
CREATE POLICY "embalagens_admin_update" ON embalagens
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
        AND perfis.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "embalagens_admin_delete" ON embalagens;
CREATE POLICY "embalagens_admin_delete" ON embalagens
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
        AND perfis.role = 'admin'
    )
  );

-- ────────────────────────────────────────────────────────────
-- EQUIPAMENTOS: Admin pode inserir, editar e deletar equipamentos
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "equipamentos_admin_insert" ON equipamentos;
CREATE POLICY "equipamentos_admin_insert" ON equipamentos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
        AND perfis.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "equipamentos_admin_update" ON equipamentos;
CREATE POLICY "equipamentos_admin_update" ON equipamentos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
        AND perfis.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "equipamentos_admin_delete" ON equipamentos;
CREATE POLICY "equipamentos_admin_delete" ON equipamentos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
        AND perfis.role = 'admin'
    )
  );

-- ────────────────────────────────────────────────────────────
-- PRODUTOS: Admin pode inserir, editar e deletar produtos
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "produtos_admin_insert" ON produtos;
CREATE POLICY "produtos_admin_insert" ON produtos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
        AND perfis.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "produtos_admin_update" ON produtos;
CREATE POLICY "produtos_admin_update" ON produtos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
        AND perfis.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "produtos_admin_delete" ON produtos;
CREATE POLICY "produtos_admin_delete" ON produtos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
        AND perfis.role = 'admin'
    )
  );

-- ────────────────────────────────────────────────────────────
-- CONFIGURACOES: Admin pode inserir e editar configurações
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "configuracoes_admin_insert" ON configuracoes;
CREATE POLICY "configuracoes_admin_insert" ON configuracoes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
        AND perfis.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "configuracoes_admin_update" ON configuracoes;
CREATE POLICY "configuracoes_admin_update" ON configuracoes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
        AND perfis.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "configuracoes_admin_read" ON configuracoes;
CREATE POLICY "configuracoes_admin_read" ON configuracoes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
        AND perfis.role = 'admin'
    )
  );

-- ────────────────────────────────────────────────────────────
-- PERFIS: Admin pode editar perfis de outros usuários
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "perfis_admin_update" ON perfis;
CREATE POLICY "perfis_admin_update" ON perfis
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfis p2
      WHERE p2.id = auth.uid()
        AND p2.role = 'admin'
    )
  );

-- ══════════════════════════════════════════════════════════════════
-- Verificação: listar TODAS as políticas das tabelas afetadas
-- ══════════════════════════════════════════════════════════════════
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('insumos', 'receitas', 'embalagens', 'equipamentos', 'produtos', 'configuracoes', 'perfis')
ORDER BY tablename, policyname;
