-- Corrigir RLS da tabela pedidos para permitir INSERT de usuários autenticados
-- Execute este SQL no Supabase SQL Editor

-- Remover policy existente (que só cobre SELECT/UPDATE/DELETE via USING)
DROP POLICY IF EXISTS "pedidos_self" ON pedidos;

-- Recriar policies separadas:

-- SELECT/UPDATE/DELETE: apenas o próprio usuário vê seus pedidos
CREATE POLICY "pedidos_select" ON pedidos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "pedidos_update" ON pedidos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "pedidos_delete" ON pedidos
  FOR DELETE USING (auth.uid() = user_id);

-- INSERT: qualquer usuário autenticado pode inserir (com o próprio user_id)
CREATE POLICY "pedidos_insert" ON pedidos
  FOR INSERT WITH CHECK (auth.uid() = user_id);
