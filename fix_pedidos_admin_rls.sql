-- ================================================================
-- ReceitasX · FIX: Policy de admin para tabela pedidos
-- Execute no Supabase Dashboard → SQL Editor
-- ================================================================

-- 0. Garantir colunas adicionadas após schema inicial
ALTER TABLE perfis
  ADD COLUMN IF NOT EXISTS plano_ativo_em TIMESTAMPTZ;

-- 1. Garantir que billing_id existe na tabela pedidos
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS billing_id TEXT;

-- 2. Remover policies antigas de pedidos (recriar limpas)
DROP POLICY IF EXISTS "pedidos_self"    ON pedidos;
DROP POLICY IF EXISTS "pedidos_select"  ON pedidos;
DROP POLICY IF EXISTS "pedidos_update"  ON pedidos;
DROP POLICY IF EXISTS "pedidos_delete"  ON pedidos;
DROP POLICY IF EXISTS "pedidos_insert"  ON pedidos;
DROP POLICY IF EXISTS "pedidos_admin"   ON pedidos;

-- 3. Policy para usuário comum: vê apenas seus próprios pedidos
CREATE POLICY "pedidos_self_select" ON pedidos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "pedidos_self_insert" ON pedidos
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "pedidos_self_update" ON pedidos
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. Policy para ADMIN: lê TODOS os pedidos (necessário para gestão de usuários)
CREATE POLICY "pedidos_admin_select" ON pedidos
  FOR SELECT USING (get_my_role() = 'admin');

-- 5. Verificar resultado
SELECT
  p.email,
  p.status,
  p.valor_pago,
  p.created_at
FROM pedidos p
ORDER BY p.created_at DESC
LIMIT 20;
