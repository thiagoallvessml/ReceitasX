-- ══════════════════════════════════════════════════════════════════
-- Fix URGENTE: Corrigir recursive policy em "perfis"
-- Execute IMEDIATAMENTE no Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- 1. Remove TODAS as policies de perfis (para zerar o problema)
DROP POLICY IF EXISTS "perfis_self"       ON perfis;
DROP POLICY IF EXISTS "perfis_admin_read" ON perfis;

-- 2. Cria função SECURITY DEFINER para verificar role SEM acionar RLS
--    (bypassa o RLS, então não causa recursão)
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM perfis WHERE id = auth.uid()
$$;

-- 3. Policy principal: qualquer usuário acessa seu próprio perfil
CREATE POLICY "perfis_self" ON perfis
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Policy admin: usa a função SECURITY DEFINER para evitar recursão
CREATE POLICY "perfis_admin_read" ON perfis
  FOR SELECT
  USING (
    auth.uid() = id
    OR get_my_role() = 'admin'
  );

-- 5. Garante que seu role continua 'admin'
UPDATE perfis
SET role = 'admin'
WHERE id = 'f6b5a6fa-66bd-4dc3-ab69-eee4141ad6ee';

-- 6. Confirmação final
SELECT id, nome, role, plano FROM perfis
WHERE id = 'f6b5a6fa-66bd-4dc3-ab69-eee4141ad6ee';
