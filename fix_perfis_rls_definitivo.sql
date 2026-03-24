-- ================================================================
-- ReceitasX · Correção DEFINITIVA do RLS da tabela perfis
-- Execute no Supabase Dashboard → SQL Editor
-- ================================================================

-- 1. Remove TODAS as políticas existentes na tabela perfis
DROP POLICY IF EXISTS "perfis_self"              ON perfis;
DROP POLICY IF EXISTS "perfis_admin_read"        ON perfis;
DROP POLICY IF EXISTS "Users can view own profile" ON perfis;
DROP POLICY IF EXISTS "Users can update own profile" ON perfis;
DROP POLICY IF EXISTS "Admins can view all profiles" ON perfis;
DROP POLICY IF EXISTS "Enable read access for all users" ON perfis;

-- 2. Cria (ou recria) a função get_my_role() como SECURITY DEFINER
-- (roda com privilégio do dono, ignora RLS → sem recursão)
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM perfis WHERE id = auth.uid()
$$;

-- 3. Garante que RLS está ativado na tabela
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

-- 4. Política: cada usuário acessa APENAS o próprio perfil (sem recursão)
CREATE POLICY "perfis_self"
  ON perfis
  FOR ALL
  USING  (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5. Política: admin pode ler TODOS os perfis (usa get_my_role() → sem recursão)
CREATE POLICY "perfis_admin_read"
  ON perfis
  FOR SELECT
  USING (
    auth.uid() = id
    OR get_my_role() = 'admin'
  );

-- 6. Garante que o usuário admin tem role correto
UPDATE perfis
SET role = 'admin'
WHERE id = 'f6b5a6fa-66bd-4dc3-ab69-eee4141ad6ee';

-- 7. Confirma
SELECT id, nome, role FROM perfis WHERE id = 'f6b5a6fa-66bd-4dc3-ab69-eee4141ad6ee';
