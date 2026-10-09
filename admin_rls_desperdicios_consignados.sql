-- ══════════════════════════════════════════════════════════════════
-- ReceitasX · Permissões de Leitura para Admin em Quebras e Consignados
-- Execute este script no Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- 1. Quebras e Desperdícios (desperdicios)
DROP POLICY IF EXISTS "desperdicios_admin_read" ON desperdicios;
CREATE POLICY "desperdicios_admin_read" ON desperdicios
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM perfis WHERE perfis.id = auth.uid() AND perfis.role = 'admin')
  );

-- 2. Consignados - Parceiros (consignados_parceiros)
DROP POLICY IF EXISTS "consignados_parceiros_admin_read" ON consignados_parceiros;
CREATE POLICY "consignados_parceiros_admin_read" ON consignados_parceiros
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM perfis WHERE perfis.id = auth.uid() AND perfis.role = 'admin')
  );

-- 3. Consignados - Estoque (consignados_estoque)
DROP POLICY IF EXISTS "consignados_estoque_admin_read" ON consignados_estoque;
CREATE POLICY "consignados_estoque_admin_read" ON consignados_estoque
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM perfis WHERE perfis.id = auth.uid() AND perfis.role = 'admin')
  );

-- 4. Consignados - Vendas (consignados_vendas)
DROP POLICY IF EXISTS "consignados_vendas_admin_read" ON consignados_vendas;
CREATE POLICY "consignados_vendas_admin_read" ON consignados_vendas
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM perfis WHERE perfis.id = auth.uid() AND perfis.role = 'admin')
  );

-- 5. Consignados - Fechamentos (consignados_fechamentos)
DROP POLICY IF EXISTS "consignados_fechamentos_admin_read" ON consignados_fechamentos;
CREATE POLICY "consignados_fechamentos_admin_read" ON consignados_fechamentos
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM perfis WHERE perfis.id = auth.uid() AND perfis.role = 'admin')
  );

-- 6. Consignados - Recolhimentos (consignados_recolhimentos)
DROP POLICY IF EXISTS "consignados_recolhimentos_admin_read" ON consignados_recolhimentos;
CREATE POLICY "consignados_recolhimentos_admin_read" ON consignados_recolhimentos
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM perfis WHERE perfis.id = auth.uid() AND perfis.role = 'admin')
  );
