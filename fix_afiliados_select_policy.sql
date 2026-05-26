-- ================================================================
-- Fix: Policy de SELECT para afiliados lerem o próprio registro
-- Execute no Supabase Dashboard → SQL Editor
-- ================================================================

-- Policy: usuário autenticado pode LER o próprio registro
DROP POLICY IF EXISTS "afiliados_self_select" ON afiliados;
CREATE POLICY "afiliados_self_select"
  ON afiliados FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: anon pode LER (necessário para a chave anon do frontend)
DROP POLICY IF EXISTS "afiliados_anon_select" ON afiliados;
CREATE POLICY "afiliados_anon_select"
  ON afiliados FOR SELECT
  TO anon
  USING (true);

-- Verificação
SELECT policyname, cmd, roles, qual
FROM pg_policies
WHERE tablename = 'afiliados'
ORDER BY cmd;
